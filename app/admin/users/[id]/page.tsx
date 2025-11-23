/**
 * User Detail Page
 *
 * View detailed information about a specific user
 */

"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useUser,
  useJobs,
  useAuditLogs,
  disableUser,
  enableUser,
} from "@/lib/hooks/useAdminData";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Ban, CheckCircle } from "lucide-react";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: userData, isLoading: userLoading, mutate } = useUser(id);
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ userId: id });
  const { data: auditData, isLoading: auditLoading } = useAuditLogs();

  const user = userData?.user;

  const handleToggleStatus = async () => {
    if (!user) return;

    try {
      if (user.is_active) {
        await disableUser(id);
        toast.success("User disabled successfully");
      } else {
        await enableUser(id);
        toast.success("User enabled successfully");
      }
      mutate();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <p className="text-gray-500 mt-2">
          The user you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/admin/users">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Link>
      </Button>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{user.email}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={user.role === "admin" ? "destructive" : "secondary"}
                >
                  {user.role}
                </Badge>
                <Badge variant={user.is_active ? "default" : "outline"}>
                  {user.is_active ? "Active" : "Disabled"}
                </Badge>
              </div>
            </div>
            <Button
              variant={user.is_active ? "destructive" : "default"}
              onClick={handleToggleStatus}
            >
              {user.is_active ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Disable User
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enable User
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">User ID</div>
              <div className="text-sm font-mono mt-1">{user.id}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Created</div>
              <div className="text-sm mt-1">
                {formatDistanceToNow(new Date(user.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                Total Projects
              </div>
              <div className="text-sm mt-1">{user.project_count || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                Total Jobs
              </div>
              <div className="text-sm mt-1">{jobsData?.jobs?.length || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {user.projects?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.projects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.property_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{project.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(project.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No projects yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <Skeleton className="h-48" />
          ) : jobsData?.jobs?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsData.jobs.slice(0, 10).map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {job.job_type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          job.status === "completed"
                            ? "default"
                            : job.status === "failed"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(job.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {job.completed_at
                        ? `${Math.round(
                            (new Date(job.completed_at).getTime() -
                              new Date(job.created_at).getTime()) /
                              1000,
                          )}s`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No jobs yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
