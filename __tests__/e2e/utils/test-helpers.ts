/**
 * E2E Test Helper Functions for WasteWise
 *
 * These utilities provide common functionality for E2E tests including:
 * - User management (create/delete test users)
 * - Project setup (seed/cleanup test data)
 * - Job monitoring (poll for async completion)
 * - File operations (upload/download validation)
 */

import { Page } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization of Supabase client
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY. ' +
        'Please ensure .env.local is configured before running E2E tests.'
      )
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return _supabaseAdmin
}

/**
 * Create a test user with email and password
 * @returns userId of created user
 */
export async function createTestUser(
  email: string,
  password: string
): Promise<string> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email for testing
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  if (!data.user) {
    throw new Error('No user returned from createUser')
  }

  return data.user.id
}

/**
 * Delete a test user and all associated data
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Delete user's projects (cascade will handle related data)
  await supabase
    .from('projects')
    .delete()
    .eq('user_id', userId)

  // Delete user's analysis jobs
  await supabase
    .from('analysis_jobs')
    .delete()
    .eq('user_id', userId)

  // Delete the user
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error deleting test user:', error)
  }
}

/**
 * Create a test project with sample data
 * @returns projectId of created project
 */
export async function createTestProject(
  userId: string,
  projectData: {
    property_name: string
    units: number
    property_type: string
    equipment_type: string
    location?: string
  }
): Promise<string> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      property_name: projectData.property_name,
      units: projectData.units,
      property_type: projectData.property_type,
      equipment_type: projectData.equipment_type,
      location: projectData.location || null,
      status: 'draft'
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test project: ${error.message}`)
  }

  return data.id
}

/**
 * Delete a test project and all associated data
 */
export async function deleteTestProject(projectId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Delete project files from storage
  const { data: files } = await supabase
    .from('project_files')
    .select('storage_path')
    .eq('project_id', projectId)

  if (files && files.length > 0) {
    const filePaths = files.map(f => f.storage_path)
    await supabase.storage.from('project-files').remove(filePaths)
  }

  // Delete project (cascade will handle related tables)
  await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
}

/**
 * Wait for an analysis job to complete
 * @param page - Playwright page object
 * @param jobId - ID of the analysis job
 * @param timeout - Maximum time to wait in milliseconds (default: 5 minutes)
 * @returns Job result data if successful
 */
export async function waitForJobCompletion(
  page: Page,
  jobId: string,
  timeout: number = 300000 // 5 minutes
): Promise<any> {
  const startTime = Date.now()
  const pollInterval = 2000 // Poll every 2 seconds

  while (Date.now() - startTime < timeout) {
    // Check job status via API
    const response = await page.request.get(`/api/jobs/${jobId}`)

    if (!response.ok()) {
      const status = response.status()
      throw new Error(`Failed to fetch job status: ${status}`)
    }

    const job = await response.json()

    if (job.status === 'completed') {
      return job.result_data
    }

    if (job.status === 'failed') {
      throw new Error(`Job failed: ${job.error_message || 'Unknown error'}`)
    }

    // Job still processing - wait before polling again
    await page.waitForTimeout(pollInterval)
  }

  throw new Error(`Job ${jobId} did not complete within ${timeout}ms`)
}

/**
 * Upload a file through the UI
 * @param page - Playwright page object
 * @param filePath - Absolute path to the file
 * @param inputSelector - CSS selector for the file input (default: 'input[type="file"]')
 */
export async function uploadFileViaUI(
  page: Page,
  filePath: string,
  inputSelector: string = 'input[type="file"]'
): Promise<void> {
  const fileInput = page.locator(inputSelector)
  await fileInput.setInputFiles(filePath)
}

/**
 * Download a file and verify it was downloaded
 * @param page - Playwright page object
 * @param buttonSelector - CSS selector for the download button
 * @returns Download object with file details
 */
export async function downloadFile(
  page: Page,
  buttonSelector: string
): Promise<{ filename: string; path: string }> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click(buttonSelector)
  ])

  const filename = download.suggestedFilename()
  const path = await download.path()

  if (!path) {
    throw new Error('Download failed - no file path')
  }

  return { filename, path }
}

/**
 * Login to the application
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login')
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', password)
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })
}

/**
 * Logout from the application
 * @param page - Playwright page object
 */
export async function logoutUser(page: Page): Promise<void> {
  // Click user menu
  await page.click('[data-testid="user-menu"]')

  // Click logout
  await page.click('text=Logout')

  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 5000 })
}

/**
 * Get the current job progress from the processing page
 * @param page - Playwright page object
 * @returns Current progress percentage
 */
export async function getCurrentJobProgress(page: Page): Promise<number> {
  const progressText = await page.textContent('[data-testid="progress-percent"]')

  if (!progressText) {
    return 0
  }

  // Extract number from text like "45%"
  const match = progressText.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Wait for a specific job progress milestone
 * @param page - Playwright page object
 * @param targetPercent - Target progress percentage
 * @param timeout - Maximum time to wait
 */
export async function waitForProgress(
  page: Page,
  targetPercent: number,
  timeout: number = 60000
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const currentProgress = await getCurrentJobProgress(page)

    if (currentProgress >= targetPercent) {
      return
    }

    await page.waitForTimeout(2000)
  }

  throw new Error(`Progress did not reach ${targetPercent}% within ${timeout}ms`)
}

/**
 * Seed invoice data for a project
 */
export async function seedInvoiceData(
  projectId: string,
  invoices: Array<{
    service_month: string
    total_amount: number
    line_items: any[]
  }>
): Promise<void> {
  const supabase = getSupabaseAdmin()

  for (const invoice of invoices) {
    await supabase.from('invoice_data').insert({
      project_id: projectId,
      service_month: invoice.service_month,
      total_amount: invoice.total_amount,
      line_items: invoice.line_items,
      extraction_method: 'test_seed'
    })
  }
}

/**
 * Seed haul log data for a project
 */
export async function seedHaulLogData(
  projectId: string,
  hauls: Array<{
    pickup_date: string
    tons: number
    compactor_id?: string
  }>
): Promise<void> {
  const supabase = getSupabaseAdmin()

  for (const haul of hauls) {
    await supabase.from('haul_log').insert({
      project_id: projectId,
      pickup_date: haul.pickup_date,
      tons: haul.tons,
      compactor_id: haul.compactor_id || null,
      extraction_method: 'test_seed'
    })
  }
}

/**
 * Verify file exists in Supabase storage
 */
export async function verifyFileInStorage(
  bucket: string,
  filePath: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { data, error} = await supabase.storage
    .from(bucket)
    .list(filePath.split('/').slice(0, -1).join('/'))

  if (error) {
    return false
  }

  const filename = filePath.split('/').pop()
  return data?.some(file => file.name === filename) || false
}
