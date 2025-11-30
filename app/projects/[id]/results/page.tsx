// Force dynamic rendering - this page uses cookies for auth
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { WasteWiseAnalyticsCompleteResult } from '@/lib/skills/types'
import { DashboardClient } from './dashboard-client'

export default async function ResultsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    redirect('/dashboard')
  }

  // Get latest completed analysis job
  const { data: job, error: jobError } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('project_id', params.id)
    .eq('job_type', 'complete_analysis')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  if (jobError || !job || !job.result_data) {
    redirect(`/projects/${params.id}`)
  }

  // Type-safe result data
  const result = job.result_data as unknown as WasteWiseAnalyticsCompleteResult

  return (
    <DashboardClient
      project={project}
      result={result}
      completedAt={job.completed_at!}
    />
  )
}
