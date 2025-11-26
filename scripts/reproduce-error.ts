import { createClient } from '@/lib/supabase/server'
import dotenv from 'dotenv'
import path from 'path'

// Mock cookies for the worker environment if needed, or see if it fails
// But first let's just try to import and run it.
// Note: We can't easily run this with tsx if it depends on Next.js headers/cookies 
// unless we mock them.

// Instead, let's try to simulate what the worker does.
// The worker runs with `tsx scripts/start-worker.ts`.
// It imports `registerAllSkills` -> `registry` -> `getConfig`.

// Let's make a script that imports registry and calls getConfig.
import { skillRegistry } from '@/lib/skills/registry'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function main() {
    console.log('Attempting to get config for wastewise-analytics...')
    try {
        const config = await skillRegistry.getConfig('wastewise-analytics')
        console.log('Success:', config)
    } catch (error) {
        console.error('Caught error:')
        console.error(error)
    }
}

main()
