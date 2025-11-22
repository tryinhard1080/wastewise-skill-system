/**
 * Row Level Security (RLS) Policy Tests
 *
 * Validates that database RLS policies prevent cross-user data access.
 *
 * CRITICAL: These tests verify that users can only access their own data.
 * Failure = security vulnerability (unauthorized data access).
 *
 * Prerequisites:
 * - Local Supabase instance running (supabase start)
 * - Environment variables configured
 *
 * Run with: pnpm test __tests__/security/rls-policies.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

describe('RLS Policies - Cross-User Access Prevention', () => {
  let adminClient: SupabaseClient
  let user1Client: SupabaseClient
  let user2Client: SupabaseClient
  let user1Id: string
  let user2Id: string
  let user1ProjectId: string
  let user1Email: string
  let user2Email: string

  beforeAll(async () => {
    // Skip if environment not configured
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Skipping RLS tests: Supabase not configured')
      return
    }

    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    // Create two test users
    const timestamp = Date.now()
    user1Email = `rls-test-user1-${timestamp}@test.wastewise.local`
    user2Email = `rls-test-user2-${timestamp}@test.wastewise.local`

    const { data: user1Data, error: user1Error } = await adminClient.auth.admin.createUser({
      email: user1Email,
      password: 'TestPassword123!SecureRLS',
      email_confirm: true,
    })

    const { data: user2Data, error: user2Error } = await adminClient.auth.admin.createUser({
      email: user2Email,
      password: 'TestPassword123!SecureRLS',
      email_confirm: true,
    })

    if (user1Error || user2Error) {
      throw new Error(`Failed to create test users: ${user1Error?.message || user2Error?.message}`)
    }

    user1Id = user1Data.user!.id
    user2Id = user2Data.user!.id

    // Sign in as user1
    const { data: session1, error: signIn1Error } = await adminClient.auth.signInWithPassword({
      email: user1Email,
      password: 'TestPassword123!SecureRLS',
    })

    if (signIn1Error) {
      throw new Error(`Failed to sign in as user1: ${signIn1Error.message}`)
    }

    // Sign in as user2
    const { data: session2, error: signIn2Error } = await adminClient.auth.signInWithPassword({
      email: user2Email,
      password: 'TestPassword123!SecureRLS',
    })

    if (signIn2Error) {
      throw new Error(`Failed to sign in as user2: ${signIn2Error.message}`)
    }

    // Create authenticated clients
    user1Client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session1.session!.access_token}`,
        },
      },
      auth: { persistSession: false },
    })

    user2Client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${session2.session!.access_token}`,
        },
      },
      auth: { persistSession: false },
    })

    // Create a project as user1
    const { data: project, error: projectError } = await user1Client
      .from('projects')
      .insert({
        property_name: 'RLS Test Property - User 1',
        units: 100,
        property_type: 'Garden-Style',
        address: '123 Test St',
        city: 'Test City',
        state: 'TX',
        zip_code: '12345',
      })
      .select()
      .single()

    if (projectError) {
      throw new Error(`Failed to create test project: ${projectError.message}`)
    }

    user1ProjectId = project.id
  })

  afterAll(async () => {
    if (!adminClient || !user1Id || !user2Id) {
      return // Tests were skipped
    }

    // Cleanup: Delete test users (cascades to projects)
    try {
      await adminClient.auth.admin.deleteUser(user1Id)
      await adminClient.auth.admin.deleteUser(user2Id)
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  describe('Projects Table RLS', () => {
    it('should allow user to read their own projects', async () => {
      const { data, error } = await user1Client
        .from('projects')
        .select('*')
        .eq('id', user1ProjectId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.id).toBe(user1ProjectId)
    })

    it('should prevent user from reading other user projects', async () => {
      const { data, error } = await user2Client
        .from('projects')
        .select('*')
        .eq('id', user1ProjectId)
        .single()

      // Should either return null data or error
      expect(data).toBeNull()
    })

    it('should prevent user from updating other user projects', async () => {
      const { data, error } = await user2Client
        .from('projects')
        .update({ property_name: 'Hacked by User 2!' })
        .eq('id', user1ProjectId)

      expect(error).toBeTruthy()
      expect(data).toBeNull()
    })

    it('should prevent user from deleting other user projects', async () => {
      const { error } = await user2Client
        .from('projects')
        .delete()
        .eq('id', user1ProjectId)

      expect(error).toBeTruthy()
    })
  })

  describe('Storage RLS - Project Files Bucket', () => {
    it('should allow user to upload file to their own project', async () => {
      const testFile = new Blob(['RLS Test File Content'], { type: 'text/plain' })
      const filePath = `${user1Id}/${user1ProjectId}/test-rls.txt`

      const { data, error } = await user1Client.storage
        .from('project-files')
        .upload(filePath, testFile, {
          upsert: true,
        })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('should prevent user from accessing files from other user projects', async () => {
      const filePath = `${user1Id}/${user1ProjectId}/test-rls.txt`

      const { data, error } = await user2Client.storage
        .from('project-files')
        .download(filePath)

      // Should fail - user2 should not access user1's files
      expect(error).toBeTruthy()
      expect(data).toBeNull()
    })

    it('should prevent user from deleting files from other user projects', async () => {
      const filePath = `${user1Id}/${user1ProjectId}/test-rls.txt`

      const { data, error } = await user2Client.storage
        .from('project-files')
        .remove([filePath])

      expect(error).toBeTruthy()
    })

    it('should prevent directory traversal attacks in storage paths', async () => {
      // Attempt to access parent directory
      const maliciousPath = `${user2Id}/${user1ProjectId}/../${user1ProjectId}/test-rls.txt`

      const { data, error } = await user2Client.storage
        .from('project-files')
        .download(maliciousPath)

      expect(error).toBeTruthy()
      expect(data).toBeNull()
    })
  })

  describe('Analysis Jobs RLS', () => {
    let user1JobId: string

    beforeAll(async () => {
      // Create an analysis job as user1
      const { data: job, error } = await user1Client
        .from('analysis_jobs')
        .insert({
          project_id: user1ProjectId,
          job_type: 'complete_analysis',
          status: 'pending',
          input_data: {},
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create test job: ${error.message}`)
      }

      user1JobId = job.id
    })

    it('should allow user to read their own jobs', async () => {
      const { data, error } = await user1Client
        .from('analysis_jobs')
        .select('*')
        .eq('id', user1JobId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data.id).toBe(user1JobId)
    })

    it('should prevent user from reading other user jobs', async () => {
      const { data, error } = await user2Client
        .from('analysis_jobs')
        .select('*')
        .eq('id', user1JobId)
        .single()

      expect(data).toBeNull()
    })

    it('should prevent user from updating other user jobs', async () => {
      const { data, error } = await user2Client
        .from('analysis_jobs')
        .update({ status: 'cancelled' })
        .eq('id', user1JobId)

      expect(error).toBeTruthy()
      expect(data).toBeNull()
    })
  })

  describe('Project Files Table RLS', () => {
    let user1FileId: string

    beforeAll(async () => {
      // Create a file record as user1
      const { data: file, error } = await user1Client
        .from('project_files')
        .insert({
          project_id: user1ProjectId,
          file_name: 'rls-test-invoice.pdf',
          file_type: 'invoice',
          file_size: 12345,
          storage_path: `${user1Id}/${user1ProjectId}/rls-test-invoice.pdf`,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create test file record: ${error.message}`)
      }

      user1FileId = file.id
    })

    it('should allow user to read their own file records', async () => {
      const { data, error } = await user1Client
        .from('project_files')
        .select('*')
        .eq('id', user1FileId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('should prevent user from reading other user file records', async () => {
      const { data, error } = await user2Client
        .from('project_files')
        .select('*')
        .eq('id', user1FileId)
        .single()

      expect(data).toBeNull()
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle unauthenticated requests', async () => {
      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      })

      const { data, error } = await anonClient
        .from('projects')
        .select('*')
        .eq('id', user1ProjectId)
        .single()

      // Should fail - no authentication
      expect(data).toBeNull()
    })

    it('should prevent SQL injection in RLS policies', async () => {
      // Attempt SQL injection via filter
      const { data, error } = await user2Client
        .from('projects')
        .select('*')
        .eq('id', `${user1ProjectId}' OR '1'='1`)

      // Should fail - no data returned
      expect(data).toBeNull()
    })

    it('should enforce RLS even with multiple filter conditions', async () => {
      // Try to bypass RLS with complex filter
      const { data, error } = await user2Client
        .from('projects')
        .select('*')
        .eq('id', user1ProjectId)
        .eq('property_name', 'RLS Test Property - User 1')

      expect(data).toBeNull()
    })
  })
})
