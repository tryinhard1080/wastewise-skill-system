/**
 * Analysis Job Creation API
 *
 * POST /api/analyze - Create a new analysis job
 *
 * This endpoint creates a background job for long-running AI analysis operations.
 * The client should poll /api/jobs/[id] for status updates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimiters } from '@/lib/api/rate-limit'
import { VALID_JOB_TYPES } from '@/lib/constants/job-types'
import type { Database } from '@/types/database.types'

type AnalysisJob = Database['public']['Tables']['analysis_jobs']['Row']

const createJobSchema = z.object({
  projectId: z.string().uuid(),
  jobType: z.enum(VALID_JOB_TYPES),
  inputData: z.record(z.any()).optional(),
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
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    // Return job ID for polling
    const jobData = job as AnalysisJob
    return NextResponse.json(
      {
        jobId: jobData.id,
        status: jobData.status,
        message: `Analysis job created. Poll /api/jobs/${jobData.id} for status updates.`,
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
