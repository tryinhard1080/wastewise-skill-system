#!/usr/bin/env tsx

/**
 * WasteWise Formula Validation Evals
 *
 * Runs comprehensive validation of TypeScript calculations against canonical formulas
 * and Python reference implementations. Ensures all calculations meet <0.01% tolerance.
 *
 * Usage:
 *   pnpm eval                    # Run all evals
 *   tsx scripts/run-evals.ts     # Direct execution
 *
 * Exit Codes:
 *   0 - All evals passed
 *   1 - One or more evals failed or error occurred
 */

import { runAllEvals } from '../lib/evals'
import { validateFormulaConstants, formatValidationReport } from '../lib/evals/formula-validator'
import type { EvalSummary } from '../lib/evals/types'

/**
 * Main eval runner
 */
async function main() {
  console.log('🧪 WasteWise Formula Validation Evals')
  console.log('=' .repeat(80))
  console.log('')

  let hasErrors = false

  // Step 1: Validate formula constants
  console.log('📋 Step 1: Validating Formula Constants...')
  console.log('-'.repeat(80))

  try {
    const constantReport = validateFormulaConstants()
    console.log(formatValidationReport(constantReport))

    if (constantReport.mismatches.length > 0) {
      console.error('\n❌ Formula constant validation FAILED')
      console.error('   Please ensure lib/constants/formulas.ts matches WASTE_FORMULAS_REFERENCE.md')
      hasErrors = true
    } else {
      console.log('✅ All formula constants validated\n')
    }
  } catch (error) {
    console.error('❌ Formula constant validation ERROR:', error)
    hasErrors = true
  }

  // Step 2: Run skill evals
  console.log('\n📋 Step 2: Running Skill Calculation Evals...')
  console.log('-'.repeat(80))
  console.log('')

  let evalResults: Awaited<ReturnType<typeof runAllEvals>>

  try {
    evalResults = await runAllEvals()

    // Print individual skill results
    for (const skillResult of evalResults.skillResults) {
      printSkillSummary(skillResult)
    }

    // Print aggregate summary
    console.log('\n')
    console.log('=' .repeat(80))
    console.log('📊 OVERALL EVAL RESULTS')
    console.log('=' .repeat(80))
    console.log(`Total Tests:  ${evalResults.totalTests}`)
    console.log(`Passed:       ${evalResults.passing} ✅`)
    console.log(`Failed:       ${evalResults.failing} ${evalResults.failing > 0 ? '❌' : ''}`)
    console.log(`Pass Rate:    ${evalResults.passRate.toFixed(2)}%`)
    console.log(`Executed:     ${evalResults.executedAt.toISOString()}`)
    console.log('=' .repeat(80))

    if (evalResults.failing > 0) {
      console.error('\n❌ EVALS FAILED!')
      console.error('   Calculations do not match reference implementation within tolerance.')
      console.error('   Review the failed tests above and ensure formulas are correct.')
      hasErrors = true
    } else {
      console.log('\n✅ ALL EVALS PASSED!')
      console.log('   All calculations are accurate and match reference implementations.')
    }

  } catch (error) {
    console.error('❌ Eval execution ERROR:', error)
    hasErrors = true
  }

  // Exit with appropriate code
  if (hasErrors) {
    console.error('\n❌ Validation failed. Calculations are NOT production-ready.')
    process.exit(1)
  } else {
    console.log('\n✅ Validation complete. All calculations are production-ready!')
    process.exit(0)
  }
}

/**
 * Print summary for a single skill eval
 */
function printSkillSummary(summary: EvalSummary) {
  const status = summary.failing === 0 ? '✅' : '❌'
  console.log(`${status} Skill: ${summary.results[0]?.description.split(' - ')[0] || 'Unknown'}`)
  console.log(`   Tests: ${summary.passing}/${summary.totalTests} passed`)

  if (summary.failing > 0) {
    console.log(`   Failed tests:`)
    summary.results
      .filter(r => !r.pass)
      .forEach(r => {
        console.log(`     - ${r.testCaseId}: ${r.description}`)
        if (r.error) {
          console.log(`       Error: ${r.error}`)
        }
        r.comparisons
          .filter(c => !c.pass)
          .forEach(c => {
            const percentDiff = (c.percentDiff * 100).toFixed(4)
            console.log(`       ${c.metric}: ${c.tsValue} vs ${c.pythonValue} (${percentDiff}% diff)`)
          })
      })
  }
  console.log('')
}

/**
 * Handle unhandled errors gracefully
 */
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error during eval execution:', error)
  process.exit(1)
})

// Run main function
main().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
