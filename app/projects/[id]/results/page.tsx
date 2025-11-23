import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalysisSummary } from "@/components/results/analysis-summary";
import { RecommendationsList } from "@/components/results/recommendations-list";
import { DownloadButtons } from "@/components/results/download-buttons";
import type { WasteWiseAnalyticsCompleteResult } from "@/lib/skills/types";

export default async function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    redirect("/dashboard");
  }

  // Get latest completed analysis job
  const { data: job, error: jobError } = await supabase
    .from("analysis_jobs")
    .select("*")
    .eq("project_id", params.id)
    .eq("job_type", "complete_analysis")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (jobError || !job || !job.result_data) {
    redirect(`/projects/${params.id}`);
  }

  // Type-safe result data
  const result = job.result_data as unknown as WasteWiseAnalyticsCompleteResult;

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{project.property_name}</h1>
        <p className="text-muted-foreground">
          Analysis completed{" "}
          {new Date(job.completed_at!).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div className="space-y-8">
        <DownloadButtons
          excelUrl={result.reports.excelWorkbook.downloadUrl}
          htmlUrl={result.reports.htmlDashboard.downloadUrl}
        />

        <AnalysisSummary summary={result.summary} />

        <RecommendationsList recommendations={result.recommendations} />
      </div>
    </div>
  );
}
