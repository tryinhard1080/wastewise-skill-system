/**
 * Analysis Job Status API
 *
 * GET /api/jobs/[id] - Get job status and progress
 * PATCH /api/jobs/[id] - Cancel a job (user-initiated)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/api/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate UUID format
    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      )
    }

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

    // Get job (RLS policy ensures user can only see their own jobs)
    const { data: job, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      throw error
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
        totalSteps: job.total_steps,
        stepsCompleted: job.steps_completed,
      },
      timing: {
        startedAt: job.started_at,
        completedAt: job.completed_at,
        estimatedCompletion: job.estimated_completion,
        durationSeconds: job.duration_seconds,
      },
      result: job.result_data,
      error: job.error_message
        ? {
            message: job.error_message,
            code: job.error_code,
            details: job.error_details,
            failedAt: job.failed_at,
          }
        : null,
      aiUsage: {
        requests: job.ai_requests,
        tokensInput: job.ai_tokens_input,
        tokensOutput: job.ai_tokens_output,
        costUsd: job.ai_cost_usd,
      },
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate UUID format
    if (!isValidUUID(params.id)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      )
    }

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

    const body = await request.json()
    const { action } = body

    if (action === 'cancel') {
      // Cancel job (only if pending or processing)
      const { data, error } = await supabase
        .from('analysis_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Job not found or cannot be cancelled' },
            { status: 404 }
          )
        }
        throw error
      }

      return NextResponse.json({
        success: true,
        job: { id: data.id, status: data.status },
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}
