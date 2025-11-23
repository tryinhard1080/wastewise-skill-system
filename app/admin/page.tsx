/**
 * Admin Dashboard Overview
 *
 * Displays key metrics, recent activity, and quick actions
 */

"use client";

import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useUsers,
  useJobStats,
  useSystemHealth,
  useAuditLogs,
} from "@/lib/hooks/useAdminData";
import { Users, Briefcase, XCircle, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: jobStats, isLoading: jobsLoading } = useJobStats();
  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const { data: auditLogs, isLoading: auditLoading } = useAuditLogs();

  const totalUsers = usersData?.users?.length || 0;
  const activeJobs = jobStats?.by_status?.processing || 0;
  const failedJobs24h = jobStats?.failed_24h || 0;
  const systemHealthy = health?.overall_status === "healthy";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Monitor users, jobs, and system health
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {usersLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <StatsCard
            title="Total Users"
            value={totalUsers}
            icon={Users}
            variant="default"
            description="Registered accounts"
          />
        )}

        {jobsLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <StatsCard
            title="Active Jobs"
            value={activeJobs}
            icon={Briefcase}
            variant="default"
            description="Currently processing"
          />
        )}

        {jobsLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <StatsCard
            title="Failed Jobs (24h)"
            value={failedJobs24h}
            icon={XCircle}
            variant={failedJobs24h > 0 ? "danger" : "success"}
            description="Last 24 hours"
          />
        )}

        {healthLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <StatsCard
            title="System Health"
            value={systemHealthy ? "Healthy" : "Degraded"}
            icon={Activity}
            variant={systemHealthy ? "success" : "warning"}
            description="All services"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/audit">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : auditLogs?.logs?.length > 0 ? (
              <div className="space-y-4">
                {auditLogs.logs.slice(0, 5).map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.action}</Badge>
                        <span className="text-sm text-gray-600">
                          {log.admin_email}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {log.target_type} • {log.target_id.slice(0, 8)}...
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/jobs">
                <Briefcase className="h-4 w-4 mr-2" />
                View Job Queue
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/system">
                <Activity className="h-4 w-4 mr-2" />
                System Health
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status Summary */}
      {!healthLoading && health && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(health.services || {}).map(
                ([service, status]: [string, any]) => (
                  <div
                    key={service}
                    className="flex items-center gap-2 p-3 border rounded-lg"
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        status === "healthy"
                          ? "bg-green-500"
                          : status === "degraded"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm font-medium capitalize">
                      {service}
                    </span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
