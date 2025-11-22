/**
 * Job Processor Tests
 *
 * Tests for background job processing handlers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { JobProcessor } from '@/lib/workers/job-processor'
import type { Database, Tables } from '@/types/database.types'

type AnalysisJob = Tables<'analysis_jobs'>

// Mock dependencies
vi.mock('@/lib/skills/executor', () => ({
  executeSkillWithProgress: vi.fn(),
}))

vi.mock('@/lib/observability/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

describe('JobProcessor', () => {
  let processor: JobProcessor
  let mockSupabase: any
  let mockExecuteSkillWithProgress: any

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Setup mock Supabase client
    const singleMock = vi.fn()
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: singleMock,
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      rpc: vi.fn(),
    }

    // Store reference to single mock for easier access in tests
    mockSupabase._singleMock = singleMock

    // Get mock functions from mocked modules
    const { createClient } = await import('@supabase/supabase-js')
    const executor = await import('@/lib/skills/executor')

    vi.mocked(createClient).mockReturnValue(mockSupabase)
    mockExecuteSkillWithProgress = vi.mocked(executor.executeSkillWithProgress)

    // Create processor instance
    processor = new JobProcessor('http://localhost:54321', 'test-key')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('processJob', () => {
    it('should throw error if job not found', async () => {
      mockSupabase._singleMock.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      })

      await expect(processor.processJob('nonexistent-job')).rejects.toThrow(
        'Job not found: nonexistent-job'
      )
    })

    it('should skip jobs that are not pending or processing', async () => {
      const completedJob: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'completed',
        job_type: 'complete_analysis',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: completedJob,
        error: null,
      })

      // Should not throw, just skip
      await processor.processJob('job-123')

      // Verify no skill execution happened
      expect(mockExecuteSkillWithProgress).not.toHaveBeenCalled()
    })

    it('should mark pending job as processing before execution', async () => {
      const pendingJob: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'pending',
        job_type: 'complete_analysis',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: pendingJob,
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      mockExecuteSkillWithProgress.mockResolvedValue({
        success: true,
        data: { summary: 'test' },
        metadata: { durationMs: 1000 },
      })

      await processor.processJob('job-123')

      // Verify RPC was called to start job
      expect(mockSupabase.rpc).toHaveBeenCalledWith('start_analysis_job', {
        job_id: 'job-123',
      })
    })

    it('should handle missing RPC functions gracefully', async () => {
      const pendingJob: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'pending',
        job_type: 'complete_analysis',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: pendingJob,
        error: null,
      })

      // Simulate missing RPC function
      mockSupabase.rpc.mockResolvedValue({
        error: { code: '42883', message: 'function does not exist' },
      })

      mockExecuteSkillWithProgress.mockResolvedValue({
        success: true,
        data: { summary: 'test' },
        metadata: { durationMs: 1000 },
      })

      await processor.processJob('job-123')

      // Verify fallback update was used
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_jobs')
    })
  })

  describe('processInvoiceExtraction', () => {
    it('should execute invoice extraction skill and complete job', async () => {
      const job: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'processing',
        job_type: 'invoice_extraction',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: job,
        error: null,
      })

      const extractionResult = {
        success: true,
        data: {
          summary: {
            invoicesExtracted: 5,
            haulLogsExtracted: 20,
          },
        },
        metadata: {
          durationMs: 30000,
          aiUsage: {
            requests: 5,
            tokensInput: 10000,
            tokensOutput: 2000,
            costUsd: 0.15,
          },
        },
      }

      mockExecuteSkillWithProgress.mockResolvedValue(extractionResult)
      mockSupabase.rpc.mockResolvedValue({ error: null })

      await processor.processJob('job-123')

      // Verify skill was executed with correct parameters
      expect(mockExecuteSkillWithProgress).toHaveBeenCalledWith(
        'proj-123',
        'invoice_extraction',
        expect.any(Function),
        'user-123'
      )

      // Verify job was marked as complete
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'complete_analysis_job',
        expect.objectContaining({
          job_id: 'job-123',
          result: extractionResult.data,
          ai_usage: {
            requests: 5,
            tokens_input: 10000,
            tokens_output: 2000,
            cost_usd: 0.15,
          },
        })
      )
    })

    it('should handle extraction failure and mark job as failed', async () => {
      const job: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'processing',
        job_type: 'invoice_extraction',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: job,
        error: null,
      })

      mockExecuteSkillWithProgress.mockResolvedValue({
        success: false,
        error: { message: 'No files found' },
        metadata: { durationMs: 100 },
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      await expect(processor.processJob('job-123')).rejects.toThrow(
        'No files found'
      )

      // Verify job was marked as failed
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'fail_analysis_job',
        expect.objectContaining({
          job_id: 'job-123',
          error_msg: expect.stringContaining('No files found'),
        })
      )
    })

    it('should throw error if projectId is missing', async () => {
      const job: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'processing',
        job_type: 'invoice_extraction',
        project_id: null as any,
        user_id: 'user-123',
        input_data: {}, // No projectId
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: job,
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      await expect(processor.processJob('job-123')).rejects.toThrow(
        'Missing projectId'
      )
    })
  })

  describe('processRegulatoryResearch', () => {
    it('should execute regulatory research skill and complete job', async () => {
      const job: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'processing',
        job_type: 'regulatory_research',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: job,
        error: null,
      })

      const researchResult = {
        success: true,
        data: {
          ordinances: [
            { title: 'Waste Management Ordinance', section: '12-345' },
          ],
        },
        metadata: {
          durationMs: 45000,
          aiUsage: {
            requests: 3,
            tokensInput: 5000,
            tokensOutput: 1500,
            costUsd: 0.08,
          },
        },
      }

      mockExecuteSkillWithProgress.mockResolvedValue(researchResult)
      mockSupabase.rpc.mockResolvedValue({ error: null })

      await processor.processJob('job-123')

      // Verify skill was executed
      expect(mockExecuteSkillWithProgress).toHaveBeenCalledWith(
        'proj-123',
        'regulatory_research',
        expect.any(Function),
        'user-123'
      )

      // Verify job completion
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'complete_analysis_job',
        expect.objectContaining({
          job_id: 'job-123',
        })
      )
    })

    it('should handle research failure gracefully', async () => {
      const job: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'processing',
        job_type: 'regulatory_research',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: job,
        error: null,
      })

      mockExecuteSkillWithProgress.mockResolvedValue({
        success: false,
        error: { message: 'API rate limit exceeded' },
        metadata: { durationMs: 100 },
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      await expect(processor.processJob('job-123')).rejects.toThrow(
        'API rate limit exceeded'
      )
    })
  })

  describe('processReportGeneration', () => {
    it('should execute report generation skill and complete job', async () => {
      const job: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'processing',
        job_type: 'report_generation',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: job,
        error: null,
      })

      const reportResult = {
        success: true,
        data: {
          excelUrl: 'https://storage.example.com/report.xlsx',
          htmlUrl: 'https://storage.example.com/report.html',
        },
        metadata: {
          durationMs: 15000,
          aiUsage: null, // Report generation might not use AI
        },
      }

      mockExecuteSkillWithProgress.mockResolvedValue(reportResult)
      mockSupabase.rpc.mockResolvedValue({ error: null })

      await processor.processJob('job-123')

      // Verify skill was executed
      expect(mockExecuteSkillWithProgress).toHaveBeenCalledWith(
        'proj-123',
        'report_generation',
        expect.any(Function),
        'user-123'
      )

      // Verify job completion
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'complete_analysis_job',
        expect.objectContaining({
          job_id: 'job-123',
        })
      )
    })

    it('should handle report generation failure', async () => {
      const job: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'processing',
        job_type: 'report_generation',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: job,
        error: null,
      })

      mockExecuteSkillWithProgress.mockResolvedValue({
        success: false,
        error: { message: 'Missing analysis data' },
        metadata: { durationMs: 100 },
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      await expect(processor.processJob('job-123')).rejects.toThrow(
        'Missing analysis data'
      )
    })
  })

  describe('progress tracking', () => {
    it('should update job progress during skill execution', async () => {
      const job: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'processing',
        job_type: 'complete_analysis',
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: job,
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      let progressCallback: Function | undefined

      mockExecuteSkillWithProgress.mockImplementation(
        async (_projectId: string, _jobType: string, callback: Function) => {
          progressCallback = callback
          // Simulate progress updates
          await callback(25, 'Loading data')
          await callback(50, 'Analyzing')
          await callback(75, 'Generating reports')
          await callback(100, 'Complete')

          return {
            success: true,
            data: { summary: 'test' },
            metadata: { durationMs: 1000 },
          }
        }
      )

      await processor.processJob('job-123')

      // Verify progress was tracked
      expect(progressCallback).toBeDefined()

      // Verify update_job_progress RPC was called multiple times
      const progressCalls = mockSupabase.rpc.mock.calls.filter(
        (call: any[]) => call[0] === 'update_job_progress'
      )
      expect(progressCalls.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    it('should handle unknown job types', async () => {
      const job: Partial<AnalysisJob> = {
        id: 'job-123',
        status: 'processing',
        job_type: 'unknown_type' as any,
        project_id: 'proj-123',
        user_id: 'user-123',
        input_data: { projectId: 'proj-123' },
      }

      mockSupabase._singleMock.mockResolvedValue({
        data: job,
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      await expect(processor.processJob('job-123')).rejects.toThrow(
        'Unknown job type: unknown_type'
      )

      // Verify job was marked as failed
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'fail_analysis_job',
        expect.objectContaining({
          error_cd: 'PROCESSING_ERROR',
          error_msg: expect.stringContaining('Unknown job type'),
        })
      )
    })
  })
})
