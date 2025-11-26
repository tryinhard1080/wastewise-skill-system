


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."analysis_jobs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "job_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "progress_percent" integer DEFAULT 0,
    "current_step" "text",
    "total_steps" integer,
    "steps_completed" integer DEFAULT 0,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "estimated_completion" timestamp with time zone,
    "duration_seconds" integer,
    "input_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "result_data" "jsonb",
    "error_message" "text",
    "error_code" "text",
    "error_details" "jsonb",
    "failed_at" timestamp with time zone,
    "retry_count" integer DEFAULT 0,
    "max_retries" integer DEFAULT 3,
    "ai_requests" integer DEFAULT 0,
    "ai_tokens_input" integer DEFAULT 0,
    "ai_tokens_output" integer DEFAULT 0,
    "ai_cost_usd" numeric(10,6) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "analysis_jobs_job_type_check" CHECK (("job_type" = ANY (ARRAY['invoice_extraction'::"text", 'regulatory_research'::"text", 'complete_analysis'::"text", 'report_generation'::"text"]))),
    CONSTRAINT "analysis_jobs_progress_percent_check" CHECK ((("progress_percent" >= 0) AND ("progress_percent" <= 100))),
    CONSTRAINT "analysis_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."analysis_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."analysis_jobs" IS 'Tracks long-running AI analysis operations with progress and error handling';



COMMENT ON COLUMN "public"."analysis_jobs"."job_type" IS 'Type of analysis: invoice_extraction, regulatory_research, complete_analysis, report_generation';



COMMENT ON COLUMN "public"."analysis_jobs"."status" IS 'Current job status: pending, processing, completed, failed, cancelled';



COMMENT ON COLUMN "public"."analysis_jobs"."progress_percent" IS 'Progress percentage (0-100)';



COMMENT ON COLUMN "public"."analysis_jobs"."current_step" IS 'Human-readable description of current processing step';



COMMENT ON COLUMN "public"."analysis_jobs"."ai_cost_usd" IS 'Estimated cost of AI API calls for this job';



CREATE OR REPLACE FUNCTION "public"."claim_next_analysis_job"() RETURNS "public"."analysis_jobs"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  claimed_job analysis_jobs;
BEGIN
  -- Use FOR UPDATE SKIP LOCKED to claim job atomically
  -- This ensures only one worker can claim a specific job
  UPDATE analysis_jobs
  SET
    status = 'processing',
    started_at = NOW()
  WHERE id = (
    SELECT id
    FROM analysis_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING * INTO claimed_job;

  RETURN claimed_job;
END;
$$;


ALTER FUNCTION "public"."claim_next_analysis_job"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."claim_next_analysis_job"() IS 'Atomically claims the next pending analysis job using row-level locking to prevent race conditions between multiple workers';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_analysis_jobs"("days_to_keep" integer DEFAULT 30) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  deleted_count integer;
begin
  with deleted as (
    delete from analysis_jobs
    where status in ('completed', 'failed')
    and completed_at < now() - (days_to_keep || ' days')::interval
    returning id
  )
  select count(*) into deleted_count from deleted;

  return deleted_count;
end;
$$;


ALTER FUNCTION "public"."cleanup_old_analysis_jobs"("days_to_keep" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_analysis_job"("job_id" "uuid", "result" "jsonb", "ai_usage" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  job_started timestamp with time zone;
begin
  select started_at into job_started
  from analysis_jobs
  where id = job_id;

  update analysis_jobs
  set
    status = 'completed',
    progress_percent = 100,
    completed_at = now(),
    duration_seconds = extract(epoch from (now() - job_started))::integer,
    result_data = result,
    ai_requests = coalesce((ai_usage->>'requests')::integer, ai_requests),
    ai_tokens_input = coalesce((ai_usage->>'tokens_input')::integer, ai_tokens_input),
    ai_tokens_output = coalesce((ai_usage->>'tokens_output')::integer, ai_tokens_output),
    ai_cost_usd = coalesce((ai_usage->>'cost_usd')::numeric, ai_cost_usd),
    updated_at = now()
  where id = job_id;
end;
$$;


ALTER FUNCTION "public"."complete_analysis_job"("job_id" "uuid", "result" "jsonb", "ai_usage" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fail_analysis_job"("job_id" "uuid", "error_msg" "text", "error_cd" "text" DEFAULT 'UNKNOWN_ERROR'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  job_started timestamp with time zone;
  current_retries integer;
  max_retry integer;
begin
  select started_at, retry_count, max_retries
  into job_started, current_retries, max_retry
  from analysis_jobs
  where id = job_id;

  -- If retries remaining, set back to pending
  if current_retries < max_retry then
    update analysis_jobs
    set
      status = 'pending',
      retry_count = retry_count + 1,
      error_message = error_msg,
      error_code = error_cd,
      updated_at = now()
    where id = job_id;
  else
    -- No retries left, mark as failed
    update analysis_jobs
    set
      status = 'failed',
      completed_at = now(),
      duration_seconds = case
        when job_started is not null
        then extract(epoch from (now() - job_started))::integer
        else null
      end,
      error_message = error_msg,
      error_code = error_cd,
      updated_at = now()
    where id = job_id;
  end if;
end;
$$;


ALTER FUNCTION "public"."fail_analysis_job"("job_id" "uuid", "error_msg" "text", "error_cd" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_analysis_job"("job_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update analysis_jobs
  set
    status = 'processing',
    started_at = now(),
    updated_at = now()
  where id = job_id
  and status = 'pending';
end;
$$;


ALTER FUNCTION "public"."start_analysis_job"("job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_job_progress"("job_id" "uuid", "new_progress" integer, "step_name" "text" DEFAULT NULL::"text", "step_num" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update analysis_jobs
  set
    progress_percent = new_progress,
    current_step = coalesce(step_name, current_step),
    steps_completed = coalesce(step_num, steps_completed),
    updated_at = now()
  where id = job_id;
end;
$$;


ALTER FUNCTION "public"."update_job_progress"("job_id" "uuid", "new_progress" integer, "step_name" "text", "step_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_terms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "source_file_id" "uuid",
    "contract_start_date" "date",
    "contract_end_date" "date",
    "term_length_years" numeric(5,2),
    "clauses" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "calendar_reminders" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contract_terms" OWNER TO "postgres";


COMMENT ON TABLE "public"."contract_terms" IS 'Extracted contract clauses and reminders';



CREATE TABLE IF NOT EXISTS "public"."haul_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "invoice_id" "uuid",
    "haul_date" "date" NOT NULL,
    "tonnage" numeric(10,3) NOT NULL,
    "days_since_last" integer,
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "haul_log_status_check" CHECK (("status" = ANY (ARRAY['normal'::"text", 'low_utilization'::"text", 'high_utilization'::"text"]))),
    CONSTRAINT "haul_log_tonnage_check" CHECK (("tonnage" > (0)::numeric))
);


ALTER TABLE "public"."haul_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."haul_log" IS 'Tonnage tracking for compactor services only';



CREATE TABLE IF NOT EXISTS "public"."invoice_data" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "source_file_id" "uuid",
    "invoice_number" "text",
    "invoice_date" "date" NOT NULL,
    "vendor_name" "text" NOT NULL,
    "service_type" "text",
    "total_amount" numeric(10,2) NOT NULL,
    "tonnage" numeric(10,3),
    "hauls" integer,
    "charges" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoice_data" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoice_data" IS 'Extracted invoice information from AI processing';



CREATE TABLE IF NOT EXISTS "public"."optimizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "opportunity_type" "text" NOT NULL,
    "recommend" boolean DEFAULT false NOT NULL,
    "priority" integer,
    "title" "text" NOT NULL,
    "description" "text",
    "calculation_breakdown" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "contact_info" "jsonb",
    "implementation_timeline" "text",
    "confidence" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "optimizations_confidence_check" CHECK (("confidence" = ANY (ARRAY['HIGH'::"text", 'MEDIUM'::"text", 'LOW'::"text"]))),
    CONSTRAINT "optimizations_opportunity_type_check" CHECK (("opportunity_type" = ANY (ARRAY['compactor_monitors'::"text", 'contamination_reduction'::"text", 'bulk_subscription'::"text", 'other'::"text"]))),
    CONSTRAINT "optimizations_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 5)))
);


ALTER TABLE "public"."optimizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."optimizations" IS 'Calculated savings opportunities';



CREATE TABLE IF NOT EXISTS "public"."ordinance_database" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "location_key" "text" NOT NULL,
    "confidence" "text",
    "primary_source" "text",
    "recycling_mandatory" boolean DEFAULT false,
    "threshold_units" integer,
    "capacity_requirement" "text",
    "service_frequency" "text",
    "composting_required" boolean DEFAULT false,
    "composting_effective_date" "date",
    "composting_threshold_units" integer,
    "accepted_materials" "jsonb" DEFAULT '[]'::"jsonb",
    "penalties" "jsonb" DEFAULT '{}'::"jsonb",
    "licensed_haulers" "jsonb" DEFAULT '[]'::"jsonb",
    "contacts" "jsonb" DEFAULT '{}'::"jsonb",
    "last_verified" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ordinance_database_confidence_check" CHECK (("confidence" = ANY (ARRAY['HIGH'::"text", 'MEDIUM'::"text", 'LOW'::"text"])))
);


ALTER TABLE "public"."ordinance_database" OWNER TO "postgres";


COMMENT ON TABLE "public"."ordinance_database" IS 'Cached ordinance data to minimize API calls';



CREATE TABLE IF NOT EXISTS "public"."project_files" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "storage_path" "text" NOT NULL,
    "processing_status" "text" DEFAULT 'pending'::"text",
    "processing_error" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_files_file_type_check" CHECK (("file_type" = ANY (ARRAY['invoice'::"text", 'contract'::"text", 'csv'::"text", 'other'::"text"]))),
    CONSTRAINT "project_files_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."project_files" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_files" IS 'Uploaded invoices and contracts';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_name" "text" NOT NULL,
    "units" integer NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "property_type" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "progress" integer DEFAULT 0,
    "total_savings" numeric(10,2) DEFAULT 0,
    "equipment_type" "text",
    "analysis_period_months" integer,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "projects_equipment_type_check" CHECK (("equipment_type" = ANY (ARRAY['COMPACTOR'::"text", 'DUMPSTER'::"text", 'MIXED'::"text"]))),
    CONSTRAINT "projects_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "projects_property_type_check" CHECK (("property_type" = ANY (ARRAY['Garden-Style'::"text", 'Mid-Rise'::"text", 'High-Rise'::"text"]))),
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "projects_units_check" CHECK ((("units" >= 10) AND ("units" <= 2000)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'Main project records for waste analysis';



CREATE TABLE IF NOT EXISTS "public"."regulatory_compliance" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "confidence_score" "text",
    "sources_consulted" "jsonb" DEFAULT '[]'::"jsonb",
    "waste_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "recycling_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "composting_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "penalties" "jsonb" DEFAULT '{}'::"jsonb",
    "licensed_haulers" "jsonb" DEFAULT '[]'::"jsonb",
    "regulatory_contacts" "jsonb" DEFAULT '{}'::"jsonb",
    "cached_data" boolean DEFAULT false,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "regulatory_compliance_confidence_score_check" CHECK (("confidence_score" = ANY (ARRAY['HIGH'::"text", 'MEDIUM'::"text", 'LOW'::"text"])))
);


ALTER TABLE "public"."regulatory_compliance" OWNER TO "postgres";


COMMENT ON TABLE "public"."regulatory_compliance" IS 'Researched ordinance requirements per project';



CREATE TABLE IF NOT EXISTS "public"."skills_config" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "skill_name" "text" NOT NULL,
    "skill_version" "text" NOT NULL,
    "conversion_rates" "jsonb" NOT NULL,
    "thresholds" "jsonb" NOT NULL,
    "enabled" boolean DEFAULT true,
    "last_validated" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."skills_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."skills_config" IS 'CRITICAL: Conversion rates and thresholds for all skills - ensures consistency';



COMMENT ON COLUMN "public"."skills_config"."conversion_rates" IS 'MUST BE: {"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.5}';



COMMENT ON COLUMN "public"."skills_config"."thresholds" IS 'MUST BE: {"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}';



ALTER TABLE ONLY "public"."analysis_jobs"
    ADD CONSTRAINT "analysis_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_terms"
    ADD CONSTRAINT "contract_terms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."haul_log"
    ADD CONSTRAINT "haul_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_data"
    ADD CONSTRAINT "invoice_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."optimizations"
    ADD CONSTRAINT "optimizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ordinance_database"
    ADD CONSTRAINT "ordinance_database_location_key_key" UNIQUE ("location_key");



ALTER TABLE ONLY "public"."ordinance_database"
    ADD CONSTRAINT "ordinance_database_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regulatory_compliance"
    ADD CONSTRAINT "regulatory_compliance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skills_config"
    ADD CONSTRAINT "skills_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skills_config"
    ADD CONSTRAINT "skills_config_skill_name_key" UNIQUE ("skill_name");



CREATE INDEX "idx_analysis_jobs_created_at" ON "public"."analysis_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_analysis_jobs_pending_queue" ON "public"."analysis_jobs" USING "btree" ("status", "created_at") WHERE ("status" = 'pending'::"text");



COMMENT ON INDEX "public"."idx_analysis_jobs_pending_queue" IS 'Composite index for worker polling - optimizes "WHERE status = pending ORDER BY created_at" queries';



CREATE INDEX "idx_analysis_jobs_project" ON "public"."analysis_jobs" USING "btree" ("project_id", "created_at" DESC);



COMMENT ON INDEX "public"."idx_analysis_jobs_project" IS 'Optimizes project history queries';



CREATE INDEX "idx_analysis_jobs_project_id" ON "public"."analysis_jobs" USING "btree" ("project_id");



CREATE INDEX "idx_analysis_jobs_status" ON "public"."analysis_jobs" USING "btree" ("status");



CREATE INDEX "idx_analysis_jobs_user_id" ON "public"."analysis_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_analysis_jobs_user_status" ON "public"."analysis_jobs" USING "btree" ("user_id", "status");



COMMENT ON INDEX "public"."idx_analysis_jobs_user_status" IS 'Optimizes user dashboard queries filtering by user_id and status';



CREATE INDEX "idx_contract_terms_project_id" ON "public"."contract_terms" USING "btree" ("project_id");



CREATE INDEX "idx_haul_log_date" ON "public"."haul_log" USING "btree" ("haul_date");



CREATE INDEX "idx_haul_log_project_date" ON "public"."haul_log" USING "btree" ("project_id", "haul_date" DESC);



COMMENT ON INDEX "public"."idx_haul_log_project_date" IS 'Optimizes haul log retrieval for analysis skills';



CREATE INDEX "idx_haul_log_project_id" ON "public"."haul_log" USING "btree" ("project_id");



CREATE INDEX "idx_invoice_data_date" ON "public"."invoice_data" USING "btree" ("invoice_date");



CREATE INDEX "idx_invoice_data_project_date" ON "public"."invoice_data" USING "btree" ("project_id", "invoice_date" DESC);



COMMENT ON INDEX "public"."idx_invoice_data_project_date" IS 'Optimizes invoice retrieval for analysis skills';



CREATE INDEX "idx_invoice_data_project_id" ON "public"."invoice_data" USING "btree" ("project_id");



CREATE INDEX "idx_invoice_data_vendor" ON "public"."invoice_data" USING "btree" ("vendor_name");



CREATE INDEX "idx_optimizations_project_id" ON "public"."optimizations" USING "btree" ("project_id");



CREATE INDEX "idx_optimizations_type" ON "public"."optimizations" USING "btree" ("opportunity_type");



CREATE INDEX "idx_ordinance_location_key" ON "public"."ordinance_database" USING "btree" ("location_key");



CREATE INDEX "idx_project_files_project_id" ON "public"."project_files" USING "btree" ("project_id");



CREATE INDEX "idx_project_files_type" ON "public"."project_files" USING "btree" ("file_type");



CREATE INDEX "idx_projects_created_at" ON "public"."projects" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_projects_user_id" ON "public"."projects" USING "btree" ("user_id");



CREATE INDEX "idx_regulatory_city_state" ON "public"."regulatory_compliance" USING "btree" ("city", "state");



CREATE INDEX "idx_regulatory_project_id" ON "public"."regulatory_compliance" USING "btree" ("project_id");



CREATE INDEX "idx_skills_config_name" ON "public"."skills_config" USING "btree" ("skill_name");



CREATE OR REPLACE TRIGGER "set_analysis_jobs_updated_at" BEFORE UPDATE ON "public"."analysis_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_skills_config_updated_at" BEFORE UPDATE ON "public"."skills_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."analysis_jobs"
    ADD CONSTRAINT "analysis_jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analysis_jobs"
    ADD CONSTRAINT "analysis_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_terms"
    ADD CONSTRAINT "contract_terms_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_terms"
    ADD CONSTRAINT "contract_terms_source_file_id_fkey" FOREIGN KEY ("source_file_id") REFERENCES "public"."project_files"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."haul_log"
    ADD CONSTRAINT "haul_log_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice_data"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."haul_log"
    ADD CONSTRAINT "haul_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_data"
    ADD CONSTRAINT "invoice_data_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_data"
    ADD CONSTRAINT "invoice_data_source_file_id_fkey" FOREIGN KEY ("source_file_id") REFERENCES "public"."project_files"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."optimizations"
    ADD CONSTRAINT "optimizations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_files"
    ADD CONSTRAINT "project_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."regulatory_compliance"
    ADD CONSTRAINT "regulatory_compliance_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view ordinances" ON "public"."ordinance_database" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view skills config" ON "public"."skills_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Service role can insert ordinances" ON "public"."ordinance_database" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage all jobs" ON "public"."analysis_jobs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage skills config" ON "public"."skills_config" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can update ordinances" ON "public"."ordinance_database" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create jobs" ON "public"."analysis_jobs" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "analysis_jobs"."project_id") AND ("projects"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own jobs" ON "public"."analysis_jobs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own jobs" ON "public"."analysis_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users create own contract terms" ON "public"."contract_terms" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "contract_terms"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users create own haul log" ON "public"."haul_log" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "haul_log"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users create own invoice data" ON "public"."invoice_data" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "invoice_data"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users create own optimizations" ON "public"."optimizations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "optimizations"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users create own project files" ON "public"."project_files" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_files"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users create own projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users create own regulatory compliance" ON "public"."regulatory_compliance" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "regulatory_compliance"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users delete own projects" ON "public"."projects" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own projects" ON "public"."projects" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own contract terms" ON "public"."contract_terms" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "contract_terms"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users view own haul log" ON "public"."haul_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "haul_log"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users view own invoice data" ON "public"."invoice_data" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "invoice_data"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users view own optimizations" ON "public"."optimizations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "optimizations"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users view own project files" ON "public"."project_files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "project_files"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users view own projects" ON "public"."projects" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own regulatory compliance" ON "public"."regulatory_compliance" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects"
  WHERE (("projects"."id" = "regulatory_compliance"."project_id") AND ("projects"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."analysis_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_terms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."haul_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."optimizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ordinance_database" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regulatory_compliance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skills_config" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."analysis_jobs" TO "anon";
GRANT ALL ON TABLE "public"."analysis_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."analysis_jobs" TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_next_analysis_job"() TO "anon";
GRANT ALL ON FUNCTION "public"."claim_next_analysis_job"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_next_analysis_job"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_analysis_jobs"("days_to_keep" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_analysis_jobs"("days_to_keep" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_analysis_jobs"("days_to_keep" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_analysis_job"("job_id" "uuid", "result" "jsonb", "ai_usage" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_analysis_job"("job_id" "uuid", "result" "jsonb", "ai_usage" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_analysis_job"("job_id" "uuid", "result" "jsonb", "ai_usage" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."fail_analysis_job"("job_id" "uuid", "error_msg" "text", "error_cd" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fail_analysis_job"("job_id" "uuid", "error_msg" "text", "error_cd" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fail_analysis_job"("job_id" "uuid", "error_msg" "text", "error_cd" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_analysis_job"("job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."start_analysis_job"("job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_analysis_job"("job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_job_progress"("job_id" "uuid", "new_progress" integer, "step_name" "text", "step_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_job_progress"("job_id" "uuid", "new_progress" integer, "step_name" "text", "step_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_job_progress"("job_id" "uuid", "new_progress" integer, "step_name" "text", "step_num" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."contract_terms" TO "anon";
GRANT ALL ON TABLE "public"."contract_terms" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_terms" TO "service_role";



GRANT ALL ON TABLE "public"."haul_log" TO "anon";
GRANT ALL ON TABLE "public"."haul_log" TO "authenticated";
GRANT ALL ON TABLE "public"."haul_log" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_data" TO "anon";
GRANT ALL ON TABLE "public"."invoice_data" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_data" TO "service_role";



GRANT ALL ON TABLE "public"."optimizations" TO "anon";
GRANT ALL ON TABLE "public"."optimizations" TO "authenticated";
GRANT ALL ON TABLE "public"."optimizations" TO "service_role";



GRANT ALL ON TABLE "public"."ordinance_database" TO "anon";
GRANT ALL ON TABLE "public"."ordinance_database" TO "authenticated";
GRANT ALL ON TABLE "public"."ordinance_database" TO "service_role";



GRANT ALL ON TABLE "public"."project_files" TO "anon";
GRANT ALL ON TABLE "public"."project_files" TO "authenticated";
GRANT ALL ON TABLE "public"."project_files" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."regulatory_compliance" TO "anon";
GRANT ALL ON TABLE "public"."regulatory_compliance" TO "authenticated";
GRANT ALL ON TABLE "public"."regulatory_compliance" TO "service_role";



GRANT ALL ON TABLE "public"."skills_config" TO "anon";
GRANT ALL ON TABLE "public"."skills_config" TO "authenticated";
GRANT ALL ON TABLE "public"."skills_config" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







