import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const jobId = process.argv[2]

if (!jobId) {
  console.error('Usage: tsx check-job-status.ts <job-id>')
  process.exit(1)
}

async function main() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }}
  )

  const { data, error } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log(`\n📊 Job Status: ${data.status}`)
  console.log(`   Job ID: ${data.id}`)
  console.log(`   Type: ${data.job_type}`)
  console.log(`   Created: ${data.created_at}`)
  console.log(`   Started: ${data.started_at || 'N/A'}`)
  console.log(`   Completed: ${data.completed_at || 'N/A'}`)
  console.log(`   Progress: ${data.progress_percent}%`)
  console.log(`   Current Step: ${data.current_step || 'N/A'}`)
  console.log(`   Retry Count: ${data.retry_count}`)

  if (data.error_message) {
    console.log(`\n❌ Error: ${data.error_message}`)
    console.log(`   Error Code: ${data.error_code || 'N/A'}`)
  }

  if (data.result_data) {
    console.log(`\n✅ Has Result Data: Yes`)
  }

  console.log('')
}

main().catch(console.error)
