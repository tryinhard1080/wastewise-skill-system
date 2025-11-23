/**
 * Analytics Page
 *
 * Advanced analytics and reporting for admins
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsChart } from "@/components/admin/MetricsChart";
import { StatsCard } from "@/components/admin/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSystemMetrics } from "@/lib/hooks/useAdminData";
import { TrendingUp, DollarSign, Users, FileText } from "lucide-react";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("7d");
  const { data: metrics, isLoading } = useSystemMetrics(period);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-2">Advanced insights and reporting</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatsCard
              title="Revenue"
              value={`$${metrics?.revenue?.total || 0}`}
              icon={DollarSign}
              variant="success"
              change={{
                value: metrics?.revenue?.change || 0,
                isPositive: (metrics?.revenue?.change || 0) > 0,
                period:
                  period === "24h" ? "vs yesterday" : "vs previous period",
              }}
            />
            <StatsCard
              title="Active Users"
              value={metrics?.active_users || 0}
              icon={Users}
              variant="default"
              change={{
                value: metrics?.users_change || 0,
                isPositive: (metrics?.users_change || 0) > 0,
                period:
                  period === "24h" ? "vs yesterday" : "vs previous period",
              }}
            />
            <StatsCard
              title="Reports Generated"
              value={metrics?.reports_generated || 0}
              icon={FileText}
              variant="default"
            />
            <StatsCard
              title="Avg Analysis Time"
              value={`${metrics?.avg_analysis_time || 0}s`}
              icon={TrendingUp}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsChart
            title="Daily Active Users"
            data={metrics?.daily_active_users || []}
            dataKey="value"
            valueLabel="Users"
            color="#3b82f6"
          />
          <MetricsChart
            title="Revenue Trend"
            data={metrics?.revenue_trend || []}
            dataKey="value"
            valueLabel="Revenue ($)"
            color="#10b981"
          />
          <MetricsChart
            title="Analysis Jobs"
            data={metrics?.jobs_completed || []}
            dataKey="value"
            valueLabel="Jobs"
            color="#f59e0b"
          />
          <MetricsChart
            title="AI Cost"
            data={metrics?.ai_cost || []}
            dataKey="value"
            valueLabel="Cost ($)"
            color="#ef4444"
          />
        </div>
      )}

      {/* Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="space-y-4">
              {metrics?.usage_by_skill?.map((skill: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-sm text-gray-500">
                      {skill.count} executions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${skill.cost.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      {skill.percentage}% of total
                    </div>
                  </div>
                </div>
              ))}
              {(!metrics?.usage_by_skill ||
                metrics.usage_by_skill.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-8">
                  No usage data available
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
