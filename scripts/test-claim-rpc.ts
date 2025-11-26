import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function main() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  console.log('\n🔍 Testing claim_next_analysis_job RPC...\n')

  // First check if any pending jobs exist
  const { data: pendingJobs, error: pendingError } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  console.log('Pending jobs:', JSON.stringify(pendingJobs, null, 2))
  console.log('Pending error:', pendingError)

  // Now try to claim a job
  console.log('\n📝 Calling claim_next_analysis_job()...\n')

  const { data: claimedJob, error: claimError } = await supabase.rpc('claim_next_analysis_job')

  console.log('Claimed job (full response):', JSON.stringify(claimedJob, null, 2))
  console.log('Claim error:', claimError)

  if (claimedJob) {
    console.log('\n✅ Job claimed!')
    console.log('   Job ID:', claimedJob.id)
    console.log('   Job Type:', claimedJob.job_type)
    console.log('   Status:', claimedJob.status)
  } else {
    console.log('\n❌ No job claimed (null response)')
  }
}

main().catch(console.error)
