import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    console.log('Checking skill_configs table...')
    const { data, error } = await supabase
        .from('skills_config')
        .select('*')

    if (error) {
        console.error('Error fetching skill configs:', error)
    } else {
        console.log(`Found ${data.length} configs:`)
        data.forEach(config => {
            console.log(`- ID: ${config.id}`)
            console.log(`  Skill Name: ${config.skill_name}`)
            console.log('---')
        })
    }
}

main()
