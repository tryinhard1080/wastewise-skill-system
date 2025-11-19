export type AnalysisJob = {
  id: string
  status: string
  created_at: string | null
  result_data?: Record<string, unknown> | null
}

/**
 * Returns a new array of analysis jobs sorted by created_at desc.
 * Jobs without a timestamp are pushed to the end.
 */
export function sortAnalysisJobsByCreatedAtDesc(
  jobs: AnalysisJob[] | null | undefined
): AnalysisJob[] {
  if (!jobs || jobs.length === 0) {
    return []
  }

  return [...jobs].sort((a, b) => {
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : -Infinity
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : -Infinity
    return bTime - aTime
  })
}
