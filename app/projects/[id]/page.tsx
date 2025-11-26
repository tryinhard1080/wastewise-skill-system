import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { FileUploadSection } from '@/components/project/file-upload-section'
import { JobsList } from '@/components/project/jobs-list'
import { StartAnalysisButton } from '@/components/project/start-analysis-button'
import { ExecutiveSummary } from '@/components/dashboard/executive-summary'
import { ExpenseAnalysis } from '@/components/dashboard/expense-analysis'
import { OptimizationOpportunities } from '@/components/dashboard/optimization-opportunities'
import { BudgetProjection } from '@/components/dashboard/budget-projection'
import { RegulatoryCompliance } from '@/components/dashboard/regulatory-compliance'
import {
  transformExecutiveData,
  transformExpenseData,
  transformOptimizations,
  transformBudgetData
} from '@/lib/transformers/dashboard-data'

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

// Transform database jobs to API format
function transformJobsForDisplay(jobs: any[]) {
  return jobs.map((job) => ({
    id: job.id,
    projectId: job.project_id,
    jobType: job.job_type,
    status: job.status,
    progress: {
      percent: job.progress_percent,
      currentStep: job.current_step,
    },
    timing: {
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      durationSeconds: job.duration_seconds,
    },
    hasError: !!job.error_message,
    hasResult: !!job.result_data,
  }))
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch project with files, jobs, and analysis data
  const { data: project, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      project_files(*),
      analysis_jobs(*),
      invoice_data(*),
      optimizations(*)
    `
    )
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !project) {
    redirect('/projects')
  }

  const totalFiles = project.project_files?.length || 0
  const totalJobs = project.analysis_jobs?.length || 0
  const completedJobs =
    project.analysis_jobs?.filter((job: any) => job.status === 'completed')
      .length || 0

  // Transform real data
  const executiveData = transformExecutiveData(project, project.invoice_data || [], project.optimizations || [])
  const expenseData = transformExpenseData(project.invoice_data || [], project.units)
  const opportunitiesData = transformOptimizations(project.optimizations || [])
  const budgetData = transformBudgetData(project.invoice_data || [])

  // Calculate optimization totals
  const totalSavings = opportunitiesData.reduce((sum, opp) => sum + opp.annualSavings, 0)
  const totalInvestment = opportunitiesData.reduce((sum, opp) => {
    const cost = typeof opp.implementationCost === 'number' ? opp.implementationCost : 0
    return sum + cost
  }, 0)
  const roi = totalInvestment > 0 ? `${Math.round((totalSavings / totalInvestment) * 100)}%` : '0%'

  // Calculate budget totals
  const baselineTotal = budgetData.reduce((sum, item) => sum + item.current, 0)
  const projectedTotal = budgetData.reduce((sum, item) => sum + item.projected, 0)
  const budgetSavings = baselineTotal - projectedTotal

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="border-b border-slate-300 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" title="Go to Dashboard">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/projects">
            <Button variant="ghost" size="icon" title="Back to Projects">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {project.property_name}
            </h1>
            <p className="text-slate-500">
              {project.city}, {project.state} • {project.units} Units
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="expense">Expense Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
          <TabsTrigger value="files">Files ({totalFiles})</TabsTrigger>
          <TabsTrigger value="jobs">Analysis Jobs ({completedJobs}/{totalJobs})</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ExecutiveSummary data={executiveData} />
        </TabsContent>

        <TabsContent value="expense">
          <ExpenseAnalysis data={expenseData} />
        </TabsContent>

        <TabsContent value="optimization">
          <OptimizationOpportunities
            opportunities={opportunitiesData}
            totalSavings={totalSavings}
            roi={roi}
          />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetProjection
            data={budgetData}
            baselineTotal={baselineTotal}
            projectedTotal={projectedTotal}
            savings={budgetSavings}
          />
        </TabsContent>

        <TabsContent value="regulatory">
          <RegulatoryCompliance />
        </TabsContent>

        <TabsContent value="files">
          <FileUploadSection projectId={project.id} existingFiles={project.project_files || []} />
        </TabsContent>

        <TabsContent value="jobs">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Analysis History</h2>
              <StartAnalysisButton projectId={project.id} />
            </div>
            <JobsList
              jobs={transformJobsForDisplay(project.analysis_jobs || [])}
              projectId={project.id}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
