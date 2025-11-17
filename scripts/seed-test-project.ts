/**
 * Seed Test Project
 *
 * Populates local Supabase database with realistic test data for integration testing.
 *
 * Creates:
 * - Test user with credentials
 * - Sample project (compactor property)
 * - 6 months of invoice data
 * - Haul log entries
 * - Contract terms (optional)
 *
 * Usage:
 *   pnpm exec tsx scripts/seed-test-project.ts
 *
 * Environment Variables Required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Test user configuration
const TEST_USER = {
  email: 'test@wastewise.local',
  password: 'TestPassword123!',
  name: 'Test User',
}

// Test project configuration
const TEST_PROJECT = {
  property_name: 'Riverside Gardens Apartments',
  units: 250,
  city: 'Austin',
  state: 'TX',
  property_type: 'Garden-Style' as const,
  equipment_type: 'COMPACTOR' as const,
  analysis_period_months: 6,
}

// Vendor configuration
const VENDOR_NAME = 'Waste Management of Texas'

/**
 * Validate environment variables
 */
function validateEnvironment(): void {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:')
    missing.forEach((key) => console.error(`  - ${key}`))
    console.error('\nPlease check your .env.local file\n')
    process.exit(1)
  }
}

/**
 * Create Supabase admin client
 */
function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Generate random number between min and max
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1))
}

/**
 * Create or get test user
 */
async function createTestUser(supabase: ReturnType<typeof createClient<Database>>) {
  console.log('\n🔑 Creating test user...')

  // Check if user already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`)
  }

  const existingUser = existingUsers.users.find((u) => u.email === TEST_USER.email)

  if (existingUser) {
    console.log(`✓ Test user already exists: ${TEST_USER.email}`)
    return existingUser.id
  }

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
    user_metadata: {
      name: TEST_USER.name,
    },
  })

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  console.log(`✓ Created test user: ${TEST_USER.email}`)
  return data.user.id
}

/**
 * Create test project
 */
async function createTestProject(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string
) {
  console.log('\n🏢 Creating test project...')

  // Check if project already exists
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .eq('property_name', TEST_PROJECT.property_name)
    .maybeSingle()

  if (existing) {
    console.log(`✓ Test project already exists: ${TEST_PROJECT.property_name}`)
    return existing.id
  }

  // Create new project
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      property_name: TEST_PROJECT.property_name,
      units: TEST_PROJECT.units,
      city: TEST_PROJECT.city,
      state: TEST_PROJECT.state,
      property_type: TEST_PROJECT.property_type,
      equipment_type: TEST_PROJECT.equipment_type,
      analysis_period_months: TEST_PROJECT.analysis_period_months,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`)
  }

  console.log(`✓ Created project: ${TEST_PROJECT.property_name}`)
  return data.id
}

/**
 * Generate invoice data for 6 months
 */
async function generateInvoiceData(
  supabase: ReturnType<typeof createClient<Database>>,
  projectId: string
) {
  console.log('\n📄 Generating invoice data...')

  // Delete existing invoices for this project (idempotent)
  await supabase.from('invoice_data').delete().eq('project_id', projectId)

  const invoices = []
  const startDate = new Date('2025-01-01')

  for (let month = 0; month < 6; month++) {
    const invoiceDate = new Date(startDate)
    invoiceDate.setMonth(startDate.getMonth() + month)

    // Generate realistic charges
    const disposal = randomBetween(2800, 3200)
    const pickupFees = randomBetween(450, 550)
    const rental = 200 // Fixed rental
    const contamination = Math.random() > 0.7 ? randomBetween(50, 150) : 0 // 30% chance of contamination fee
    const bulkService = Math.random() > 0.6 ? randomBetween(100, 300) : 0 // 40% chance of bulk service

    const totalAmount = disposal + pickupFees + rental + contamination + bulkService

    // Calculate tonnage (12-18 tons per month)
    const tonnage = randomBetween(12, 18)

    // Estimated hauls per month (3-4)
    const hauls = randomInt(3, 4)

    invoices.push({
      project_id: projectId,
      invoice_number: `INV-2025-${String(month + 1).padStart(2, '0')}-001`,
      invoice_date: invoiceDate.toISOString().split('T')[0],
      vendor_name: VENDOR_NAME,
      service_type: 'Compactor Service',
      total_amount: Number(totalAmount.toFixed(2)),
      tonnage: Number(tonnage.toFixed(3)),
      hauls,
      charges: {
        disposal: Number(disposal.toFixed(2)),
        pickup_fees: Number(pickupFees.toFixed(2)),
        rental: Number(rental.toFixed(2)),
        ...(contamination > 0 && { contamination: Number(contamination.toFixed(2)) }),
        ...(bulkService > 0 && { bulk_service: Number(bulkService.toFixed(2)) }),
      },
      notes: `Monthly service for ${invoiceDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    })
  }

  const { error } = await supabase.from('invoice_data').insert(invoices)

  if (error) {
    throw new Error(`Failed to create invoices: ${error.message}`)
  }

  console.log(`✓ Created ${invoices.length} invoice records`)
  return invoices
}

/**
 * Generate haul log data
 */
async function generateHaulLogData(
  supabase: ReturnType<typeof createClient<Database>>,
  projectId: string
) {
  console.log('\n🚛 Generating haul log data...')

  // Delete existing haul logs for this project (idempotent)
  await supabase.from('haul_log').delete().eq('project_id', projectId)

  const hauls = []
  const startDate = new Date('2025-01-01')
  let currentDate = new Date(startDate)

  // Generate 3-4 hauls per month for 6 months (approx 22 hauls total)
  for (let i = 0; i < 22; i++) {
    // Days between hauls: 7-12 days
    const daysSinceLast = i === 0 ? 0 : randomInt(7, 12)
    currentDate = new Date(currentDate)
    currentDate.setDate(currentDate.getDate() + daysSinceLast)

    // Tonnage per haul: 3.5-6.5 tons (mix of low and high utilization)
    // Some hauls will be < 6.0 tons (optimization threshold)
    const tonnage = randomBetween(3.5, 6.5)

    // Determine status based on tonnage
    let status: 'normal' | 'low_utilization' | 'high_utilization'
    if (tonnage < 6.0) {
      status = 'low_utilization'
    } else if (tonnage > 8.0) {
      status = 'high_utilization'
    } else {
      status = 'normal'
    }

    hauls.push({
      project_id: projectId,
      haul_date: currentDate.toISOString().split('T')[0],
      tonnage: Number(tonnage.toFixed(3)),
      days_since_last: i === 0 ? null : daysSinceLast,
      status,
    })
  }

  const { error } = await supabase.from('haul_log').insert(hauls)

  if (error) {
    throw new Error(`Failed to create haul logs: ${error.message}`)
  }

  console.log(`✓ Created ${hauls.length} haul log entries`)
  return hauls
}

/**
 * Create contract terms
 */
async function createContractTerms(
  supabase: ReturnType<typeof createClient<Database>>,
  projectId: string
) {
  console.log('\n📝 Creating contract terms...')

  // Delete existing contract terms for this project (idempotent)
  await supabase.from('contract_terms').delete().eq('project_id', projectId)

  const { error } = await supabase.from('contract_terms').insert({
    project_id: projectId,
    vendor_name: VENDOR_NAME,
    service_type: 'Compactor Service',
    frequency: 'As Needed (Target 2x/week)',
    pricing_structure: {
      rental: 200,
      disposal_per_ton: 85,
      pickup_fee: 150,
      contamination_fee: 50,
    },
    term_start: '2025-01-01',
    term_end: '2025-12-31',
    auto_renewal: true,
    clauses: [
      'Service provided on an as-needed basis',
      'Target frequency: 2 pickups per week',
      'Contamination fees apply for non-approved waste',
      'Pricing subject to annual CPI adjustment',
    ],
  })

  if (error) {
    throw new Error(`Failed to create contract terms: ${error.message}`)
  }

  console.log('✓ Created contract terms')
}

/**
 * Print summary
 */
function printSummary(projectId: string, invoiceCount: number, haulCount: number) {
  console.log('\n' + '='.repeat(60))
  console.log('✅ Seed completed successfully!')
  console.log('='.repeat(60))

  console.log('\n📋 Test Credentials:')
  console.log(`  Email:    ${TEST_USER.email}`)
  console.log(`  Password: ${TEST_USER.password}`)

  console.log('\n🏢 Test Project:')
  console.log(`  ID:        ${projectId}`)
  console.log(`  Name:      ${TEST_PROJECT.property_name}`)
  console.log(`  Units:     ${TEST_PROJECT.units}`)
  console.log(`  Equipment: ${TEST_PROJECT.equipment_type}`)
  console.log(`  Location:  ${TEST_PROJECT.city}, ${TEST_PROJECT.state}`)

  console.log('\n📊 Data Created:')
  console.log(`  - ${invoiceCount} monthly invoices (Jan-Jun 2025)`)
  console.log(`  - ${haulCount} haul log entries`)
  console.log(`  - 1 contract terms record`)

  console.log('\n🚀 Next Steps:')
  console.log('  1. Start development server: pnpm dev')
  console.log('  2. Start background worker: pnpm worker')
  console.log('  3. Login with test credentials')
  console.log(`  4. Navigate to project: /projects/${projectId}`)
  console.log('  5. Click "Start Analysis"')
  console.log('')
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('\n🌱 WasteWise Test Data Seeder')
  console.log('=' .repeat(60))

  // Validate environment
  validateEnvironment()

  // Create admin client
  const supabase = createAdminClient()

  try {
    // Step 1: Create test user
    const userId = await createTestUser(supabase)

    // Step 2: Create test project
    const projectId = await createTestProject(supabase, userId)

    // Step 3: Generate invoice data
    const invoices = await generateInvoiceData(supabase, projectId)

    // Step 4: Generate haul log data
    const hauls = await generateHaulLogData(supabase, projectId)

    // Step 5: Create contract terms
    await createContractTerms(supabase, projectId)

    // Print summary
    printSummary(projectId, invoices.length, hauls.length)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Seed failed:')
    console.error((error as Error).message)
    console.error('')
    process.exit(1)
  }
}

// Run seeder
main()
