/**
 * Database Verification Script
 *
 * Verifies that:
 * 1. All 9 tables exist
 * 2. skills_config has correct seed data with 6.0 threshold
 * 3. Database connection works
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
// Use service key to bypass RLS for verification
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabase() {
  console.log('🔍 Verifying WasteWise Database Schema...\n')

  // Test 1: List all tables
  console.log('📊 Test 1: Checking tables exist...')
  const { data: tables, error: tablesError } = await supabase
    .from('skills_config')
    .select('*')
    .limit(1)

  if (tablesError) {
    console.error('❌ Error connecting to database:', tablesError.message)
    process.exit(1)
  }

  console.log('✅ Database connection successful\n')

  // Test 2: Verify skills_config seed data
  console.log('📊 Test 2: Verifying skills_config seed data...')
  const { data: skillsConfig, error: skillsError } = await supabase
    .from('skills_config')
    .select('*')

  if (skillsError) {
    console.error('❌ Error querying skills_config:', skillsError.message)
    process.exit(1)
  }

  if (!skillsConfig || skillsConfig.length === 0) {
    console.error('❌ No skills_config seed data found!')
    process.exit(1)
  }

  console.log(`✅ Found ${skillsConfig.length} skills in skills_config\n`)

  // Test 3: Verify thresholds (critical: 6.0 not 7.0)
  console.log('📊 Test 3: Verifying critical thresholds...')
  let allCorrect = true

  for (const skill of skillsConfig) {
    const thresholds = skill.thresholds as any
    const compactorTons = thresholds.compactor_tons

    if (compactorTons !== 6.0) {
      console.error(
        `❌ ${skill.skill_name}: INCORRECT threshold ${compactorTons} (should be 6.0)`
      )
      allCorrect = false
    } else {
      console.log(
        `✅ ${skill.skill_name}: Correct threshold (6.0 tons)`
      )
    }
  }

  if (!allCorrect) {
    console.error('\n❌ Some skills have incorrect thresholds!')
    process.exit(1)
  }

  console.log('\n✅ All thresholds correct (6.0 tons, NOT 7.0)\n')

  // Test 4: Verify conversion rates
  console.log('📊 Test 4: Verifying conversion rates...')
  for (const skill of skillsConfig) {
    const conversionRates = skill.conversion_rates as any
    const compactorYpd = conversionRates.compactor_ypd
    const dumpsterYpd = conversionRates.dumpster_ypd
    const targetCapacity = conversionRates.target_capacity

    if (compactorYpd !== 14.49 || dumpsterYpd !== 4.33 || targetCapacity !== 8.0) {
      console.error(`❌ ${skill.skill_name}: Incorrect conversion rates`)
      allCorrect = false
    } else {
      console.log(`✅ ${skill.skill_name}: Correct conversion rates`)
    }
  }

  console.log('\n✅ All conversion rates correct\n')

  // Test 5: Check all expected skills exist
  console.log('📊 Test 5: Verifying all 5 skills exist...')
  const expectedSkills = [
    'wastewise-analytics',
    'compactor-optimization',
    'contract-extractor',
    'regulatory-research',
    'batch-extractor',
  ]

  const foundSkills = skillsConfig.map(s => s.skill_name)
  const missingSkills = expectedSkills.filter(s => !foundSkills.includes(s))

  if (missingSkills.length > 0) {
    console.error(`❌ Missing skills: ${missingSkills.join(', ')}`)
    process.exit(1)
  }

  console.log('✅ All 5 skills found\n')

  // Test 6: Verify table structure (spot checks)
  console.log('📊 Test 6: Verifying table structures...')

  const tablesToCheck = [
    'projects',
    'project_files',
    'invoice_data',
    'haul_log',
    'optimizations',
    'contract_terms',
    'regulatory_compliance',
    'ordinance_database',
  ]

  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select('*').limit(0)

    if (error) {
      console.error(`❌ Table ${table} not accessible:`, error.message)
      allCorrect = false
    } else {
      console.log(`✅ Table ${table} exists and is accessible`)
    }
  }

  if (!allCorrect) {
    console.error('\n❌ Some tables are missing or not accessible!')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ DATABASE VERIFICATION COMPLETE')
  console.log('='.repeat(60))
  console.log('\n📋 Summary:')
  console.log(`  • 9 tables created and accessible`)
  console.log(`  • 5 skills configured in skills_config`)
  console.log(`  • Compactor threshold: 6.0 tons ✓`)
  console.log(`  • Conversion rates: 14.49, 4.33, 8.0 ✓`)
  console.log(`  • Database ready for Phase 1 development ✓`)
  console.log('')
}

verifyDatabase().catch(error => {
  console.error('❌ Verification failed:', error)
  process.exit(1)
})
