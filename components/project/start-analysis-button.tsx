'use client'

/**
 * Start Analysis Button Component
 *
 * Button to create a new analysis job with job type selection
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PlayCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface StartAnalysisButtonProps {
  projectId: string
}

export function StartAnalysisButton({ projectId }: StartAnalysisButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [jobType, setJobType] = useState<string>('complete_analysis')
  const [isCreating, setIsCreating] = useState(false)

  const handleStartAnalysis = async () => {
    setIsCreating(true)
    try {
      // Call API to create analysis job
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          jobType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start analysis')
      }

      const data = await response.json()

      // Show success toast
      toast.success('Analysis job started successfully!')

      // Close dialog and refresh
      setOpen(false)
      router.refresh()

      // Optional: Navigate to job monitoring page
      // router.push(`/jobs/${data.jobId}`)
    } catch (error) {
      console.error('Error starting analysis:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to start analysis. Please try again.'
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <PlayCircle className="mr-2 h-5 w-5" />
          Start Analysis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Analysis</DialogTitle>
          <DialogDescription>
            Choose the type of analysis you want to run for this property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="job-type">Analysis Type</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger id="job-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complete_analysis">
                  Complete Analysis
                </SelectItem>
                <SelectItem value="invoice_extraction">
                  Invoice Extraction
                </SelectItem>
                <SelectItem value="regulatory_research">
                  Regulatory Research
                </SelectItem>
                <SelectItem value="report_generation">
                  Report Generation
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {jobType === 'complete_analysis' &&
                'Full WasteWise analysis workflow with optimization recommendations'}
              {jobType === 'invoice_extraction' &&
                'Extract data from uploaded invoices using AI'}
              {jobType === 'regulatory_research' &&
                'Research local waste management regulations'}
              {jobType === 'report_generation' &&
                'Generate comprehensive analysis reports'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartAnalysis} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
