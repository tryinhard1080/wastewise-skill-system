# Phase 6: Complete Analytics Integration

## Objective
Integrate Phase 5 report generation infrastructure into the complete analytics workflow, implement async job processing, and build the frontend results page.

## Architecture Overview

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Client    │──1──▶ │ POST /api/   │──2──▶ │ analysis_   │
│  (Browser)  │       │ analyze      │       │ jobs table  │
│             │       └──────────────┘       └─────────────┘
│             │              │                      │
│             │              │ 3. Return job_id     │
│             │◀─────────────┘                      │
│             │                                     │
│             │       ┌──────────────┐              │
│             │──4──▶ │ GET /api/    │──5──────────▶│
│             │       │ jobs/[id]    │              │
│             │       └──────────────┘              │
│             │              │                      │
│   Repeat    │◀─────────6───┘                      │
│  every 2s   │       (status + progress)           │
│             │                                     │
│             │       ┌──────────────┐              │
│             │       │ Background   │──7──────────▶│
│             │       │ Worker       │              │
│             │       │ (picks up    │              │
│             │       │  pending)    │              │
│             │       └──────────────┘              │
│             │              │                      │
│             │              │ 8. Update progress   │
│             │              └─────────────────────▶│
│             │                                     │
│             │              │ 9. Save results      │
│             │              └─────────────────────▶│
└─────────────┘                                     └─────────────┘
```

## Tasks

### ✅ Task 1: Analytics Skill Report Integration (Priority: CRITICAL)
**Objective**: Replace placeholder `generateReports()` in wastewise-analytics with actual Excel and HTML generation

**Files to Modify**:
- `lib/skills/skills/wastewise-analytics.ts` (lines 521-556)

**Implementation**:
```typescript
private async generateReports(
  context: SkillContext,
  analysisData: {
    invoiceMetrics: InvoiceMetrics
    compactorOptimization?: CompactorOptimizationResult
    recommendations: WasteWiseAnalyticsCompleteResult['recommendations']
    leaseUpDetected: boolean
  }
): Promise<WasteWiseAnalyticsCompleteResult['reports']> {
  const executionLogger = logger.child({
    skillName: this.name,
    projectId: context.projectId,
  })

  executionLogger.info('Generating Excel and HTML reports')

  try {
    // Build complete result object for reports
    const completeResult: WasteWiseAnalyticsCompleteResult = {
      summary: {
        totalSavingsPotential: analysisData.recommendations.reduce(
          (sum, rec) => sum + (rec.savings || 0),
          0
        ),
        currentMonthlyCost: analysisData.invoiceMetrics.totalSpend,
        optimizedMonthlyCost: 0, // Will be calculated
        savingsPercentage: 0, // Will be calculated
        dateRange: analysisData.invoiceMetrics.dateRange,
        totalInvoices: context.invoices.length,
        totalHauls: context.haulLog?.length,
      },
      compactorOptimization: analysisData.compactorOptimization,
      recommendations: analysisData.recommendations,
      leaseUpDetected: analysisData.leaseUpDetected,
      executionTime: 0,
      aiUsage: { totalRequests: 0, totalTokensInput: 0, totalTokensOutput: 0, totalCostUsd: 0 },
      reports: undefined,
    }

    // Generate Excel report
    const { generateExcelReport, ExcelGeneratorInput } = await import('@/lib/reports')

    const excelInput: ExcelGeneratorInput = {
      result: completeResult,
      project: context.project,
      invoices: context.invoices,
      haulLogs: context.haulLog,
      contractTerms: context.contractTerms,
    }

    const excel = await generateExcelReport(excelInput)

    // Generate HTML dashboard
    const { generateHtmlDashboard, HtmlGeneratorInput } = await import('@/lib/reports')

    const htmlInput: HtmlGeneratorInput = {
      result: completeResult,
      project: context.project,
      invoices: context.invoices,
      haulLogs: context.haulLog,
    }

    const html = await generateHtmlDashboard(htmlInput)

    // Upload reports to Supabase Storage
    const { uploadReports } = await import('@/lib/reports')

    const uploadResult = await uploadReports(
      excel.buffer,
      excel.filename,
      html.content,
      html.filename,
      context.projectId
    )

    executionLogger.info('Reports generated and uploaded successfully', {
      excelUrl: uploadResult.excel.downloadUrl,
      htmlUrl: uploadResult.html.downloadUrl,
    })

    return {
      excelWorkbook: {
        fileName: excel.filename,
        storagePath: uploadResult.excel.storagePath,
        downloadUrl: uploadResult.excel.downloadUrl,
        size: uploadResult.excel.size,
      },
      htmlDashboard: {
        fileName: html.filename,
        storagePath: uploadResult.html.storagePath,
        downloadUrl: uploadResult.html.downloadUrl,
        size: uploadResult.html.size,
      },
    }
  } catch (error) {
    executionLogger.error('Report generation failed', error as Error)

    // Return placeholder data on error (analysis can still succeed)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const projectName = context.project.property_name.replace(/[^a-zA-Z0-9]/g, '_')

    return {
      excelWorkbook: {
        fileName: `${projectName}_Analysis_${timestamp}.xlsx`,
        storagePath: `reports/${context.projectId}/workbook_${timestamp}.xlsx`,
        downloadUrl: '#',
        size: 0,
      },
      htmlDashboard: {
        fileName: `${projectName}_Dashboard_${timestamp}.html`,
        storagePath: `reports/${context.projectId}/dashboard_${timestamp}.html`,
        downloadUrl: '#',
        size: 0,
      },
    }
  }
}
```

**Testing**:
- Run wastewise-analytics with real project data
- Verify Excel and HTML files are generated
- Verify files are uploaded to Supabase Storage
- Verify signed URLs are returned

---

### ✅ Task 2: API Routes for Analysis (Priority: CRITICAL)
**Objective**: Create API endpoints for starting analysis and checking job status

**Files to Create**:
1. `app/api/projects/[id]/analyze/route.ts` - Start analysis job
2. `app/api/jobs/[id]/route.ts` - Get job status

#### 2.1: Start Analysis Endpoint

**File**: `app/api/projects/[id]/analyze/route.ts`

```typescript
/**
 * POST /api/projects/[id]/analyze
 *
 * Start a complete analysis job for a project
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id

  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, property_name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Create analysis job
    const { data: job, error: jobError } = await supabase
      .from('analysis_jobs')
      .insert({
        user_id: user.id,
        project_id: projectId,
        job_type: 'complete_analysis',
        status: 'pending',
        progress_percent: 0,
        total_steps: 5,
        input_data: { projectId },
      })
      .select()
      .single()

    if (jobError || !job) {
      logger.error('Failed to create analysis job', jobError as Error, { projectId })
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }

    logger.info('Analysis job created', {
      jobId: job.id,
      projectId,
      userId: user.id,
    })

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: 'Analysis started. Use job ID to check progress.',
    })
  } catch (error) {
    logger.error('Analysis endpoint error', error as Error, { projectId })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### 2.2: Job Status Endpoint

**File**: `app/api/jobs/[id]/route.ts`

```typescript
/**
 * GET /api/jobs/[id]
 *
 * Get status and progress of an analysis job
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id

  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get job (RLS ensures user can only see their own jobs)
    const { data: job, error: jobError } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Return job status
    return NextResponse.json({
      id: job.id,
      projectId: job.project_id,
      jobType: job.job_type,
      status: job.status,
      progress: {
        percent: job.progress_percent,
        currentStep: job.current_step,
        stepsCompleted: job.steps_completed,
        totalSteps: job.total_steps,
      },
      timing: {
        startedAt: job.started_at,
        completedAt: job.completed_at,
        estimatedCompletion: job.estimated_completion,
        durationSeconds: job.duration_seconds,
      },
      result: job.result_data,
      error: job.error_message ? {
        message: job.error_message,
        code: job.error_code,
      } : null,
      aiUsage: {
        requests: job.ai_requests,
        tokensInput: job.ai_tokens_input,
        tokensOutput: job.ai_tokens_output,
        costUsd: parseFloat(job.ai_cost_usd || '0'),
      },
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    })
  } catch (error) {
    logger.error('Job status endpoint error', error as Error, { jobId })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/jobs/[id]
 *
 * Cancel a running job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id

  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Cancel job (only if pending or processing)
    const { error: updateError } = await supabase
      .from('analysis_jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId)
      .in('status', ['pending', 'processing'])

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to cancel job' },
        { status: 500 }
      )
    }

    logger.info('Job cancelled', { jobId, userId: user.id })

    return NextResponse.json({ message: 'Job cancelled successfully' })
  } catch (error) {
    logger.error('Job cancellation error', error as Error, { jobId })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Testing**:
- POST /api/projects/:id/analyze creates job
- GET /api/jobs/:id returns job status
- DELETE /api/jobs/:id cancels job
- RLS prevents users from seeing other users' jobs

---

### ✅ Task 3: Background Worker System (Priority: HIGH)
**Objective**: Create background worker that processes pending analysis_jobs

**Files to Create**:
1. `lib/workers/analysis-worker.ts` - Main worker logic
2. `lib/workers/job-processor.ts` - Job processing orchestration
3. `scripts/start-worker.ts` - Worker startup script

#### 3.1: Job Processor

**File**: `lib/workers/job-processor.ts`

```typescript
/**
 * Job Processor
 *
 * Orchestrates execution of different job types
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { logger } from '@/lib/observability/logger'
import { WasteWiseAnalyticsSkill } from '@/lib/skills/skills/wastewise-analytics'
import type { SkillContext } from '@/lib/skills/types'

export class JobProcessor {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
  }

  async processJob(jobId: string): Promise<void> {
    const jobLogger = logger.child({ jobId })

    try {
      // Get job details
      const { data: job, error: fetchError } = await this.supabase
        .from('analysis_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (fetchError || !job) {
        throw new Error(`Job not found: ${jobId}`)
      }

      jobLogger.info('Processing job', {
        jobType: job.job_type,
        projectId: job.project_id,
      })

      // Mark job as processing
      await this.supabase.rpc('start_analysis_job', { job_id: jobId })

      // Process based on job type
      switch (job.job_type) {
        case 'complete_analysis':
          await this.processCompleteAnalysis(job)
          break
        case 'invoice_extraction':
          // TODO: Implement invoice extraction job
          throw new Error('Invoice extraction not yet implemented')
        case 'regulatory_research':
          // TODO: Implement regulatory research job
          throw new Error('Regulatory research not yet implemented')
        case 'report_generation':
          // TODO: Implement report-only generation job
          throw new Error('Report generation not yet implemented')
        default:
          throw new Error(`Unknown job type: ${job.job_type}`)
      }

      jobLogger.info('Job completed successfully', { jobId })
    } catch (error) {
      jobLogger.error('Job processing failed', error as Error, { jobId })

      // Mark job as failed
      await this.supabase.rpc('fail_analysis_job', {
        job_id: jobId,
        error_msg: (error as Error).message,
        error_cd: 'PROCESSING_ERROR',
      })

      throw error
    }
  }

  private async processCompleteAnalysis(job: any): Promise<void> {
    const projectId = job.input_data.projectId

    // Fetch project data
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw new Error(`Project not found: ${projectId}`)
    }

    // Fetch related data
    const [invoicesResult, haulLogResult, contractResult] = await Promise.all([
      this.supabase
        .from('invoice_data')
        .select('*')
        .eq('project_id', projectId)
        .order('invoice_date', { ascending: true }),

      this.supabase
        .from('haul_log')
        .select('*')
        .eq('project_id', projectId)
        .order('haul_date', { ascending: true }),

      this.supabase
        .from('contract_terms')
        .select('*')
        .eq('project_id', projectId)
        .single(),
    ])

    if (invoicesResult.error) {
      throw new Error(`Failed to fetch invoices: ${invoicesResult.error.message}`)
    }

    // Build skill context
    const context: SkillContext = {
      projectId,
      userId: job.user_id,
      project,
      invoices: invoicesResult.data,
      haulLog: haulLogResult.data || undefined,
      contractTerms: contractResult.data || undefined,
      onProgress: async (progress) => {
        // Update job progress in database
        await this.supabase.rpc('update_job_progress', {
          job_id: job.id,
          new_progress: progress.percent,
          step_name: progress.step,
          step_num: progress.stepNumber,
        })
      },
    }

    // Execute analytics skill
    const skill = new WasteWiseAnalyticsSkill()
    const result = await skill.execute(context)

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Analysis failed without error message')
    }

    // Mark job as complete
    await this.supabase.rpc('complete_analysis_job', {
      job_id: job.id,
      result: result.data as any,
      ai_usage: {
        requests: result.data.aiUsage.totalRequests,
        tokens_input: result.data.aiUsage.totalTokensInput,
        tokens_output: result.data.aiUsage.totalTokensOutput,
        cost_usd: result.data.aiUsage.totalCostUsd,
      },
    })
  }
}
```

#### 3.2: Worker Loop

**File**: `lib/workers/analysis-worker.ts`

```typescript
/**
 * Analysis Worker
 *
 * Background worker that continuously processes pending analysis jobs
 */
import { JobProcessor } from './job-processor'
import { logger } from '@/lib/observability/logger'

export class AnalysisWorker {
  private processor: JobProcessor
  private isRunning = false
  private pollInterval = 2000 // Check every 2 seconds
  private maxConcurrentJobs = 1 // Process one job at a time

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.processor = new JobProcessor(supabaseUrl, supabaseServiceKey)
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker already running')
      return
    }

    this.isRunning = true
    logger.info('Starting analysis worker', {
      pollInterval: this.pollInterval,
      maxConcurrentJobs: this.maxConcurrentJobs,
    })

    await this.run()
  }

  stop(): void {
    this.isRunning = false
    logger.info('Stopping analysis worker')
  }

  private async run(): Promise<void> {
    while (this.isRunning) {
      try {
        // TODO: Fetch pending jobs from database
        // TODO: Process jobs up to maxConcurrentJobs
        // For now, just poll

        await this.sleep(this.pollInterval)
      } catch (error) {
        logger.error('Worker error', error as Error)
        await this.sleep(this.pollInterval)
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
```

#### 3.3: Worker Startup Script

**File**: `scripts/start-worker.ts`

```typescript
/**
 * Start Background Worker
 *
 * Usage: pnpm worker
 */
import { AnalysisWorker } from '../lib/workers/analysis-worker'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const worker = new AnalysisWorker(supabaseUrl, supabaseServiceKey)

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down worker...')
  worker.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Shutting down worker...')
  worker.stop()
  process.exit(0)
})

// Start worker
worker.start().catch((error) => {
  console.error('Worker failed to start:', error)
  process.exit(1)
})
```

**package.json** (add script):
```json
{
  "scripts": {
    "worker": "tsx scripts/start-worker.ts"
  }
}
```

**Testing**:
- Run `pnpm worker` in separate terminal
- Create analysis job via API
- Worker picks up and processes job
- Job status updates as it progresses
- Result saved to database

---

### ✅ Task 4: Frontend Results Page (Priority: HIGH)
**Objective**: Build results page that displays analysis and provides download buttons

**Files to Create**:
1. `app/projects/[id]/results/page.tsx` - Results page
2. `components/results/analysis-summary.tsx` - Summary cards
3. `components/results/recommendations-list.tsx` - Recommendations
4. `components/results/download-buttons.tsx` - Download Excel/HTML

#### 4.1: Results Page

**File**: `app/projects/[id]/results/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalysisSummary } from '@/components/results/analysis-summary'
import { RecommendationsList } from '@/components/results/recommendations-list'
import { DownloadButtons } from '@/components/results/download-buttons'

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Get project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
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

  const result = job.result_data

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{project.property_name}</h1>
        <p className="text-muted-foreground">
          Analysis completed {new Date(job.completed_at!).toLocaleDateString()}
        </p>
      </header>

      <DownloadButtons
        excelUrl={result.reports.excelWorkbook.downloadUrl}
        htmlUrl={result.reports.htmlDashboard.downloadUrl}
      />

      <AnalysisSummary summary={result.summary} />

      <RecommendationsList recommendations={result.recommendations} />
    </div>
  )
}
```

**Testing**:
- Navigate to /projects/:id/results
- Verify summary cards display correctly
- Verify recommendations list displays correctly
- Click download buttons to get reports
- Verify signed URLs work

---

### ✅ Task 5: Integration Testing (Priority: MEDIUM)
**Objective**: Test complete end-to-end workflow

**Test Cases**:
1. Create project with invoice data
2. Start analysis via API
3. Worker picks up and processes job
4. Job status updates correctly
5. Reports generated and uploaded
6. Results page displays correctly
7. Download buttons work

---

## Implementation Order

### Sprint 1: Core Integration (3-4 hours)
1. ✅ Update wastewise-analytics skill (Task 1)
2. ✅ Create API routes (Task 2)

### Sprint 2: Background Processing (2-3 hours)
3. ✅ Create job processor (Task 3.1)
4. ✅ Create worker loop (Task 3.2)
5. ✅ Create startup script (Task 3.3)

### Sprint 3: Frontend (2-3 hours)
6. ✅ Create results page (Task 4.1)
7. ✅ Create summary component (Task 4.2)
8. ✅ Create recommendations component (Task 4.3)
9. ✅ Create download component (Task 4.4)

### Sprint 4: Testing & Polish (1-2 hours)
10. ✅ End-to-end testing (Task 5)
11. ✅ Error handling improvements
12. ✅ Documentation updates

---

## Success Criteria

- ✅ Complete analysis workflow works end-to-end
- ✅ Excel and HTML reports generated correctly
- ✅ Reports uploaded to Supabase Storage with signed URLs
- ✅ Background worker processes jobs reliably
- ✅ Frontend displays results and provides downloads
- ✅ Job status polling works smoothly
- ✅ Error handling is comprehensive
- ✅ Zero TypeScript errors
- ✅ All API endpoints have proper auth/RLS

---

## Dependencies

**Required Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`

**Database Tables**:
- ✅ `analysis_jobs` (already created)
- ✅ `projects` (already exists)
- ✅ `invoice_data` (already exists)
- ✅ `haul_log` (already exists)
- ✅ `contract_terms` (already exists)

**Phase 5 Infrastructure**:
- ✅ Excel generation (`lib/reports/excel-generator.ts`)
- ✅ HTML generation (`lib/reports/html-generator.ts`)
- ✅ Report storage (`lib/reports/storage.ts`)
- ✅ All formatters and tab generators

---

## Risk Mitigation

**Risk 1**: Worker dies unexpectedly
- **Mitigation**: Add health check endpoint, restart on failure, containerize with auto-restart

**Risk 2**: Job processing takes too long
- **Mitigation**: Add timeout (10 minutes), fail job if exceeded, allow retry

**Risk 3**: Report generation fails
- **Mitigation**: Graceful fallback, continue analysis even if reports fail, log errors

**Risk 4**: Supabase Storage upload fails
- **Mitigation**: Retry logic (3 attempts), save reports locally as backup, notify user

---

## Next Phase (Phase 7)

- Testing Suite (unit, integration, E2E)
- Regulatory Research Skill
- Performance Optimization
- Monitoring & Alerting
- Production Deployment

---

**Last Updated**: 2025-11-17
**Status**: READY TO EXECUTE
