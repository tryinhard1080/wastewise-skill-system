
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
    console.log('Testing claim_next_analysis_job RPC...')

    const { data, error } = await supabase.rpc('claim_next_analysis_job')

    if (error) {
        console.error('RPC call failed:', error)
        process.exit(1)
    }

    if (data) {
        console.log('Claimed job:', data.id)
        console.log('Status:', data.status)
    } else {
        console.log('No jobs available to claim')
    }
}

main()
