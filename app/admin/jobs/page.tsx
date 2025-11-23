/**
 * Job Queue Monitoring Page
 *
 * Monitor and manage background jobs
 */

"use client";

import { JobQueue } from "@/components/admin/JobQueue";
import { StatsCard } from "@/components/admin/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useJobs,
  useJobStats,
  retryJob,
  deleteJob,
} from "@/lib/hooks/useAdminData";
import { toast } from "sonner";
import { Briefcase, CheckCircle, XCircle, Clock } from "lucide-react";

export default function JobsPage() {
  const { data: jobsData, isLoading, mutate } = useJobs();
  const { data: stats, isLoading: statsLoading } = useJobStats();

  const handleRetry = async (jobId: string) => {
    try {
      await retryJob(jobId);
      toast.success("Job retry initiated");
      mutate();
    } catch (error) {
      toast.error("Failed to retry job");
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      toast.success("Job deleted successfully");
      mutate();
    } catch (error) {
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Queue</h1>
        <p className="text-gray-500 mt-2">
          Monitor and manage background processing jobs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Jobs"
              value={stats?.total || 0}
              icon={Briefcase}
              variant="default"
            />
            <StatsCard
              title="Processing"
              value={stats?.by_status?.processing || 0}
              icon={Clock}
              variant="default"
            />
            <StatsCard
              title="Completed"
              value={stats?.by_status?.completed || 0}
              icon={CheckCircle}
              variant="success"
            />
            <StatsCard
              title="Failed"
              value={stats?.by_status?.failed || 0}
              icon={XCircle}
              variant={stats?.by_status?.failed > 0 ? "danger" : "default"}
            />
          </>
        )}
      </div>

      {/* Job Queue Table */}
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <JobQueue
          jobs={jobsData?.jobs || []}
          onRetry={handleRetry}
          onDelete={handleDelete}
          onRefresh={mutate}
          autoRefresh
        />
      )}
    </div>
  );
}
