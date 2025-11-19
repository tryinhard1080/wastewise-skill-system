
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    console.log('Checking latest job...')
    const { data, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error('Error:', error)
    } else if (data && data.length > 0) {
        console.log('Latest job:', data[0].id)
        console.log('Status:', data[0].status)
        console.log('Error:', data[0].error_message)
    } else {
        console.log('No jobs found')
    }
}

main()
