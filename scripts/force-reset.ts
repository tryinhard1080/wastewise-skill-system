
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function main() {
    console.log('Force resetting jobs...')

    const { data, error } = await supabase
        .from('analysis_jobs')
        .update({
            status: 'pending',
            started_at: null,
            error_message: null,
            error_code: null,
            retry_count: 0
        })
        .in('status', ['processing', 'failed'])
        .select()

    if (error) {
        console.error('ERROR:', error)
    } else {
        console.log('SUCCESS:', data)
    }
}

main()
