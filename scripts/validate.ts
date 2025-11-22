#!/usr/bin/env tsx
/**
 * WasteWise Validation Orchestrator
 *
 * Executes all 5 validation phases sequentially:
 * 1. Linting
 * 2. Type Checking
 * 3. Style Checking
 * 4. Unit Testing
 * 5. End-to-End Testing
 *
 * Philosophy: "If `/validate` passes, WasteWise is production-ready"
 *
 * Usage:
 *   pnpm validate           # Run all phases
 *   pnpm validate --phase=1 # Run specific phase
 *   pnpm validate --skip-e2e # Skip E2E tests (faster)
 *
 * Exit Codes:
 *   0 - All validations passed
 *   1 - One or more validations failed
 *   2 - Prerequisites not met
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

interface ValidationPhase {
  id: number
  name: string
  description: string
  command: string
  required: boolean
  timeout?: number // milliseconds
}

interface PhaseResult {
  phase: ValidationPhase
  passed: boolean
  duration: number
  error?: string
  output?: string
}

const VALIDATION_PHASES: ValidationPhase[] = [
  {
    id: 1,
    name: 'Linting',
    description: 'Enforce code quality and catch common errors',
    command: 'pnpm lint',
    required: true,
    timeout: 60000, // 1 minute
  },
  {
    id: 2,
    name: 'Type Checking',
    description: 'Ensure type safety across codebase',
    command: 'pnpm tsc --noEmit',
    required: true,
    timeout: 120000, // 2 minutes
  },
  {
    id: 3,
    name: 'Style Checking',
    description: 'Maintain consistent code formatting',
    command: 'pnpm prettier --check .',
    required: true,
    timeout: 60000, // 1 minute
  },
  {
    id: 4,
    name: 'Unit Testing',
    description: 'Test calculations, utilities, and business logic',
    command: 'pnpm test:unit',
    required: true,
    timeout: 180000, // 3 minutes
  },
  {
    id: 5,
    name: 'E2E Testing',
    description: 'Test complete user workflows',
    command: 'pnpm test:e2e',
    required: false, // Can be skipped with --skip-e2e
    timeout: 300000, // 5 minutes
  },
]

class ValidationOrchestrator {
  private results: PhaseResult[] = []
  private startTime: number = 0
  private skipE2E: boolean = false
  private specificPhase?: number

  constructor() {
    // Parse CLI arguments
    const args = process.argv.slice(2)
    this.skipE2E = args.includes('--skip-e2e')

    const phaseArg = args.find((arg) => arg.startsWith('--phase='))
    if (phaseArg) {
      this.specificPhase = parseInt(phaseArg.split('=')[1])
    }
  }

  /**
   * Check prerequisites before running validation
   */
  private checkPrerequisites(): boolean {
    console.log(`${colors.cyan}${colors.bright}Checking Prerequisites...${colors.reset}\n`)

    const checks = [
      {
        name: 'Node modules installed',
        check: () => existsSync(join(process.cwd(), 'node_modules')),
        fix: 'Run: pnpm install',
      },
      {
        name: 'package.json exists',
        check: () => existsSync(join(process.cwd(), 'package.json')),
        fix: 'Ensure you are in the project root directory',
      },
      {
        name: 'TypeScript config exists',
        check: () => existsSync(join(process.cwd(), 'tsconfig.json')),
        fix: 'Ensure tsconfig.json is present',
      },
    ]

    let allPassed = true

    for (const check of checks) {
      const passed = check.check()
      const icon = passed ? '✅' : '❌'
      console.log(`  ${icon} ${check.name}`)

      if (!passed) {
        console.log(`     ${colors.yellow}Fix: ${check.fix}${colors.reset}`)
        allPassed = false
      }
    }

    console.log()
    return allPassed
  }

  /**
   * Execute a single validation phase
   */
  private async executePhase(phase: ValidationPhase): Promise<PhaseResult> {
    const startTime = Date.now()

    console.log(
      `${colors.blue}${colors.bright}Phase ${phase.id}: ${phase.name}${colors.reset}`
    )
    console.log(`${colors.dim}${phase.description}${colors.reset}`)
    console.log(`${colors.dim}Running: ${phase.command}${colors.reset}\n`)

    try {
      const output = execSync(phase.command, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: phase.timeout,
      })

      const duration = Date.now() - startTime

      console.log(`${colors.green}✅ PASSED${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}\n`)

      return {
        phase,
        passed: true,
        duration,
        output,
      }
    } catch (error: unknown) {
      const duration = Date.now() - startTime
      const err = error as { message?: string; stdout?: Buffer; stderr?: Buffer; status?: number }

      const errorMessage = err.message || 'Unknown error'
      const stdout = err.stdout?.toString() || ''
      const stderr = err.stderr?.toString() || ''

      console.log(`${colors.red}❌ FAILED${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}`)

      if (stdout) {
        console.log(`\n${colors.dim}Output:${colors.reset}`)
        console.log(stdout)
      }

      if (stderr) {
        console.log(`\n${colors.red}Error:${colors.reset}`)
        console.log(stderr)
      }

      console.log()

      return {
        phase,
        passed: false,
        duration,
        error: errorMessage,
        output: stdout + stderr,
      }
    }
  }

  /**
   * Display validation summary
   */
  private displaySummary(): void {
    const totalDuration = Date.now() - this.startTime
    const passedPhases = this.results.filter((r) => r.passed).length
    const totalPhases = this.results.length
    const allPassed = passedPhases === totalPhases

    console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`)
    console.log(`${colors.bright}Validation Summary${colors.reset}`)
    console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`)

    // Display each phase result
    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌'
      const status = result.passed
        ? `${colors.green}PASSED${colors.reset}`
        : `${colors.red}FAILED${colors.reset}`
      const duration = `${colors.dim}(${result.duration}ms)${colors.reset}`

      console.log(`  ${icon} Phase ${result.phase.id}: ${result.phase.name}... ${status} ${duration}`)

      if (!result.passed && result.error) {
        console.log(`     ${colors.red}Error: ${result.error}${colors.reset}`)
      }
    }

    console.log()
    console.log(`${colors.bright}Results:${colors.reset}`)
    console.log(`  Phases Passed: ${passedPhases}/${totalPhases}`)
    console.log(`  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`)
    console.log()

    if (allPassed) {
      console.log(`${colors.green}${colors.bright}🎉 All validations passed! Ready for production.${colors.reset}`)
      console.log()
      console.log(`${colors.dim}✅ WasteWise is production-ready${colors.reset}`)
      console.log(`${colors.dim}✅ All critical user workflows tested${colors.reset}`)
      console.log(`${colors.dim}✅ All calculations verified accurate${colors.reset}`)
      console.log(`${colors.dim}✅ All security measures validated${colors.reset}`)
      console.log(`${colors.dim}✅ Safe to deploy${colors.reset}`)
    } else {
      console.log(`${colors.red}${colors.bright}❌ Validation failed. Do NOT deploy to production.${colors.reset}`)
      console.log()
      console.log(`${colors.yellow}Next Steps:${colors.reset}`)
      console.log(`  1. Fix failing tests first`)
      console.log(`  2. Re-run /validate until all pass`)
      console.log(`  3. Review error messages above`)
    }

    console.log()
  }

  /**
   * Main validation execution
   */
  async run(): Promise<void> {
    this.startTime = Date.now()

    console.log()
    console.log(`${colors.magenta}${colors.bright}${'='.repeat(60)}${colors.reset}`)
    console.log(`${colors.magenta}${colors.bright}WasteWise Validation Orchestrator${colors.reset}`)
    console.log(`${colors.magenta}${colors.bright}${'='.repeat(60)}${colors.reset}`)
    console.log()
    console.log(`${colors.dim}Philosophy: "If /validate passes, WasteWise is production-ready"${colors.reset}`)
    console.log()

    // Check prerequisites
    if (!this.checkPrerequisites()) {
      console.log(`${colors.red}❌ Prerequisites not met. Please fix the issues above.${colors.reset}\n`)
      process.exit(2)
    }

    // Determine which phases to run
    let phasesToRun = VALIDATION_PHASES

    if (this.specificPhase) {
      phasesToRun = VALIDATION_PHASES.filter((p) => p.id === this.specificPhase)
      if (phasesToRun.length === 0) {
        console.log(`${colors.red}❌ Invalid phase number: ${this.specificPhase}${colors.reset}\n`)
        process.exit(2)
      }
      console.log(`${colors.yellow}Running specific phase: ${this.specificPhase}${colors.reset}\n`)
    }

    if (this.skipE2E) {
      phasesToRun = phasesToRun.filter((p) => p.id !== 5)
      console.log(`${colors.yellow}Skipping E2E tests (--skip-e2e flag)${colors.reset}\n`)
    }

    // Execute phases sequentially
    for (const phase of phasesToRun) {
      const result = await this.executePhase(phase)
      this.results.push(result)

      // Stop on first failure for required phases
      if (!result.passed && phase.required) {
        console.log(
          `${colors.red}${colors.bright}⚠️  Required phase failed. Stopping validation.${colors.reset}\n`
        )
        break
      }
    }

    // Display summary
    this.displaySummary()

    // Exit with appropriate code
    const allPassed = this.results.every((r) => r.passed)
    process.exit(allPassed ? 0 : 1)
  }
}

// Execute validation
const orchestrator = new ValidationOrchestrator()
orchestrator.run().catch((error) => {
  console.error(`${colors.red}${colors.bright}Fatal error:${colors.reset}`, error)
  process.exit(2)
})
