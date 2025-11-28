import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Home } from 'lucide-react'
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

  // Transform real data
  const executiveData = transformExecutiveData(project, project.invoice_data || [], project.optimizations || [])
  const expenseData = transformExpenseData(project.invoice_data || [], project.units)
  const opportunitiesData = transformOptimizations(project.optimizations || [], project)
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

  // Extract property details
  // Use the first invoice for vendor/account info if available
  const firstInvoice = project.invoice_data && project.invoice_data.length > 0 ? project.invoice_data[0] : null
  const propertyDetails = {
    vendor: firstInvoice?.vendor_name || "Unknown Vendor",
    accountNumber: firstInvoice?.invoice_number || "N/A", // Using invoice number as proxy for account # if not available
    propertyType: project.property_type || "Garden-Style",
    units: project.units || 0
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{project.property_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                Analysis Complete
              </Badge>
              <span className="text-sm text-slate-500">Last updated: {new Date(project.updated_at || new Date()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button>View Recommendations</Button>
        </div>
      </div>

      <Tabs defaultValue="executive" className="space-y-6">
        <TabsList>
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
          <TabsTrigger value="expense">Expense Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Opportunities</TabsTrigger>
          <TabsTrigger value="budget">Budget Projection</TabsTrigger>
          <TabsTrigger value="regulatory">Regulatory Compliance</TabsTrigger>
          <TabsTrigger value="files">Project Files</TabsTrigger>
          <TabsTrigger value="jobs">Analysis Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="executive">
          <ExecutiveSummary data={executiveData} propertyDetails={propertyDetails} />
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
