'use client'

/**
 * File Upload Section Component
 *
 * Shows file upload dropzone and list of existing files
 */

import { useState } from 'react'
import { FileUpload } from './file-upload'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Download, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface ProjectFile {
  id: string
  file_name: string
  file_type: string
  file_size: number | null
  uploaded_at: string | null
  processing_status: string | null
}

interface FileUploadSectionProps {
  projectId: string
  existingFiles: ProjectFile[]
}

export function FileUploadSection({
  projectId,
  existingFiles,
}: FileUploadSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    // Trigger a re-fetch by incrementing key
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload invoices, contracts, or haul logs for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            key={refreshKey}
            projectId={projectId}
            fileType="invoice"
            onUploadComplete={handleUploadComplete}
          />
        </CardContent>
      </Card>

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              {existingFiles.length} file{existingFiles.length !== 1 ? 's' : ''}{' '}
              uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {file.file_size
                            ? `${(file.file_size / 1024).toFixed(1)} KB`
                            : 'Unknown size'}
                        </span>
                        <span>•</span>
                        <span>
                          {file.uploaded_at
                            ? format(
                                new Date(file.uploaded_at),
                                'MMM d, yyyy'
                              )
                            : 'Unknown date'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        file.processing_status === 'completed'
                          ? 'default'
                          : file.processing_status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="capitalize"
                    >
                      {file.processing_status || 'pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
