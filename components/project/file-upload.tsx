'use client'

/**
 * File Upload Component
 *
 * Drag-and-drop file uploader for invoices, contracts, and haul logs
 * Uses react-dropzone for drag-and-drop functionality
 */

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FileUploadProps {
  projectId: string
  fileType: 'invoice' | 'contract' | 'haul_log' | 'other'
  onUploadComplete?: () => void
  maxFiles?: number
  acceptedTypes?: string[]
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export function FileUpload({
  projectId,
  fileType,
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/png',
    'image/jpeg',
  ],
}: FileUploadProps) {
  const supabase = createClient()
  const [uploadingFiles, setUploadingFiles] = useState<
    Map<string, UploadingFile>
  >(new Map())

  // Get storage bucket name from environment variable (with fallback)
  const storageBucket =
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'project-files'

  const uploadFile = useCallback(
    async (file: File) => {
      const fileId = `${file.name}-${Date.now()}`

      // Initialize upload status
      setUploadingFiles((prev) => {
        const next = new Map(prev)
        next.set(fileId, {
          file,
          progress: 0,
          status: 'uploading',
        })
        return next
      })

      try {
        // Upload to Supabase Storage
        const storagePath = `projects/${projectId}/${fileType}/${file.name}`

        const { error: uploadError } = await supabase.storage
          .from(storageBucket)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        // Update progress
        setUploadingFiles((prev) => {
          const next = new Map(prev)
          const current = next.get(fileId)
          if (current) {
            next.set(fileId, { ...current, progress: 50 })
          }
          return next
        })

        // Create database record
        const { error: dbError } = await supabase.from('project_files').insert({
          project_id: projectId,
          file_name: file.name,
          file_type: fileType,
          storage_path: storagePath,
          mime_type: file.type,
          file_size: file.size,
          processing_status: 'pending',
        })

        if (dbError) {
          throw dbError
        }

        // Mark as complete
        setUploadingFiles((prev) => {
          const next = new Map(prev)
          const current = next.get(fileId)
          if (current) {
            next.set(fileId, { ...current, progress: 100, status: 'success' })
          }
          return next
        })

        // Auto-remove after 3 seconds
        setTimeout(() => {
          setUploadingFiles((prev) => {
            const next = new Map(prev)
            next.delete(fileId)
            return next
          })
        }, 3000)

        onUploadComplete?.()
      } catch (error) {
        console.error('Upload error:', error)
        setUploadingFiles((prev) => {
          const next = new Map(prev)
          const current = next.get(fileId)
          if (current) {
            next.set(fileId, {
              ...current,
              status: 'error',
              error:
                error instanceof Error ? error.message : 'Failed to upload file',
            })
          }
          return next
        })
      }
    },
    [fileType, onUploadComplete, projectId, storageBucket, supabase]
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check max files limit
      if (uploadingFiles.size + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
        return
      }

      // Upload all files
      for (const file of acceptedFiles) {
        await uploadFile(file)
      }
    },
    [maxFiles, uploadFile, uploadingFiles.size]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles,
  })

  const removeFile = (fileId: string) => {
    setUploadingFiles((prev) => {
      const next = new Map(prev)
      next.delete(fileId)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed cursor-pointer transition-colors',
          isDragActive
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <div className="p-8 text-center">
          <input {...getInputProps()} />
          <Upload
            className={cn(
              'mx-auto h-12 w-12 mb-4',
              isDragActive ? 'text-green-600' : 'text-gray-400'
            )}
          />
          {isDragActive ? (
            <p className="text-lg font-medium text-green-600">
              Drop files here...
            </p>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                PDF, Excel, CSV, PNG, or JPEG (max {maxFiles} files)
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingFiles.entries()).map(([fileId, upload]) => (
            <Card key={fileId} className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {upload.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  )}
                  {upload.status === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {upload.file.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeFile(fileId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {(upload.file.size / 1024).toFixed(1)} KB
                  </p>

                  {/* Progress Bar */}
                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="h-1" />
                  )}

                  {/* Error Message */}
                  {upload.status === 'error' && upload.error && (
                    <p className="text-xs text-red-600">{upload.error}</p>
                  )}

                  {/* Success Message */}
                  {upload.status === 'success' && (
                    <p className="text-xs text-green-600">Upload complete</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
