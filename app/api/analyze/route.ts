/**
 * @swagger
 * /api/analyze:
 *   post:
 *     summary: Create analysis job
 *     description: |
 *       Creates a background job for long-running waste analysis operations.
 *
 *       **Async Job Pattern**:
 *       1. Create job with this endpoint → Returns `jobId`
 *       2. Poll `GET /api/jobs/{jobId}` every 2 seconds
 *       3. Check `status` field: `pending` → `processing` → `completed` or `failed`
 *       4. When completed, access results in `result_data` field
 *
 *       **Processing Time**: 30 seconds to 5 minutes depending on job type and data volume
 *     tags:
 *       - Analysis
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - jobType
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: Project ID to analyze
 *                 example: "d82e2314-7ccf-404e-a133-0caebb154c7e"
 *               jobType:
 *                 type: string
 *                 enum:
 *                   - invoice_extraction
 *                   - regulatory_research
 *                   - complete_analysis
 *                   - report_generation
 *                 description: Type of analysis to perform
 *                 example: "complete_analysis"
 *               inputData:
 *                 type: object
 *                 description: Optional job-specific input parameters
 *                 additionalProperties: true
 *                 example: { "includeRegulatory": true }
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Job priority (1=highest, 10=lowest). Auto-assigned if not provided.
 *                 example: 5
 *           examples:
 *             complete_analysis:
 *               summary: Complete analysis with all features
 *               value:
 *                 projectId: "d82e2314-7ccf-404e-a133-0caebb154c7e"
 *                 jobType: "complete_analysis"
 *                 inputData:
 *                   includeRegulatory: true
 *                   generateReports: true
 *             invoice_extraction:
 *               summary: Invoice extraction only
 *               value:
 *                 projectId: "d82e2314-7ccf-404e-a133-0caebb154c7e"
 *                 jobType: "invoice_extraction"
 *                 priority: 3
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   format: uuid
 *                   description: Job ID for polling status
 *                 status:
 *                   type: string
 *                   enum: [pending]
 *                   description: Initial job status
 *                 message:
 *                   type: string
 *                   description: Instructions for polling
 *             example:
 *               jobId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *               status: "pending"
 *               message: "Analysis job created. Poll /api/jobs/a1b2c3d4-e5f6-7890-abcd-ef1234567890 for status updates."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Project not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Project not found or access denied"
 *       429:
 *         description: Rate limit exceeded (10 requests/minute)
 *         headers:
 *           Retry-After:
 *             schema:
 *               type: integer
 *             description: Seconds until rate limit resets
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *             description: Maximum requests per window
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *             description: Remaining requests in current window
 *           X-RateLimit-Reset:
 *             schema:
 *               type: integer
 *             description: Unix timestamp when limit resets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 retryAfter:
 *                   type: integer
 *             example:
 *               error: "Rate limit exceeded. Please try again later."
 *               retryAfter: 45
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimiters } from '@/lib/api/rate-limit'

const createJobSchema = z.object({
  projectId: z.string().uuid(),
  jobType: z.enum([
    'invoice_extraction',
    'regulatory_research',
    'complete_analysis',
    'report_generation',
  ]),
  inputData: z.record(z.any()).optional(),
  priority: z.number().int().min(1).max(10).optional(), // 1=highest, 10=lowest
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check rate limit (10 requests per minute per user)
    const rateLimit = rateLimiters.jobCreation(user.id)
    if (rateLimit.isLimited) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          },
        }
      )
    }

    // Validate request body
    const body = await request.json()
    const validatedData = createJobSchema.parse(body)

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', validatedData.projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Assign priority based on context or use provided priority
    let priority = validatedData.priority

    if (!priority) {
      // Auto-assign priority based on job type and user history
      const { data: priorityValue, error: priorityError } = await supabase.rpc(
        'assign_job_priority',
        {
          user_id: user.id,
          job_type: validatedData.jobType,
        }
      )

      if (priorityError) {
        // Fallback to default priority if function fails
        priority = 5 // Normal priority
      } else {
        priority = priorityValue || 5
      }
    }

    // Create analysis job
    const { data: job, error: jobError } = await supabase
      .from('analysis_jobs')
      .insert({
        user_id: user.id,
        project_id: validatedData.projectId,
        job_type: validatedData.jobType,
        status: 'pending',
        input_data: validatedData.inputData || {},
        progress_percent: 0,
        priority,
        priority_reason: validatedData.priority
          ? 'User specified'
          : 'Auto-assigned based on user history',
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    // Return job ID for polling
    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
        message: 'Analysis job created. Poll /api/jobs/' + job.id + ' for status updates.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating analysis job:', error)
    return NextResponse.json(
      { error: 'Failed to create analysis job' },
      { status: 500 }
    )
  }
}
