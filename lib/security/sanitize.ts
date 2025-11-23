/**
 * Input Sanitization Utilities
 *
 * Prevents XSS (Cross-Site Scripting) attacks by sanitizing user input
 * before rendering in HTML or storing in database.
 *
 * Defense-in-Depth Strategy:
 * 1. Sanitize on input (this file)
 * 2. Validate with Zod schemas
 * 3. Escape on output (React handles this automatically for most cases)
 * 4. Content Security Policy headers (middleware.ts)
 *
 * Usage:
 * ```typescript
 * import { sanitizeHTML, sanitizeInput, sanitizeFilename } from '@/lib/security/sanitize'
 *
 * // For user-generated content that may contain safe HTML (e.g., descriptions)
 * const safeHTML = sanitizeHTML(userInput)
 *
 * // For plain text input (removes all HTML)
 * const safePlainText = sanitizeInput(userInput)
 *
 * // For filenames
 * const safeFilename = sanitizeFilename(filename)
 * ```
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content
 *
 * Allows only safe HTML tags and attributes.
 * Use this for user content that may contain formatting (e.g., rich text editors).
 *
 * Allowed tags: b, i, em, strong, a, p, br, ul, ol, li
 * Allowed attributes: href (on <a> tags only, with URL validation)
 *
 * @param dirty - Potentially malicious HTML
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href"],
    ALLOWED_URI_REGEXP: /^https?:\/\//i, // Only allow http(s) URLs
  });
}

/**
 * Sanitize plain text input
 *
 * Removes ALL HTML tags and special characters.
 * Use this for inputs that should never contain HTML (e.g., property names, addresses).
 *
 * @param input - User input
 * @returns Sanitized plain text
 */
export function sanitizeInput(input: string): string {
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize filename
 *
 * Removes dangerous characters that could cause:
 * - Directory traversal attacks (../)
 * - Shell injection (;, |, &, $, `, etc.)
 * - Path manipulation
 *
 * @param filename - Original filename
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  // First, remove all dangerous characters from the entire filename
  let sanitized = filename
    // Remove directory traversal
    .replace(/\.\./g, "")
    // Remove path separators
    .replace(/[/\\]/g, "")
    // Remove shell metacharacters
    .replace(/[;&|`$()<>'"]/g, "")
    // Remove null bytes
    .replace(/\0/g, "");

  // Split into name and extension to preserve extension
  const lastDot = sanitized.lastIndexOf(".");
  const name = lastDot === -1 ? sanitized : sanitized.substring(0, lastDot);
  const ext = lastDot === -1 ? "" : sanitized.substring(lastDot + 1);

  // Sanitize name part - keep letters, numbers, dots, hyphens, underscores
  let sanitizedName = name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    // Collapse multiple underscores
    .replace(/_{2,}/g, "_")
    // Trim underscores and dots from start/end
    .replace(/^[_.-]+|[_.-]+$/g, "");

  // Sanitize extension
  const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  // Combine name and extension
  const fullName = sanitizedExt
    ? `${sanitizedName}.${sanitizedExt}`
    : sanitizedName;

  // Limit to 255 characters (filesystem limit)
  if (fullName.length > 255) {
    const maxNameLength = 255 - (sanitizedExt.length + 1);
    sanitizedName = sanitizedName.substring(0, maxNameLength);
    return sanitizedExt ? `${sanitizedName}.${sanitizedExt}` : sanitizedName;
  }

  return fullName;
}

/**
 * Sanitize property name
 *
 * Property names should be plain text without special characters.
 * Allows letters, numbers, spaces, and basic punctuation.
 *
 * @param name - Property name
 * @returns Sanitized name
 */
export function sanitizePropertyName(name: string): string {
  return (
    name
      // Remove HTML tags and their content
      .replace(/<[^>]*>.*?<\/[^>]*>/g, "")
      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove parentheses and brackets (often used in attacks)
      .replace(/[(){}[\]]/g, "")
      // Keep only safe characters (letters, numbers, spaces, and basic punctuation)
      .replace(/[^a-zA-Z0-9 .,'-]/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      // Trim
      .trim()
      // Limit length
      .substring(0, 255)
  );
}

/**
 * Sanitize vendor name
 *
 * Vendor names should be plain text.
 *
 * @param name - Vendor name
 * @returns Sanitized name
 */
export function sanitizeVendorName(name: string): string {
  return sanitizePropertyName(name); // Same rules as property names
}

/**
 * Sanitize address
 *
 * Addresses may contain numbers, letters, and common punctuation.
 *
 * @param address - Street address
 * @returns Sanitized address
 */
export function sanitizeAddress(address: string): string {
  return (
    address
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Keep only safe characters
      .replace(/[^a-zA-Z0-9 .,#-]/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      // Trim
      .trim()
      // Limit length
      .substring(0, 500)
  );
}

/**
 * Sanitize email address
 *
 * Removes dangerous characters while preserving valid email format.
 *
 * Note: This does NOT validate email format (use Zod for that).
 * This only removes potentially dangerous characters.
 *
 * @param email - Email address
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return (
    email
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Keep only valid email characters
      .replace(/[^a-zA-Z0-9@._+-]/g, "")
      // Lowercase
      .toLowerCase()
      // Trim
      .trim()
      // Limit length
      .substring(0, 320) // Max email length per RFC 5321
  );
}

/**
 * Sanitize URL
 *
 * Ensures URL is safe and uses allowed protocol.
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.toString();
  } catch {
    // Invalid URL
    return "";
  }
}

/**
 * Sanitize phone number
 *
 * Removes all characters except digits, spaces, hyphens, and parentheses.
 *
 * @param phone - Phone number
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  return (
    phone
      // Keep only valid phone characters
      .replace(/[^0-9 ()+-]/g, "")
      // Trim
      .trim()
      // Limit length
      .substring(0, 50)
  );
}

/**
 * Batch sanitize an object
 *
 * Recursively sanitizes all string values in an object.
 * Useful for sanitizing entire request bodies.
 *
 * @param obj - Object to sanitize
 * @param sanitizer - Sanitization function (default: sanitizeInput)
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizer: (value: string) => string = sanitizeInput,
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizer(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string" ? sanitizer(item) : item,
      );
    } else if (value !== null && typeof value === "object") {
      result[key] = sanitizeObject(value as Record<string, unknown>, sanitizer);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * XSS test payloads for testing
 *
 * These should ALL be neutralized by sanitizeHTML and sanitizeInput.
 */
export const XSS_TEST_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
  "<iframe src=\"javascript:alert('XSS')\">",
  '<body onload=alert("XSS")>',
  '<input onfocus=alert("XSS") autofocus>',
  '<select onfocus=alert("XSS") autofocus>',
  '<textarea onfocus=alert("XSS") autofocus>',
  '<button onclick=alert("XSS")>Click</button>',
  "<a href=\"javascript:alert('XSS')\">Link</a>",
  "<div style=\"background-image:url(javascript:alert('XSS'))\">",
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<img src="x" onerror="alert(1)">',
  "<svg/onload=alert(1)>",
] as const;
