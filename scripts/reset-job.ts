import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const jobId = process.argv[2]

if (!jobId) {
  console.error('Usage: tsx reset-job.ts <job-id>')
  process.exit(1)
}

async function main() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  console.log(`\n🔄 Resetting job ${jobId} to pending status...\n`)

  const { data, error } = await supabase
    .from('analysis_jobs')
    .update({
      status: 'pending',
      started_at: null,
      progress_percent: 0,
      current_step: null,
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log('✅ Job reset successfully!')
  console.log(`   Job ID: ${data.id}`)
  console.log(`   Status: ${data.status}`)
  console.log(`   Progress: ${data.progress_percent}%`)
  console.log('')
}

main().catch(console.error)
