-- WasteWise Initial Database Schema
-- Created: 2025-11-14
-- Description: Creates all 9 tables for WasteWise SaaS platform

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ===========================
-- PROJECTS TABLE
-- ===========================
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  property_name text not null,
  units integer not null check (units between 10 and 2000),
  city text not null,
  state text not null,
  property_type text check (property_type in ('Garden-Style', 'Mid-Rise', 'High-Rise')),
  status text default 'draft' check (status in ('draft', 'processing', 'completed', 'failed', 'cancelled')),
  progress integer default 0 check (progress between 0 and 100),
  total_savings numeric(10,2) default 0,
  equipment_type text check (equipment_type in ('COMPACTOR', 'DUMPSTER', 'MIXED')),
  analysis_period_months integer,
  error_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_projects_user_id on projects(user_id);
create index idx_projects_status on projects(status);
create index idx_projects_created_at on projects(created_at desc);

-- ===========================
-- PROJECT FILES TABLE
-- ===========================
create table project_files (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  file_name text not null,
  file_type text not null check (file_type in ('invoice', 'contract', 'csv', 'other')),
  file_size integer,
  mime_type text,
  storage_path text not null,
  processing_status text default 'pending' check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  processing_error text,
  uploaded_at timestamp with time zone default now()
);

create index idx_project_files_project_id on project_files(project_id);
create index idx_project_files_type on project_files(file_type);

-- ===========================
-- INVOICE DATA TABLE
-- ===========================
create table invoice_data (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  source_file_id uuid references project_files on delete set null,
  invoice_number text,
  invoice_date date not null,
  vendor_name text not null,
  service_type text,
  total_amount numeric(10,2) not null,
  tonnage numeric(10,3),
  hauls integer,
  charges jsonb default '{}'::jsonb,
  -- JSON structure:
  -- {
  --   "disposal": 850.00,
  --   "pickup_fees": 200.00,
  --   "rental": 150.00,
  --   "contamination": 50.00,
  --   "bulk_service": 100.00,
  --   "other": 38.51
  -- }
  notes text,
  created_at timestamp with time zone default now()
);

create index idx_invoice_data_project_id on invoice_data(project_id);
create index idx_invoice_data_date on invoice_data(invoice_date);
create index idx_invoice_data_vendor on invoice_data(vendor_name);

-- ===========================
-- HAUL LOG TABLE (Compactors Only)
-- ===========================
create table haul_log (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  invoice_id uuid references invoice_data on delete set null,
  haul_date date not null,
  tonnage numeric(10,3) not null check (tonnage > 0),
  days_since_last integer,
  status text check (status in ('normal', 'low_utilization', 'high_utilization')),
  created_at timestamp with time zone default now()
);

create index idx_haul_log_project_id on haul_log(project_id);
create index idx_haul_log_date on haul_log(haul_date);

-- ===========================
-- OPTIMIZATION OPPORTUNITIES TABLE
-- ===========================
create table optimizations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  opportunity_type text not null check (opportunity_type in ('compactor_monitors', 'contamination_reduction', 'bulk_subscription', 'other')),
  recommend boolean not null default false,
  priority integer check (priority between 1 and 5),
  title text not null,
  description text,
  calculation_breakdown jsonb not null default '{}'::jsonb,
  -- JSON structure:
  -- {
  --   "current_avg_tons_per_haul": 5.2,
  --   "target_tons_per_haul": 8.5,
  --   "capacity_utilization_current": 61.2,
  --   "current_annual_hauls": 156,
  --   "optimized_annual_hauls": 95,
  --   "hauls_eliminated": 61,
  --   "cost_per_haul": 850.00,
  --   "gross_annual_savings": 51850.00,
  --   "installation_cost": 300.00,
  --   "annual_monitoring_cost": 2400.00,
  --   "net_year1_savings": 49150.00,
  --   "net_annual_savings_year2plus": 49450.00,
  --   "roi_percent": 1819.44,
  --   "payback_months": 0.7
  -- }
  contact_info jsonb,
  implementation_timeline text,
  confidence text check (confidence in ('HIGH', 'MEDIUM', 'LOW')),
  created_at timestamp with time zone default now()
);

create index idx_optimizations_project_id on optimizations(project_id);
create index idx_optimizations_type on optimizations(opportunity_type);

-- ===========================
-- CONTRACT TERMS TABLE
-- ===========================
create table contract_terms (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  source_file_id uuid references project_files on delete set null,
  contract_start_date date,
  contract_end_date date,
  term_length_years numeric(5,2),
  clauses jsonb not null default '{}'::jsonb,
  -- JSON structure:
  -- {
  --   "Term & Renewal": [...],
  --   "Rate Increases": [...],
  --   "Termination": [...],
  --   "Liability": [...],
  --   "Service Level": [...],
  --   "Force Majeure": [...],
  --   "Indemnification": [...]
  -- }
  calendar_reminders jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create index idx_contract_terms_project_id on contract_terms(project_id);

-- ===========================
-- REGULATORY COMPLIANCE TABLE
-- ===========================
create table regulatory_compliance (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade not null,
  city text not null,
  state text not null,
  confidence_score text check (confidence_score in ('HIGH', 'MEDIUM', 'LOW')),
  sources_consulted jsonb default '[]'::jsonb,
  waste_requirements jsonb default '{}'::jsonb,
  recycling_requirements jsonb default '{}'::jsonb,
  composting_requirements jsonb default '{}'::jsonb,
  penalties jsonb default '{}'::jsonb,
  licensed_haulers jsonb default '[]'::jsonb,
  regulatory_contacts jsonb default '{}'::jsonb,
  cached_data boolean default false,
  last_updated timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create index idx_regulatory_city_state on regulatory_compliance(city, state);
create index idx_regulatory_project_id on regulatory_compliance(project_id);

-- ===========================
-- ORDINANCE DATABASE (Cache)
-- ===========================
create table ordinance_database (
  id uuid primary key default uuid_generate_v4(),
  city text not null,
  state text not null,
  location_key text unique not null, -- city_state format
  confidence text check (confidence in ('HIGH', 'MEDIUM', 'LOW')),
  primary_source text,
  recycling_mandatory boolean default false,
  threshold_units integer,
  capacity_requirement text,
  service_frequency text,
  composting_required boolean default false,
  composting_effective_date date,
  composting_threshold_units integer,
  accepted_materials jsonb default '[]'::jsonb,
  penalties jsonb default '{}'::jsonb,
  licensed_haulers jsonb default '[]'::jsonb,
  contacts jsonb default '{}'::jsonb,
  last_verified timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create index idx_ordinance_location_key on ordinance_database(location_key);

-- ===========================
-- SKILLS CONFIGURATION TABLE
-- CRITICAL for conversion rate consistency
-- ===========================
create table skills_config (
  id uuid primary key default uuid_generate_v4(),
  skill_name text unique not null,
  skill_version text not null,
  conversion_rates jsonb not null,
  -- CRITICAL values:
  -- {
  --   "compactor_ypd": 14.49,
  --   "dumpster_ypd": 4.33,
  --   "target_capacity": 8.0
  -- }
  thresholds jsonb not null,
  -- CRITICAL values:
  -- {
  --   "compactor_tons": 7.0,
  --   "contamination_pct": 3.0,
  --   "bulk_monthly": 500,
  --   "leaseup_variance": -40
  -- }
  enabled boolean default true,
  last_validated timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_skills_config_name on skills_config(skill_name);

-- ===========================
-- SEED SKILLS CONFIGURATION
-- ===========================
insert into skills_config (skill_name, skill_version, conversion_rates, thresholds) values
('wastewise-analytics', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb),
('compactor-optimization', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb),
('contract-extractor', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb),
('regulatory-research', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb),
('batch-extractor', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb);

-- ===========================
-- ROW LEVEL SECURITY (RLS)
-- ===========================

-- Projects
alter table projects enable row level security;

create policy "Users view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users create own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users delete own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- Project Files
alter table project_files enable row level security;

create policy "Users view own project files"
  on project_files for select
  using (exists (
    select 1 from projects
    where projects.id = project_files.project_id
    and projects.user_id = auth.uid()
  ));

create policy "Users create own project files"
  on project_files for insert
  with check (exists (
    select 1 from projects
    where projects.id = project_files.project_id
    and projects.user_id = auth.uid()
  ));

-- Invoice Data
alter table invoice_data enable row level security;

create policy "Users view own invoice data"
  on invoice_data for select
  using (exists (
    select 1 from projects
    where projects.id = invoice_data.project_id
    and projects.user_id = auth.uid()
  ));

create policy "Users create own invoice data"
  on invoice_data for insert
  with check (exists (
    select 1 from projects
    where projects.id = invoice_data.project_id
    and projects.user_id = auth.uid()
  ));

-- Haul Log
alter table haul_log enable row level security;

create policy "Users view own haul log"
  on haul_log for select
  using (exists (
    select 1 from projects
    where projects.id = haul_log.project_id
    and projects.user_id = auth.uid()
  ));

create policy "Users create own haul log"
  on haul_log for insert
  with check (exists (
    select 1 from projects
    where projects.id = haul_log.project_id
    and projects.user_id = auth.uid()
  ));

-- Optimizations
alter table optimizations enable row level security;

create policy "Users view own optimizations"
  on optimizations for select
  using (exists (
    select 1 from projects
    where projects.id = optimizations.project_id
    and projects.user_id = auth.uid()
  ));

create policy "Users create own optimizations"
  on optimizations for insert
  with check (exists (
    select 1 from projects
    where projects.id = optimizations.project_id
    and projects.user_id = auth.uid()
  ));

-- Contract Terms
alter table contract_terms enable row level security;

create policy "Users view own contract terms"
  on contract_terms for select
  using (exists (
    select 1 from projects
    where projects.id = contract_terms.project_id
    and projects.user_id = auth.uid()
  ));

create policy "Users create own contract terms"
  on contract_terms for insert
  with check (exists (
    select 1 from projects
    where projects.id = contract_terms.project_id
    and projects.user_id = auth.uid()
  ));

-- Regulatory Compliance
alter table regulatory_compliance enable row level security;

create policy "Users view own regulatory compliance"
  on regulatory_compliance for select
  using (exists (
    select 1 from projects
    where projects.id = regulatory_compliance.project_id
    and projects.user_id = auth.uid()
  ));

create policy "Users create own regulatory compliance"
  on regulatory_compliance for insert
  with check (exists (
    select 1 from projects
    where projects.id = regulatory_compliance.project_id
    and projects.user_id = auth.uid()
  ));

-- Ordinance Database (Public Read, Admin Write)
alter table ordinance_database enable row level security;

create policy "Anyone can view ordinances"
  on ordinance_database for select
  to authenticated
  using (true);

create policy "Service role can insert ordinances"
  on ordinance_database for insert
  to service_role
  with check (true);

create policy "Service role can update ordinances"
  on ordinance_database for update
  to service_role
  using (true)
  with check (true);

-- Skills Config (Public Read, Admin Write)
alter table skills_config enable row level security;

create policy "Anyone can view skills config"
  on skills_config for select
  to authenticated
  using (true);

create policy "Service role can manage skills config"
  on skills_config for all
  to service_role
  using (true)
  with check (true);

-- ===========================
-- TRIGGERS FOR UPDATED_AT
-- ===========================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_projects_updated_at before update on projects
  for each row execute function update_updated_at_column();

create trigger update_skills_config_updated_at before update on skills_config
  for each row execute function update_updated_at_column();

-- ===========================
-- COMMENTS FOR DOCUMENTATION
-- ===========================

comment on table projects is 'Main project records for waste analysis';
comment on table project_files is 'Uploaded invoices and contracts';
comment on table invoice_data is 'Extracted invoice information from AI processing';
comment on table haul_log is 'Tonnage tracking for compactor services only';
comment on table optimizations is 'Calculated savings opportunities';
comment on table contract_terms is 'Extracted contract clauses and reminders';
comment on table regulatory_compliance is 'Researched ordinance requirements per project';
comment on table ordinance_database is 'Cached ordinance data to minimize API calls';
comment on table skills_config is 'CRITICAL: Conversion rates and thresholds for all skills - ensures consistency';

comment on column skills_config.conversion_rates is 'MUST BE: {"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}';
comment on column skills_config.thresholds is 'MUST BE: {"compactor_tons": 7.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}';
