/**
 * File Upload Validation Utilities
 *
 * Comprehensive validation for file uploads to prevent:
 * - Malicious file uploads
 * - MIME type spoofing
 * - Directory traversal attacks
 * - Resource exhaustion (file size bombs)
 *
 * Usage:
 * ```typescript
 * import { validateFile, validateFileContent } from '@/lib/validation/file-validation'
 *
 * // Client-side validation
 * const result = validateFile(file)
 * if (!result.valid) {
 *   throw new Error(result.error)
 * }
 *
 * // Server-side validation (check magic bytes)
 * const buffer = await file.arrayBuffer()
 * const isValid = await validateFileContent(buffer, file.type)
 * if (!isValid) {
 *   throw new Error('File content does not match MIME type')
 * }
 * ```
 */

/**
 * Allowed MIME types for file uploads
 *
 * Only these file types are accepted:
 * - PDF documents (invoices, contracts)
 * - Images (PNG, JPEG - scanned invoices)
 * - Spreadsheets (Excel, CSV - haul logs)
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
] as const

/**
 * Maximum file size: 10MB
 *
 * Rationale:
 * - Most invoices are <1MB
 * - Scanned images typically <5MB
 * - Excel files with 1000s of rows typically <5MB
 * - 10MB provides headroom while preventing abuse
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Maximum files per project
 *
 * Prevents resource exhaustion and keeps UI manageable
 */
export const MAX_FILES_PER_PROJECT = 50

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedName?: string
}

/**
 * Validate a file for upload
 *
 * Checks:
 * - File size within limits
 * - MIME type is allowed
 * - File extension matches MIME type
 * - Filename is safe (no directory traversal)
 *
 * @param file - The file to validate
 * @returns Validation result with sanitized filename if valid
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / 1024 / 1024
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
    }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: PDF, PNG, JPEG, Excel (.xlsx, .xls), CSV`,
    }
  }

  // Check file extension matches MIME type
  const ext = file.name.split('.').pop()?.toLowerCase()
  const expectedExts: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/png': ['png'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/jpg': ['jpg', 'jpeg'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      'xlsx',
    ],
    'application/vnd.ms-excel': ['xls'],
    'text/csv': ['csv'],
  }

  if (ext && expectedExts[file.type] && !expectedExts[file.type].includes(ext)) {
    return {
      valid: false,
      error: `File extension .${ext} does not match MIME type ${file.type}. Expected: ${expectedExts[file.type].join(', ')}`,
    }
  }

  // Sanitize filename
  // - Remove special characters (prevent directory traversal, shell injection)
  // - Replace spaces and symbols with underscores
  // - Limit length to 255 characters
  // - Preserve extension
  const sanitizedName = sanitizeFilename(file.name)

  return {
    valid: true,
    sanitizedName,
  }
}

/**
 * Sanitize filename to prevent security issues
 *
 * - Removes directory traversal characters (../)
 * - Removes shell metacharacters
 * - Replaces special characters with underscores
 * - Limits length to 255 characters
 * - Preserves file extension
 */
export function sanitizeFilename(filename: string): string {
  // First, remove all dangerous characters from the entire filename
  let sanitized = filename
    // Remove directory traversal
    .replace(/\.\./g, '')
    // Remove path separators
    .replace(/[/\\]/g, '')
    // Remove shell metacharacters
    .replace(/[;&|`$()<>'"]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')

  // Split name and extension to preserve extension
  const lastDot = sanitized.lastIndexOf('.')
  const name = lastDot === -1 ? sanitized : sanitized.substring(0, lastDot)
  const ext = lastDot === -1 ? '' : sanitized.substring(lastDot + 1)

  // Sanitize name part - keep letters, numbers, dots, hyphens, underscores
  let sanitizedName = name
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove special characters
    .replace(/_{2,}/g, '_') // Collapse multiple underscores
    .replace(/^[_.-]+|[_.-]+$/g, '') // Trim leading/trailing underscores/dots

  // Sanitize extension
  const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()

  // Combine and limit length
  const fullName = sanitizedExt ? `${sanitizedName}.${sanitizedExt}` : sanitizedName

  // Limit to 255 characters (filesystem limit)
  if (fullName.length > 255) {
    const maxNameLength = 255 - (sanitizedExt.length + 1)
    sanitizedName = sanitizedName.substring(0, maxNameLength)
    return sanitizedExt ? `${sanitizedName}.${sanitizedExt}` : sanitizedName
  }

  return fullName
}

/**
 * Validate file count for a project
 *
 * @param currentCount - Current number of files in project
 * @param newFiles - Number of files being added
 * @returns Validation result
 */
export function validateFileCount(
  currentCount: number,
  newFiles: number
): FileValidationResult {
  if (currentCount + newFiles > MAX_FILES_PER_PROJECT) {
    return {
      valid: false,
      error: `Cannot upload ${newFiles} file(s). Maximum ${MAX_FILES_PER_PROJECT} files per project. You currently have ${currentCount} file(s).`,
    }
  }

  return { valid: true }
}

/**
 * Validate file content by checking magic bytes (file signature)
 *
 * This provides defense-in-depth against MIME type spoofing.
 * An attacker could rename malware.exe to malware.pdf, but the magic bytes
 * will reveal the true file type.
 *
 * @param buffer - File content as ArrayBuffer
 * @param mimeType - Claimed MIME type
 * @returns True if magic bytes match MIME type
 */
export async function validateFileContent(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<boolean> {
  const bytes = new Uint8Array(buffer.slice(0, 8)) // Read first 8 bytes

  // PDF magic bytes: %PDF
  if (mimeType === 'application/pdf') {
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    )
  }

  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    )
  }

  // JPEG magic bytes: FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }

  // ZIP-based formats (Excel .xlsx): 50 4B (PK)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return bytes[0] === 0x50 && bytes[1] === 0x4b // PK (ZIP)
  }

  // Legacy Excel (.xls): D0 CF 11 E0 A1 B1 1A E1 (OLE2)
  if (mimeType === 'application/vnd.ms-excel') {
    return (
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0
    )
  }

  // CSV (text file, no magic bytes - validate it's valid UTF-8 text)
  if (mimeType === 'text/csv') {
    try {
      // Check if first 1024 bytes are valid UTF-8 text
      const textDecoder = new TextDecoder('utf-8', { fatal: true })
      textDecoder.decode(buffer.slice(0, Math.min(1024, buffer.byteLength)))

      // Additional validation: should not contain null bytes (binary files)
      const checkBytes = new Uint8Array(buffer.slice(0, Math.min(1024, buffer.byteLength)))
      for (let i = 0; i < checkBytes.length; i++) {
        if (checkBytes[i] === 0x00) {
          return false // Null byte indicates binary file
        }
      }

      return true
    } catch {
      return false
    }
  }

  // Unknown MIME type
  return false
}

/**
 * Comprehensive file validation (combines all checks)
 *
 * Use this in API routes for complete validation:
 * 1. Client-side validation (file object)
 * 2. Server-side validation (magic bytes)
 *
 * @param file - File object
 * @param buffer - File content as ArrayBuffer
 * @returns Validation result
 */
export async function validateFileComprehensive(
  file: File,
  buffer: ArrayBuffer
): Promise<FileValidationResult> {
  // Step 1: Client-side validation
  const clientValidation = validateFile(file)
  if (!clientValidation.valid) {
    return clientValidation
  }

  // Step 2: Server-side magic bytes validation
  const isValidContent = await validateFileContent(buffer, file.type)
  if (!isValidContent) {
    return {
      valid: false,
      error: `File content does not match declared type "${file.type}". The file may be corrupted or misnamed.`,
    }
  }

  return {
    valid: true,
    sanitizedName: clientValidation.sanitizedName,
  }
}
