'use client'

/**
 * Processing Page - Real-time job progress monitoring
 * 
 * This page polls the job status API every 2 seconds to display
 * real-time progress updates. When the job completes, it redirects
 * to the results page.
 */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ProcessingPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string
    const supabase = createClient()

    const [jobStatus, setJobStatus] = useState<string>('pending')
    const [progress, setProgress] = useState<number>(0)
    const [currentStep, setCurrentStep] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        const fetchLatestJob = async () => {
            try {
                const { data: jobs, error } = await supabase
                    .from('analysis_jobs')
                    .select('id, status')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: false })
                    .limit(1)

                if (error) throw error

                if (jobs && jobs.length > 0) {
                    // If job is already completed, redirect immediately
                    if (jobs[0].status === 'completed') {
                        router.push(`/projects/${projectId}/results`)
                        return null
                    }

                    return jobs[0].id
                }

                setError('No analysis job found')
                return null
            } catch (err) {
                console.error('Error fetching latest job:', err)
                setError('Failed to fetch job information')
                return null
            }
        }

        const pollJobStatus = async (currentJobId: string) => {
            try {
                const response = await fetch(`/api/jobs/${currentJobId}`)

                if (!response.ok) {
                    throw new Error('Failed to fetch job status')
                }

                const job = await response.json()

                setJobStatus(job.status)
                setProgress(job.progress?.percent || 0)
                setCurrentStep(job.progress?.currentStep || '')

                // Redirect on completion
                if (job.status === 'completed') {
                    if (interval) clearInterval(interval)
                    router.push(`/projects/${projectId}/results`)
                    return
                }

                // Handle errors
                if (job.status === 'failed') {
                    if (interval) clearInterval(interval)
                    setError(job.error?.message || 'Analysis failed')
                }
            } catch (err) {
                console.error('Error polling job status:', err)
                setError('Failed to fetch job status')
                if (interval) clearInterval(interval)
            }
        }

        const initializePolling = async () => {
            const fetchedJobId = await fetchLatestJob()

            if (!fetchedJobId) {
                return
            }

            // Start polling every 2 seconds
            interval = setInterval(() => {
                pollJobStatus(fetchedJobId)
            }, 2000)

            // Poll immediately once
            pollJobStatus(fetchedJobId)
        }

        initializePolling()

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [projectId, router, supabase])

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Processing Analysis</CardTitle>
                    <CardDescription>
                        Your waste management analysis is being processed
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Error State */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 rounded-md">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <div className="flex-1">
                                <p className="font-medium text-red-900">Error</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                            <Link href={`/projects/${projectId}`}>
                                <Button variant="outline" size="sm">
                                    Back to Project
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {!error && (
                        <>
                            <div className="space-y-2">
                                <Progress value={progress} data-progress={progress} className="h-3" />
                                <p className="text-sm text-muted-foreground" data-current-step={currentStep}>
                                    {currentStep || 'Initializing...'}
                                </p>
                            </div>

                            {/* Status Indicator */}
                            <div className="flex items-center gap-2" data-job-status={jobStatus}>
                                {jobStatus === 'pending' && (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                        <span>Queued for processing...</span>
                                    </>
                                )}
                                {jobStatus === 'processing' && (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                        <span>Processing ({progress}% complete)</span>
                                    </>
                                )}
                                {jobStatus === 'completed' && (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        <span>Analysis complete! Redirecting...</span>
                                    </>
                                )}
                                {jobStatus === 'failed' && (
                                    <>
                                        <XCircle className="h-5 w-5 text-red-500" />
                                        <span>Analysis failed</span>
                                    </>
                                )}
                            </div>

                            {/* Estimated Time */}
                            <p className="text-sm text-muted-foreground">
                                This usually takes 30-60 seconds...
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
