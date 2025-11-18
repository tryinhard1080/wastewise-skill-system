/**
 * API Validation Utilities
 *
 * Common validation functions for API endpoints
 */

/**
 * Validates if a string is a valid UUID v4
 *
 * @param value - String to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Validates pagination parameters
 *
 * @param limit - Number of items per page
 * @param offset - Number of items to skip
 * @returns Sanitized limit and offset
 */
export function validatePagination(
  limit?: string | number,
  offset?: string | number
): { limit: number; offset: number } {
  const parsedLimit =
    typeof limit === 'string' ? parseInt(limit, 10) : (limit ?? 20)
  const parsedOffset =
    typeof offset === 'string' ? parseInt(offset, 10) : (offset ?? 0)

  return {
    limit: Math.min(Math.max(parsedLimit, 1), 100), // 1-100 range
    offset: Math.max(parsedOffset, 0), // Min 0
  }
}
