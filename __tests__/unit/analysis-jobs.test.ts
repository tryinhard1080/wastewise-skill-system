import { describe, expect, it } from 'vitest'
import {
  type AnalysisJob,
  sortAnalysisJobsByCreatedAtDesc,
} from '@/lib/analysis-jobs'

describe('sortAnalysisJobsByCreatedAtDesc', () => {
  it('sorts jobs so the most recent rerun is returned first', () => {
    const jobs: AnalysisJob[] = [
      {
        id: 'job-1',
        status: 'completed',
        created_at: '2024-01-01T10:00:00.000Z',
      },
      {
        id: 'job-2',
        status: 'completed',
        created_at: '2024-01-05T12:00:00.000Z',
      },
      {
        id: 'job-3',
        status: 'running',
        created_at: '2024-01-10T12:00:00.000Z',
      },
    ]

    const sorted = sortAnalysisJobsByCreatedAtDesc(jobs as any)

    expect(sorted[0]?.id).toBe('job-3')
    expect(sorted.map((job) => job.id)).toEqual(['job-3', 'job-2', 'job-1'])
  })

  it('pushes jobs without a created_at to the end', () => {
    const jobs: AnalysisJob[] = [
      {
        id: 'job-1',
        status: 'completed',
        created_at: null,
      },
      {
        id: 'job-2',
        status: 'completed',
        created_at: '2024-01-05T12:00:00.000Z',
      },
    ]

    const sorted = sortAnalysisJobsByCreatedAtDesc(jobs as any)

    expect(sorted[0]?.id).toBe('job-2')
    expect(sorted[1]?.id).toBe('job-1')
  })
})
