
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    console.log('Listing analysis jobs...')

    const { data, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Failed to list jobs:', error)
        process.exit(1)
    }

    if (data && data.length > 0) {
        console.log(`Found ${data.length} jobs:`)
        data.forEach(job => {
            console.log(`- ID: ${job.id}`)
            console.log(`  Status: ${job.status}`)
            console.log(`  Created: ${job.created_at}`)
            console.log(`  Updated: ${job.updated_at}`)
            console.log(`  User: ${job.user_id}`)
            if (job.error_message) {
                console.log(`  Error: ${job.error_message}`)
            }
            console.log('---')
        })
    } else {
        console.log('No jobs found')
    }
}

main()
