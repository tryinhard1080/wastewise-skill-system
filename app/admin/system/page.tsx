/**
 * System Health Page
 *
 * Monitor system health, metrics, and performance
 */

'use client'

import { useState } from 'react'
import { SystemHealthCard } from '@/components/admin/SystemHealthCard'
import { MetricsChart } from '@/components/admin/MetricsChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSystemHealth, useSystemMetrics } from '@/lib/hooks/useAdminData'
import {
  Database,
  HardDrive,
  Zap,
  Cog,
  Search,
} from 'lucide-react'

export default function SystemPage() {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h')
  const { data: health, isLoading: healthLoading } = useSystemHealth()
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics(period)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
        <p className="text-gray-500 mt-2">
          Monitor service health and system metrics
        </p>
      </div>

      {/* Health Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Service Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <SystemHealthCard
                serviceName="Database"
                status={health?.services?.database || 'healthy'}
                icon={Database}
                responseTime={health?.response_times?.database}
                lastCheck={health?.last_check}
              />
              <SystemHealthCard
                serviceName="Storage"
                status={health?.services?.storage || 'healthy'}
                icon={HardDrive}
                responseTime={health?.response_times?.storage}
                lastCheck={health?.last_check}
              />
              <SystemHealthCard
                serviceName="API"
                status={health?.services?.api || 'healthy'}
                icon={Zap}
                responseTime={health?.response_times?.api}
                lastCheck={health?.last_check}
              />
              <SystemHealthCard
                serviceName="Workers"
                status={health?.services?.workers || 'healthy'}
                icon={Cog}
                details={`${health?.worker_count || 0} active`}
                lastCheck={health?.last_check}
              />
              <SystemHealthCard
                serviceName="Search"
                status={health?.services?.search || 'healthy'}
                icon={Search}
                responseTime={health?.response_times?.search}
                lastCheck={health?.last_check}
              />
            </>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">System Metrics</h2>
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

        {metricsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricsChart
              title="User Registrations"
              data={metrics?.users || []}
              dataKey="value"
              valueLabel="New Users"
              color="#3b82f6"
            />
            <MetricsChart
              title="Jobs Completed"
              data={metrics?.jobs_completed || []}
              dataKey="value"
              valueLabel="Jobs"
              color="#10b981"
            />
            <MetricsChart
              title="AI Usage (Tokens)"
              data={metrics?.ai_usage || []}
              dataKey="value"
              valueLabel="Tokens"
              color="#f59e0b"
            />
            <MetricsChart
              title="Storage Used (GB)"
              data={metrics?.storage || []}
              dataKey="value"
              valueLabel="GB"
              color="#8b5cf6"
            />
          </div>
        )}
      </div>

      {/* Alerts */}
      {health?.alerts && health.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.alerts.map((alert: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50"
                >
                  <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2" />
                  <div>
                    <div className="font-medium">{alert.service}</div>
                    <div className="text-sm text-gray-600">{alert.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
