import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    console.log('Checking analysis_jobs table...')
    const { data, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching jobs:', error)
    } else {
        console.log(`Found ${data.length} jobs:`)
        data.forEach(job => {
            console.log(`- ID: ${job.id}`)
            console.log(`  Status: ${job.status}`)
            console.log(`  Type: ${job.job_type}`)
            console.log(`  Created: ${job.created_at}`)
            console.log(`  Worker ID: ${job.worker_id}`)
            if (job.error_message) {
                console.log(`  Error: ${job.error_message}`)
                console.log(`  Code: ${job.error_code}`)
                console.log(`  Retries: ${job.retry_count}`)
            }
            console.log('---')
        })
    }
}

main()
