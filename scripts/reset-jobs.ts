import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)


async function main() {
    console.log('Resetting stuck jobs to pending...')
    console.log('Service Key loaded:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)


    const { data, error } = await supabase
        .from('analysis_jobs')
        .update({
            status: 'pending',
            started_at: null,
            error_message: null,
            error_code: null,
            worker_id: null,
            retry_count: 0
        })
        .in('status', ['processing', 'failed'])
        .select()

    if (error) {
        console.error('Error resetting jobs:', error)
    } else {
        console.log(`Reset ${data.length} jobs to pending.`)
        data.forEach(job => {
            console.log(`- Reset job ${job.id}`)
        })
    }
}

main()
