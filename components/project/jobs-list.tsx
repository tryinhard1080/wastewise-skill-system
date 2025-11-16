'use client'

/**
 * Jobs List Component
 *
 * Displays list of analysis jobs with real-time status updates using SWR
 */

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Ban,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface AnalysisJob {
  id: string
  projectId: string
  jobType: string
  status: string
  progress: {
    percent: number | null
    currentStep: string | null
  }
  timing: {
    createdAt: string | null
    startedAt: string | null
    completedAt: string | null
    durationSeconds: number | null
  }
  hasError: boolean
  hasResult: boolean
}

interface JobsListProps {
  projectId: string
  jobs: AnalysisJob[]
}

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function JobsList({ projectId, jobs: initialJobs }: JobsListProps) {
  // Use SWR for real-time updates with dynamic polling
  const { data, error } = useSWR(
    `/api/jobs?projectId=${projectId}`,
    fetcher,
    {
      fallbackData: { jobs: initialJobs },
      // Dynamic refresh interval: poll if active jobs exist, else stop
      refreshInterval: (latestData) => {
        const currentJobs = latestData?.jobs || initialJobs
        const hasActive = currentJobs.some(
          (job: AnalysisJob) =>
            job.status === 'pending' || job.status === 'processing'
        )
        // Poll every 2 seconds if active jobs, otherwise stop polling
        return hasActive ? 2000 : 0
      },
    }
  )

  const jobs = data?.jobs || initialJobs

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'cancelled':
        return <Ban className="h-5 w-5 text-gray-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'processing':
        return <Badge className="bg-blue-600">Processing</Badge>
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No analysis jobs yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Start your first analysis to get optimization recommendations and
            cost savings insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map((job: AnalysisJob) => (
        <Card key={job.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getStatusIcon(job.status)}
                <div>
                  <CardTitle className="text-lg capitalize">
                    {job.jobType.replace(/_/g, ' ')}
                  </CardTitle>
                  <CardDescription>
                    {job.timing.createdAt &&
                      `Created ${format(new Date(job.timing.createdAt), 'MMM d, yyyy h:mm a')}`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(job.status)}
                {job.status === 'completed' && (
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Results
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Progress Indicator for Active Jobs */}
          {(job.status === 'pending' || job.status === 'processing') && (
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {job.progress.currentStep || 'Waiting to start...'}
                </span>
                <span className="font-medium">
                  {job.progress.percent || 0}%
                </span>
              </div>
              <Progress value={job.progress.percent || 0} className="h-2" />
            </CardContent>
          )}

          {/* Error Message for Failed Jobs */}
          {job.status === 'failed' && job.hasError && (
            <CardContent>
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium mb-1">Error</p>
                <p>
                  Analysis failed. <Link href={`/jobs/${job.id}`} className="underline">View details</Link> for more information.
                </p>
              </div>
            </CardContent>
          )}

          {/* Timing Info for Completed Jobs */}
          {job.status === 'completed' && (
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {job.timing.startedAt && (
                  <div>
                    <span className="font-medium">Started:</span>{' '}
                    {format(new Date(job.timing.startedAt), 'h:mm a')}
                  </div>
                )}
                {job.timing.completedAt && (
                  <div>
                    <span className="font-medium">Completed:</span>{' '}
                    {format(new Date(job.timing.completedAt), 'h:mm a')}
                  </div>
                )}
                {job.timing.durationSeconds && (
                  <div>
                    <span className="font-medium">Duration:</span>{' '}
                    {job.timing.durationSeconds}s
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
