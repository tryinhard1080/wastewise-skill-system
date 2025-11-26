/**
 * Create Test Analysis Job
 *
 * Creates a test analysis job for the worker to process.
 * Used for testing worker functionality.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('\n🧪 Creating test analysis job...\n')

  // Get test user
  const { data: users, error: userError } = await supabase
    .from('projects')
    .select('user_id, id, property_name')
    .limit(1)
    .single()

  if (userError || !users) {
    console.error('❌ Failed to find test project:', userError?.message)
    process.exit(1)
  }

  console.log(`✓ Found test project: ${users.property_name}`)
  console.log(`  Project ID: ${users.id}`)
  console.log(`  User ID: ${users.user_id}`)

  // Create analysis job
  const { data: job, error: jobError } = await supabase
    .from('analysis_jobs')
    .insert({
      user_id: users.user_id,
      project_id: users.id,
      job_type: 'complete_analysis',
      status: 'pending',
      input_data: { projectId: users.id },
    })
    .select()
    .single()

  if (jobError) {
    console.error('❌ Failed to create job:', jobError.message)
    process.exit(1)
  }

  console.log('\n✅ Test job created successfully!')
  console.log(`   Job ID: ${job.id}`)
  console.log(`   Job Type: ${job.job_type}`)
  console.log(`   Status: ${job.status}`)
  console.log('\n👀 Watch the worker logs to see it process the job...\n')
}

main().catch(console.error)
