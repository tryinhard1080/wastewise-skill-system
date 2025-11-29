/**
 * Job Results Page
 *
 * Displays analysis job results with visualizations and recommendations
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ResultsDashboard } from '@/components/job/results-dashboard'
import type { Database } from '@/types/database.types'

interface JobResultsPageProps {
  params: {
    id: string
  }
}

type AnalysisJobRow = Database['public']['Tables']['analysis_jobs']['Row']
type ProjectRow = Database['public']['Tables']['projects']['Row']
type AnalysisJobWithProject = AnalysisJobRow & { projects: ProjectRow | null }

export default async function JobResultsPage({ params }: JobResultsPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch job with project info
  const { data: job, error } = await supabase
    .from('analysis_jobs')
    .select(
      `
      *,
      projects(*)
    `
    )
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single<AnalysisJobWithProject>()

  if (error || !job) {
    redirect('/dashboard')
  }

  if (!job.projects) {
    redirect('/dashboard')
  }

  const project = job.projects
  const resultData = job.result_data as AnalysisJobWithProject['result_data']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight capitalize">
            {job.job_type.replace(/_/g, ' ')} Results
          </h1>
          <p className="text-muted-foreground">{project.property_name}</p>
        </div>
        <Badge
          variant={
            job.status === 'completed'
              ? 'default'
              : job.status === 'failed'
              ? 'destructive'
              : 'secondary'
          }
          className="text-base px-4 py-2"
        >
          {job.status === 'completed' && (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          {job.status === 'failed' && <XCircle className="mr-2 h-4 w-4" />}
          {job.status}
        </Badge>
      </div>

      {/* Job Metadata */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Started</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {job.started_at
                ? format(new Date(job.started_at), 'MMM d, yyyy')
                : 'Not started'}
            </div>
            <p className="text-xs text-muted-foreground">
              {job.started_at &&
                format(new Date(job.started_at), 'h:mm a')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {job.duration_seconds
                ? `${job.duration_seconds}s`
                : job.started_at && job.completed_at
                ? `${Math.round(
                    (new Date(job.completed_at).getTime() -
                      new Date(job.started_at).getTime()) /
                      1000
                  )}s`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Processing time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(job.ai_cost_usd || 0).toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">
              {job.ai_requests || 0} API requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results or Error */}
      {job.status === 'completed' && job.result_data ? (
        <ResultsDashboard
          results={resultData ?? {}}
          jobType={job.job_type}
        />
      ) : job.status === 'failed' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle>Analysis Failed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                Error Details
              </p>
              <p className="text-sm text-red-700">
                {job.error_message || 'Unknown error occurred'}
              </p>
              {job.error_code && (
                <p className="text-xs text-red-600 mt-2">
                  Error Code: {job.error_code}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No results available</p>
            <p className="text-sm text-muted-foreground">
              This job has not completed yet or has no results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
