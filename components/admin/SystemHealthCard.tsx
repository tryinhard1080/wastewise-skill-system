/**
 * System Health Card Component
 *
 * Displays health status of a service
 * Color-coded: green=healthy, yellow=degraded, red=down
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, XCircle, LucideIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type HealthStatus = 'healthy' | 'degraded' | 'down'

interface SystemHealthCardProps {
  serviceName: string
  status: HealthStatus
  icon: LucideIcon
  lastCheck?: string
  details?: string
  responseTime?: number
}

export function SystemHealthCard({
  serviceName,
  status,
  icon: Icon,
  lastCheck,
  details,
  responseTime,
}: SystemHealthCardProps) {
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      badgeVariant: 'default' as const,
      label: 'Healthy',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      badgeVariant: 'outline' as const,
      label: 'Degraded',
    },
    down: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      badgeVariant: 'destructive' as const,
      label: 'Down',
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', config.bgColor)}>
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>
          <CardTitle className="text-base font-semibold">
            {serviceName}
          </CardTitle>
        </div>
        <Badge variant={config.badgeVariant}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {details && (
            <p className="text-sm text-gray-600">{details}</p>
          )}
          {responseTime !== undefined && (
            <div className="text-xs text-gray-500">
              Response time: {responseTime}ms
            </div>
          )}
          {lastCheck && (
            <div className="text-xs text-gray-500">
              Last checked:{' '}
              {formatDistanceToNow(new Date(lastCheck), { addSuffix: true })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
