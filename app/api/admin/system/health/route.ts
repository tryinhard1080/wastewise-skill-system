import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, type AdminRequest } from '@/lib/middleware/admin-auth'
import { createClient } from '@/lib/supabase/server'

async function handleGET(req: AdminRequest) {
  try {
    const supabase = await createClient()
    const checks = []

    // Database connectivity
    try {
      const { error } = await supabase.from('projects').select('count').limit(1)
      checks.push({
        service: 'database',
        status: error ? 'unhealthy' : 'healthy',
        error: error?.message
      })
    } catch (e) {
      checks.push({
        service: 'database',
        status: 'unhealthy',
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    // Storage
    try {
      const { data, error } = await supabase.storage.listBuckets()
      checks.push({
        service: 'storage',
        status: error ? 'unhealthy' : 'healthy',
        bucketsAvailable: data?.length || 0,
        error: error?.message
      })
    } catch (e) {
      checks.push({
        service: 'storage',
        status: 'unhealthy',
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    // Auth
    try {
      const { data, error } = await supabase.auth.getSession()
      checks.push({
        service: 'auth',
        status: error ? 'unhealthy' : 'healthy',
        error: error?.message
      })
    } catch (e) {
      checks.push({
        service: 'auth',
        status: 'unhealthy',
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    // API (Anthropic)
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    checks.push({
      service: 'anthropic_api',
      status: anthropicKey ? 'configured' : 'missing',
      error: anthropicKey ? undefined : 'API key not configured'
    })

    // Worker health (check for recent job processing)
    try {
      const { data: recentJobs } = await supabase
        .from('analysis_jobs')
        .select('started_at, status')
        .in('status', ['processing', 'completed'])
        .order('started_at', { ascending: false })
        .limit(1)

      const hasRecentActivity = recentJobs && recentJobs.length > 0
      const lastActivity = recentJobs?.[0]?.started_at

      checks.push({
        service: 'worker',
        status: hasRecentActivity ? 'healthy' : 'idle',
        lastActivity,
        note: hasRecentActivity ? undefined : 'No recent job processing'
      })
    } catch (e) {
      checks.push({
        service: 'worker',
        status: 'unknown',
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }

    const overallStatus = checks.every(c =>
      c.status === 'healthy' || c.status === 'configured' || c.status === 'idle'
    ) ? 'healthy' : 'degraded'

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Health check failed'
      },
      { status: 500 }
    )
  }
}

export const GET = requireAdmin(handleGET)
