/**
 * Tests for JobRetryManager
 *
 * Validates:
 * - Error classification (retryable vs permanent)
 * - Exponential backoff calculation
 * - Retry scheduling logic
 * - Permanent failure handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JobRetryManager, ErrorCategory } from '@/lib/workers/job-retry-manager'

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null })),
    })),
  })),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}))

describe('JobRetryManager', () => {
  let retryManager: JobRetryManager

  beforeEach(() => {
    vi.clearAllMocks()
    retryManager = new JobRetryManager('http://localhost:54321', 'test-key')
  })

  describe('Error Classification', () => {
    it('should classify network errors as retryable', () => {
      const error = new Error('Network timeout occurred')
      const result = retryManager.classifyError(error)

      expect(result.category).toBe(ErrorCategory.RETRYABLE)
      expect(result.shouldRetry).toBe(true)
    })

    it('should classify rate limit errors as retryable', () => {
      const error = new Error('Rate limit exceeded - 429 Too Many Requests')
      const result = retryManager.classifyError(error)

      expect(result.category).toBe(ErrorCategory.RETRYABLE)
      expect(result.shouldRetry).toBe(true)
    })

    it('should classify validation errors as permanent', () => {
      const error = new Error('Invalid input: missing required field')
      const result = retryManager.classifyError(error)

      expect(result.category).toBe(ErrorCategory.PERMANENT)
      expect(result.shouldRetry).toBe(false)
    })

    it('should classify permission errors as permanent', () => {
      const error = new Error('Permission denied - 403 Forbidden')
      const result = retryManager.classifyError(error)

      expect(result.category).toBe(ErrorCategory.PERMANENT)
      expect(result.shouldRetry).toBe(false)
    })

    it('should classify unknown errors as retryable by default', () => {
      const error = new Error('Something went wrong')
      const result = retryManager.classifyError(error)

      expect(result.category).toBe(ErrorCategory.UNKNOWN)
      expect(result.shouldRetry).toBe(true)
    })
  })

  describe('Retry Delay Calculation', () => {
    it('should return 1 minute for first retry', () => {
      const delay = retryManager.getRetryDelay(1)
      expect(delay).toBe(60 * 1000) // 1 minute in ms
    })

    it('should return 5 minutes for second retry', () => {
      const delay = retryManager.getRetryDelay(2)
      expect(delay).toBe(5 * 60 * 1000) // 5 minutes in ms
    })

    it('should return 15 minutes for third retry', () => {
      const delay = retryManager.getRetryDelay(3)
      expect(delay).toBe(15 * 60 * 1000) // 15 minutes in ms
    })

    it('should return max backoff (30 min) for attempts beyond 4', () => {
      const delay = retryManager.getRetryDelay(5)
      expect(delay).toBe(30 * 60 * 1000) // 30 minutes in ms
    })
  })

  describe('Should Retry Decision', () => {
    it('should not retry if max retries reached', async () => {
      const job = {
        id: 'test-job-id',
        retry_count: 3,
        max_retries: 3,
      } as any

      const error = new Error('Network timeout')
      const shouldRetry = await retryManager.shouldRetry(job, error)

      expect(shouldRetry).toBe(false)
    })

    it('should retry retryable errors when retries remaining', async () => {
      const job = {
        id: 'test-job-id',
        retry_count: 1,
        max_retries: 3,
      } as any

      const error = new Error('Network timeout')
      const shouldRetry = await retryManager.shouldRetry(job, error)

      expect(shouldRetry).toBe(true)
    })

    it('should not retry permanent errors', async () => {
      const job = {
        id: 'test-job-id',
        retry_count: 1,
        max_retries: 3,
      } as any

      const error = new Error('Invalid input: missing field')
      const shouldRetry = await retryManager.shouldRetry(job, error)

      expect(shouldRetry).toBe(false)
    })
  })

  describe('Schedule Retry', () => {
    it('should call schedule_job_retry RPC function', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ error: null })

      const job = {
        id: 'test-job-id',
        retry_count: 1,
      } as any

      const error = new Error('Network timeout')

      await retryManager.scheduleRetry(job, error)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('schedule_job_retry', {
        job_id: 'test-job-id',
        error_msg: 'Network timeout',
        error_cd: 'UNKNOWN_ERROR',
      })
    })

    it('should throw error if RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        error: new Error('Database error'),
      })

      const job = {
        id: 'test-job-id',
        retry_count: 1,
      } as any

      const error = new Error('Network timeout')

      await expect(retryManager.scheduleRetry(job, error)).rejects.toThrow(
        'Failed to schedule retry'
      )
    })
  })

  describe('Mark Permanently Failed', () => {
    it('should update job status to failed', async () => {
      const updateMock = vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      }))

      mockSupabase.from.mockReturnValueOnce({
        update: updateMock,
      })

      const job = {
        id: 'test-job-id',
        retry_count: 3,
      } as any

      const error = new Error('Permanent failure')

      await retryManager.markPermanentlyFailed(job, error)

      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_jobs')
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error_message: 'Permanent failure',
          error_code: 'PERMANENT_FAILURE',
        })
      )
    })
  })

  describe('Retry Statistics', () => {
    it('should calculate retry statistics correctly', () => {
      const job = {
        id: 'test-job-id',
        retry_count: 2,
        max_retries: 3,
        retry_error_log: [
          { attempt: 1, error: 'First error' },
          { attempt: 2, error: 'Second error' },
        ],
        retry_after: '2025-11-22T12:00:00Z',
      } as any

      const stats = retryManager.getRetryStatistics(job)

      expect(stats.attemptsRemaining).toBe(1)
      expect(stats.totalAttempts).toBe(2)
      expect(stats.errorHistory).toHaveLength(2)
      expect(stats.nextRetryTime).toBeInstanceOf(Date)
    })

    it('should handle null retry_after', () => {
      const job = {
        id: 'test-job-id',
        retry_count: 1,
        max_retries: 3,
        retry_error_log: [],
        retry_after: null,
      } as any

      const stats = retryManager.getRetryStatistics(job)

      expect(stats.nextRetryTime).toBeNull()
    })
  })

  describe('Ready for Retry Check', () => {
    it('should return true if retry_after is null', () => {
      const job = {
        retry_after: null,
      } as any

      const isReady = retryManager.isReadyForRetry(job)
      expect(isReady).toBe(true)
    })

    it('should return true if retry_after has passed', () => {
      const pastTime = new Date(Date.now() - 1000).toISOString()
      const job = {
        retry_after: pastTime,
      } as any

      const isReady = retryManager.isReadyForRetry(job)
      expect(isReady).toBe(true)
    })

    it('should return false if retry_after is in future', () => {
      const futureTime = new Date(Date.now() + 60000).toISOString()
      const job = {
        retry_after: futureTime,
      } as any

      const isReady = retryManager.isReadyForRetry(job)
      expect(isReady).toBe(false)
    })
  })
})
