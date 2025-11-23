/**
 * Project Detail Page
 *
 * Shows project details, uploaded files, and analysis jobs
 * Allows file uploads and job creation
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  MapPin,
  Users,
  Package,
  FileText,
  PlayCircle,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { FileUploadSection } from "@/components/project/file-upload-section";
import { JobsList } from "@/components/project/jobs-list";
import { StartAnalysisButton } from "@/components/project/start-analysis-button";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

// Transform database jobs to API format
function transformJobsForDisplay(jobs: any[]) {
  return jobs.map((job) => ({
    id: job.id,
    projectId: job.project_id,
    jobType: job.job_type,
    status: job.status,
    progress: {
      percent: job.progress_percent,
      currentStep: job.current_step,
    },
    timing: {
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      durationSeconds: job.duration_seconds,
    },
    hasError: !!job.error_message,
    hasResult: !!job.result_data,
  }));
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch project with files and jobs
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_files(*),
      analysis_jobs(*)
    `,
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !project) {
    redirect("/projects");
  }

  const totalFiles = project.project_files?.length || 0;
  const totalJobs = project.analysis_jobs?.length || 0;
  const completedJobs =
    project.analysis_jobs?.filter((job: any) => job.status === "completed")
      .length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {project.property_name}
          </h1>
          <p className="text-muted-foreground">
            {project.city}, {project.state}
          </p>
        </div>
        <StartAnalysisButton projectId={project.id} />
      </div>

      {/* Property Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.city}, {project.state}
            </div>
            <p className="text-xs text-muted-foreground">Property location</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.units}</div>
            <p className="text-xs text-muted-foreground">Residential units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {project.equipment_type || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Equipment type</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">Uploaded documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">
            Files{" "}
            <Badge variant="secondary" className="ml-2">
              {totalFiles}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="jobs">
            Analysis Jobs{" "}
            <Badge variant="secondary" className="ml-2">
              {completedJobs}/{totalJobs}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <FileUploadSection
            projectId={project.id}
            existingFiles={project.project_files || []}
          />
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <JobsList
            projectId={project.id}
            jobs={transformJobsForDisplay(project.analysis_jobs || [])}
          />
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <CardDescription>
                Detailed information about this property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Property Name
                  </p>
                  <p className="text-base font-medium">
                    {project.property_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Property Type
                  </p>
                  <p className="text-base font-medium capitalize">
                    {project.property_type || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    City
                  </p>
                  <p className="text-base font-medium">{project.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    State
                  </p>
                  <p className="text-base font-medium">{project.state}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Units
                  </p>
                  <p className="text-base font-medium">{project.units}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Equipment Type
                  </p>
                  <p className="text-base font-medium capitalize">
                    {project.equipment_type || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Analysis Period
                  </p>
                  <p className="text-base font-medium">
                    {project.analysis_period_months
                      ? `${project.analysis_period_months} months`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge variant="secondary" className="capitalize">
                    {project.status || "Active"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
