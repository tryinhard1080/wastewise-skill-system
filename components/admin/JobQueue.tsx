'use client'

/**
 * Job Queue Component
 *
 * Real-time job monitoring with polling
 * Shows job status, progress, and actions
 */

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns'
import { RefreshCw, RotateCcw, Trash2, Eye } from 'lucide-react'

interface Job {
  id: string
  job_type: string
  user_email?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress_percent?: number
  current_step?: string
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
}

interface JobQueueProps {
  jobs: Job[]
  onRetry?: (jobId: string) => void
  onDelete?: (jobId: string) => void
  onRefresh?: () => void
  autoRefresh?: boolean
}

export function JobQueue({
  jobs,
  onRetry,
  onDelete,
  onRefresh,
  autoRefresh = true,
}: JobQueueProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      onRefresh?.()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, onRefresh])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const getStatusBadge = (status: Job['status']) => {
    const variants = {
      pending: 'outline',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
    } as const

    const colors = {
      pending: 'text-gray-600',
      processing: 'text-blue-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
    }

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
    )
  }

  const getDuration = (job: Job) => {
    if (job.status === 'pending') return 'Waiting...'

    const start = job.started_at ? new Date(job.started_at) : new Date(job.created_at)
    const end = job.completed_at ? new Date(job.completed_at) : new Date()

    const duration = intervalToDuration({ start, end })

    if (duration.hours) {
      return `${duration.hours}h ${duration.minutes || 0}m`
    } else if (duration.minutes) {
      return `${duration.minutes}m ${duration.seconds || 0}s`
    } else {
      return `${duration.seconds || 0}s`
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {autoRefresh && 'Auto-refreshing every 5 seconds'}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-xs">
                    {job.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    {job.job_type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {job.user_email || 'Unknown'}
                  </TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>
                    {job.status === 'processing' ? (
                      <div className="space-y-1 min-w-[120px]">
                        <Progress value={job.progress_percent || 0} className="h-2" />
                        <div className="text-xs text-gray-500">
                          {job.current_step || 'Processing...'}
                        </div>
                      </div>
                    ) : job.status === 'completed' ? (
                      <span className="text-sm text-green-600">100%</span>
                    ) : job.status === 'failed' ? (
                      <span className="text-sm text-red-600">Failed</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(job.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {getDuration(job)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {job.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRetry?.(job.id)}
                          title="Retry job"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(job.id)}
                        title="Delete job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
