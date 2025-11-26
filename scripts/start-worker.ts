/**
 * Start Background Worker
 *
 * Entry point for the analysis job background worker.
 * Loads environment variables, validates configuration, and starts the worker.
 *
 * Usage:
 *   pnpm worker           # Start worker with default settings
 *   pnpm worker --poll=5000  # Custom poll interval (5 seconds)
 *
 * Environment Variables Required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */


import fs from 'fs'
fs.appendFileSync('debug-worker.txt', '!!! LOADING START-WORKER.TS - ' + new Date().toISOString() + ' !!!\n')
console.log('!!! LOADING START-WORKER.TS - ' + new Date().toISOString() + ' !!!')

import { AnalysisWorker } from '../lib/workers/analysis-worker'
import { logger } from '../lib/observability/logger'
import { registerAllSkills } from '../lib/skills/skills'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    logger.error('Missing required environment variables', undefined, { missing })
    console.error('\nMissing required environment variables:')
    missing.forEach((key) => console.error(`  - ${key}`))
    console.error('\nPlease check your .env.local file\n')
    process.exit(1)
  }

  logger.info('Environment variables validated successfully')
}

/**
 * Parse command line arguments
 */
function parseArgs(): { pollInterval?: number; maxConcurrentJobs?: number } {
  const args = process.argv.slice(2)
  const config: { pollInterval?: number; maxConcurrentJobs?: number } = {}

  args.forEach((arg) => {
    if (arg.startsWith('--poll=')) {
      const value = parseInt(arg.split('=')[1], 10)
      if (!isNaN(value) && value > 0) {
        config.pollInterval = value
      }
    }

    if (arg.startsWith('--concurrent=')) {
      const value = parseInt(arg.split('=')[1], 10)
      if (!isNaN(value) && value > 0) {
        config.maxConcurrentJobs = value
      }
    }
  })

  return config
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  WasteWise Analysis Worker')
  console.log('═══════════════════════════════════════════════════════\n')

  // Validate environment
  logger.info('Validating environment configuration')
  validateEnvironment()

  // Parse command line arguments
  const cliConfig = parseArgs()

  // Create worker configuration
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    pollInterval: cliConfig.pollInterval || 2000,
    maxConcurrentJobs: cliConfig.maxConcurrentJobs || 1,
  }

  logger.info('Worker configuration loaded', undefined, {
    pollIntervalMs: config.pollInterval,
    maxConcurrentJobs: config.maxConcurrentJobs,
  })

  console.log('Configuration:')
  console.log(`  Poll Interval: ${config.pollInterval}ms`)
  console.log(`  Max Concurrent Jobs: ${config.maxConcurrentJobs}`)
  console.log(`  Supabase URL: ${config.supabaseUrl}`)
  console.log('')

  // Create worker instance
  const worker = new AnalysisWorker(config)

  // Setup graceful shutdown handlers
  const shutdown = () => {
    console.log('\n\nReceived shutdown signal...')
    logger.info('Initiating graceful shutdown')

    worker.stop()

    console.log('Worker stopped successfully')
    logger.info('Worker shutdown complete')

    process.exit(0)
  }

  process.on('SIGINT', shutdown) // Ctrl+C
  process.on('SIGTERM', shutdown) // Docker/K8s termination

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error)
    console.error('\nUncaught Exception:')
    console.error(error)
    process.exit(1)
  })

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', reason as Error, { promise })
    console.error('\nUnhandled Promise Rejection:')
    console.error(reason)
    process.exit(1)
  })

  // Start worker
  try {
    console.log('Registering skills...')
    logger.info('Registering all skills')
    registerAllSkills()

    console.log('Starting worker...\n')
    logger.info('Starting worker process')

    await worker.start()

    console.log('Worker started successfully')
    console.log('Polling for analysis jobs...')
    console.log('Press Ctrl+C to stop\n')
  } catch (error) {
    logger.error('Worker failed to start', error as Error)
    console.error('\nWorker failed to start:')
    console.error(error)
    process.exit(1)
  }
}

// Run main function
main().catch((error) => {
  logger.error('Fatal error in worker startup', error as Error)
  console.error('\nFatal error:')
  console.error(error)
  process.exit(1)
})
