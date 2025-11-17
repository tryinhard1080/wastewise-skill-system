/**
 * Report Storage Utility
 *
 * Handles uploading generated reports (Excel, HTML) to Supabase Storage
 * and generating public download URLs.
 *
 * Features:
 * - Upload Excel workbooks (Buffer)
 * - Upload HTML dashboards (string)
 * - Generate signed URLs (1 year expiry)
 * - Automatic path organization (reports/{projectId}/{filename})
 * - Error handling and logging
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'

export interface UploadReportInput {
  /** Report content (Buffer for Excel, string for HTML) */
  content: Buffer | string

  /** Filename with extension */
  filename: string

  /** Project ID for path organization */
  projectId: string

  /** MIME type */
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' | 'text/html'
}

export interface UploadReportOutput {
  /** Storage path where file was saved */
  storagePath: string

  /** Public download URL (signed, 1 year expiry) */
  downloadUrl: string

  /** File size in bytes */
  size: number

  /** Filename */
  filename: string
}

/**
 * Upload report to Supabase Storage
 */
export async function uploadReport(input: UploadReportInput): Promise<UploadReportOutput> {
  const { content, filename, projectId, contentType } = input

  logger.info('Uploading report to storage', {
    filename,
    projectId,
    contentType,
    size: typeof content === 'string' ? content.length : content.byteLength,
  })

  try {
    const supabase = await createClient()

    // Generate storage path: reports/{projectId}/{filename}
    const storagePath = `reports/${projectId}/${filename}`

    // Convert content to Buffer if it's a string
    const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true, // Overwrite if exists
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    logger.debug('Report uploaded successfully', {
      storagePath: uploadData.path,
      size: buffer.byteLength,
    })

    // Generate signed URL (1 year expiry)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('project-files')
      .createSignedUrl(storagePath, 31536000) // 365 days in seconds

    if (urlError) {
      throw new Error(`Failed to generate download URL: ${urlError.message}`)
    }

    if (!urlData || !urlData.signedUrl) {
      throw new Error('Download URL is empty')
    }

    logger.info('Report upload complete', {
      filename,
      projectId,
      downloadUrl: urlData.signedUrl,
    })

    return {
      storagePath: uploadData.path,
      downloadUrl: urlData.signedUrl,
      size: buffer.byteLength,
      filename,
    }
  } catch (error) {
    logger.error('Report upload failed', error as Error, {
      filename,
      projectId,
    })
    throw error
  }
}

/**
 * Upload both Excel and HTML reports
 */
export async function uploadReports(
  excelBuffer: Buffer,
  excelFilename: string,
  htmlContent: string,
  htmlFilename: string,
  projectId: string
): Promise<{
  excel: UploadReportOutput
  html: UploadReportOutput
}> {
  logger.info('Uploading both reports', {
    projectId,
    excelFilename,
    htmlFilename,
  })

  try {
    // Upload Excel workbook
    const excel = await uploadReport({
      content: excelBuffer,
      filename: excelFilename,
      projectId,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    // Upload HTML dashboard
    const html = await uploadReport({
      content: htmlContent,
      filename: htmlFilename,
      projectId,
      contentType: 'text/html',
    })

    logger.info('Both reports uploaded successfully', {
      projectId,
      excelUrl: excel.downloadUrl,
      htmlUrl: html.downloadUrl,
    })

    return { excel, html }
  } catch (error) {
    logger.error('Batch report upload failed', error as Error, { projectId })
    throw error
  }
}

/**
 * Delete old reports for a project
 */
export async function deleteOldReports(projectId: string): Promise<void> {
  logger.info('Deleting old reports', { projectId })

  try {
    const supabase = await createClient()

    // List all files in project's reports folder
    const { data: files, error: listError } = await supabase.storage
      .from('project-files')
      .list(`reports/${projectId}`, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (listError) {
      throw new Error(`Failed to list reports: ${listError.message}`)
    }

    if (!files || files.length === 0) {
      logger.debug('No reports to delete', { projectId })
      return
    }

    // Keep only the 5 most recent reports, delete the rest
    const filesToDelete = files.slice(5).map((file) => `reports/${projectId}/${file.name}`)

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('project-files')
        .remove(filesToDelete)

      if (deleteError) {
        throw new Error(`Failed to delete old reports: ${deleteError.message}`)
      }

      logger.info('Old reports deleted', {
        projectId,
        deletedCount: filesToDelete.length,
      })
    } else {
      logger.debug('No old reports to delete', { projectId })
    }
  } catch (error) {
    logger.error('Failed to delete old reports', error as Error, { projectId })
    // Don't throw - this is a cleanup operation, not critical
  }
}
