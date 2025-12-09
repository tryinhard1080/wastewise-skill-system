/**
 * Project Files Repository
 *
 * Handles database operations for project_files table.
 * Tracks uploaded files and their processing status.
 *
 * Features:
 * - File metadata storage
 * - Processing status tracking
 * - Storage path management
 * - Type-safe file operations
 */

import { logger } from '@/lib/observability/logger'
import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type ProjectFileRow = Database['public']['Tables']['project_files']['Row']
type ProjectFileInsert = Database['public']['Tables']['project_files']['Insert']
type ProjectFileUpdate = Database['public']['Tables']['project_files']['Update']

export type FileType = 'invoice' | 'contract' | 'csv' | 'other'
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ProjectFileRecord {
  id?: string
  project_id: string
  file_name: string
  file_type: FileType
  file_size?: number
  mime_type?: string
  storage_path: string
  processing_status?: ProcessingStatus
  processing_error?: string
}

export class ProjectFilesRepository {
  private supabase: SupabaseClient<Database>

  constructor(supabase?: SupabaseClient<Database>) {
    this.supabase = supabase as SupabaseClient<Database>
  }

  /**
   * Create a new file record
   */
  async create(
    file: ProjectFileRecord
  ): Promise<{ data: ProjectFileRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('project_files')
        .insert(this.toInsert(file))
        .select()
        .single()

      if (error) {
        logger.error('Failed to create project file', new Error(error.message), {
          project_id: file.project_id,
          file_name: file.file_name,
        })
        return { data: null, error: error.message }
      }

      logger.info('Project file created', {
        id: data.id,
        project_id: file.project_id,
        file_name: file.file_name,
        file_type: file.file_type,
      })

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project file creation exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Get a file by ID
   */
  async getById(id: string): Promise<{ data: ProjectFileRow | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('project_files')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        logger.error('Failed to fetch project file', new Error(error.message), { id })
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project file fetch exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Get all files for a project
   */
  async getByProjectId(projectId: string): Promise<{ data: ProjectFileRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false })

      if (error) {
        logger.error('Failed to fetch project files', new Error(error.message), {
          project_id: projectId,
        })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project files fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Get files by type
   */
  async getByType(
    projectId: string,
    fileType: FileType
  ): Promise<{ data: ProjectFileRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .eq('file_type', fileType)
        .order('uploaded_at', { ascending: false })

      if (error) {
        logger.error('Failed to fetch files by type', new Error(error.message), {
          project_id: projectId,
          file_type: fileType,
        })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Files by type fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Get files by processing status
   */
  async getByProcessingStatus(
    projectId: string,
    status: ProcessingStatus
  ): Promise<{ data: ProjectFileRow[]; error: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .eq('processing_status', status)
        .order('uploaded_at', { ascending: false })

      if (error) {
        logger.error('Failed to fetch files by processing status', new Error(error.message), {
          project_id: projectId,
          status,
        })
        return { data: [], error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Files by status fetch exception', error as Error)
      return { data: [], error: message }
    }
  }

  /**
   * Update file processing status
   */
  async updateProcessingStatus(
    id: string,
    status: ProcessingStatus,
    errorMessage?: string
  ): Promise<{ data: ProjectFileRow | null; error: string | null }> {
    try {
      const updateData: ProjectFileUpdate = {
        processing_status: status,
      }

      if (errorMessage !== undefined) {
        updateData.processing_error = errorMessage
      }

      const { data, error } = await this.supabase
        .from('project_files')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update file processing status', new Error(error.message), {
          id,
          status,
        })
        return { data: null, error: error.message }
      }

      logger.debug('File processing status updated', { id, status })
      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('File status update exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Update file metadata
   */
  async update(
    id: string,
    updates: Partial<ProjectFileRecord>
  ): Promise<{ data: ProjectFileRow | null; error: string | null }> {
    try {
      const updateData: ProjectFileUpdate = {}

      if (updates.file_name !== undefined) updateData.file_name = updates.file_name
      if (updates.file_type !== undefined) updateData.file_type = updates.file_type
      if (updates.file_size !== undefined) updateData.file_size = updates.file_size
      if (updates.mime_type !== undefined) updateData.mime_type = updates.mime_type
      if (updates.storage_path !== undefined) updateData.storage_path = updates.storage_path
      if (updates.processing_status !== undefined)
        updateData.processing_status = updates.processing_status
      if (updates.processing_error !== undefined) updateData.processing_error = updates.processing_error

      const { data, error } = await this.supabase
        .from('project_files')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update project file', new Error(error.message), { id })
        return { data: null, error: error.message }
      }

      logger.debug('Project file updated', { id })
      return { data, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project file update exception', error as Error)
      return { data: null, error: message }
    }
  }

  /**
   * Delete a file record
   */
  async delete(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.from('project_files').delete().eq('id', id)

      if (error) {
        logger.error('Failed to delete project file', new Error(error.message), { id })
        return { success: false, error: error.message }
      }

      logger.info('Project file deleted', { id })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project file delete exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Delete all files for a project
   */
  async deleteByProjectId(projectId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.supabase.from('project_files').delete().eq('project_id', projectId)

      if (error) {
        logger.error('Failed to delete project files', new Error(error.message), {
          project_id: projectId,
        })
        return { success: false, error: error.message }
      }

      logger.info('Project files deleted', { project_id: projectId })
      return { success: true, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Project files delete exception', error as Error)
      return { success: false, error: message }
    }
  }

  /**
   * Get file count by type for a project
   */
  async getCountByType(
    projectId: string,
    fileType: FileType
  ): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await this.supabase
        .from('project_files')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('file_type', fileType)

      if (error) {
        logger.error('Failed to count files by type', new Error(error.message), {
          project_id: projectId,
          file_type: fileType,
        })
        return { count: 0, error: error.message }
      }

      return { count: count || 0, error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('File count exception', error as Error)
      return { count: 0, error: message }
    }
  }

  /**
   * Convert ProjectFileRecord to database insert format
   */
  private toInsert(file: ProjectFileRecord): ProjectFileInsert {
    return {
      project_id: file.project_id,
      file_name: file.file_name,
      file_type: file.file_type,
      file_size: file.file_size,
      mime_type: file.mime_type,
      storage_path: file.storage_path,
      processing_status: file.processing_status,
      processing_error: file.processing_error,
    }
  }
}
