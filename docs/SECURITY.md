# WasteWise Security Documentation

**Last Updated**: 2025-11-21 (Added sandboxing layer)
**Version**: 1.1.0
**Status**: Production Ready (Phase 7)

---

## Table of Contents

1. [Overview](#overview)
2. [Security Architecture](#security-architecture)
3. [Authentication & Authorization](#authentication--authorization)
4. [Input Validation & Sanitization](#input-validation--sanitization)
5. [Rate Limiting](#rate-limiting)
6. [File Upload Security](#file-upload-security)
7. [Content Security Policy](#content-security-policy)
8. [Sandboxing (AI Agent Security)](#sandboxing-ai-agent-security) - **NEW**
9. [Data Protection](#data-protection)
10. [Security Testing](#security-testing)
11. [Incident Response](#incident-response)
12. [Security Checklist](#security-checklist)

---

## Overview

WasteWise implements defense-in-depth security measures to protect against common web vulnerabilities including:

- ✅ **Cross-Site Scripting (XSS)**
- ✅ **SQL Injection**
- ✅ **Cross-Site Request Forgery (CSRF)**
- ✅ **Unauthorized Data Access**
- ✅ **File Upload Attacks**
- ✅ **DDoS/Resource Exhaustion**
- ✅ **MIME Type Spoofing**
- ✅ **Directory Traversal**

### Security Audit Status

**Latest Audit**: 2025-11-18
**Critical Vulnerabilities**: 0 (4 fixed)
**Risk Score**: 4.2/10 (Medium Risk) → Target: <2.0/10
**Production Readiness**: Acceptable for Phase 7 (requires Phase 4 hardening)

---

## Security Architecture

### Defense-in-Depth Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 0: AI Agent Sandbox (Claude Code)                │
│ - Filesystem isolation (project-only write access)     │
│ - Network isolation (approved domains only)            │
│ - Command exclusions (git, supabase, docker)           │
│ - Protection against prompt injection attacks          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Network (Vercel/Cloudflare)                   │
│ - HTTPS enforcement                                     │
│ - DDoS protection                                       │
│ - WAF (Web Application Firewall)                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Application (Next.js Middleware)               │
│ - Security headers (CSP, HSTS, X-Frame-Options)        │
│ - Rate limiting (Upstash Redis)                        │
│ - Request validation                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: API Routes                                     │
│ - Authentication (Supabase Auth)                       │
│ - Input sanitization (DOMPurify)                       │
│ - Zod schema validation                                │
│ - File upload validation (magic bytes)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Database (Supabase PostgreSQL)                │
│ - Row Level Security (RLS) policies                    │
│ - Parameterized queries                                │
│ - Connection pooling                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Storage (Supabase Storage)                    │
│ - RLS policies on storage.objects                      │
│ - File type validation                                 │
│ - Size limits                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### Supabase Auth

**Implemented**:
- Email/password authentication
- Secure session management (httpOnly cookies)
- JWT-based authorization
- Automatic token refresh

**Configuration**:
```typescript
// lib/supabase/client.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
```

### Row Level Security (RLS)

**All database tables have RLS enabled**:

```sql
-- Example: projects table
CREATE POLICY "Users can read own projects"
ON projects FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
```

**Storage RLS** (fixed in security audit):
```sql
CREATE POLICY "Users can read own project files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-files' AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = (storage.foldername(name))[2]::uuid
    AND projects.user_id = auth.uid()
  )
);
```

**Testing**: See `__tests__/security/rls-policies.test.ts` for comprehensive RLS tests.

---

## Input Validation & Sanitization

### Defense-in-Depth Approach

1. **Client-side**: React form validation
2. **API layer**: Zod schema validation
3. **Sanitization**: DOMPurify for HTML, custom functions for other inputs
4. **Database**: PostgreSQL CHECK constraints

### Sanitization Functions

**Location**: `lib/security/sanitize.ts`

```typescript
import { sanitizeHTML, sanitizeInput, sanitizeFilename } from '@/lib/security/sanitize'

// For user-generated HTML content
const safeHTML = sanitizeHTML(userInput) // Allows only safe tags

// For plain text (removes ALL HTML)
const safePlainText = sanitizeInput(userInput)

// For filenames (prevents directory traversal, shell injection)
const safeFilename = sanitizeFilename(filename)
```

### XSS Prevention

**Techniques**:
- DOMPurify sanitization on all user input
- React's automatic escaping
- Content Security Policy headers
- Validation of URLs and email addresses

**Test Coverage**: See `__tests__/security/xss-prevention.test.ts` (37 tests, all passing)

---

## Rate Limiting

### Production Implementation (Upstash Redis)

**Location**: `lib/middleware/rate-limit.ts`

**Configuration**:
```typescript
export const RATE_LIMITS = {
  JOB_CREATION: { maxRequests: 5, windowMs: 60000 },      // 5 req/min
  STATUS_POLLING: { maxRequests: 60, windowMs: 60000 },   // 60 req/min
  PROJECT_OPERATIONS: { maxRequests: 20, windowMs: 60000 }, // 20 req/min
  FILE_UPLOAD: { maxRequests: 10, windowMs: 60000 },      // 10 req/min
  GENERAL: { maxRequests: 100, windowMs: 60000 },         // 100 req/min
}
```

**Usage in API Routes**:
```typescript
import { rateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export async function POST(req: NextRequest) {
  const result = await rateLimit(req, RATE_LIMITS.JOB_CREATION, userId)

  if (result && !result.success) {
    return rateLimitResponse(result)
  }

  // ... rest of handler
}
```

### Setup Requirements

**Environment Variables** (`.env.local`):
```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

**Fallback Behavior**: If Upstash is not configured, rate limiting is disabled with a warning logged.

---

## File Upload Security

### Multi-Layer Validation

**Location**: `lib/validation/file-validation.ts`

#### Layer 1: Client-Side Validation
```typescript
import { validateFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/validation/file-validation'

const result = validateFile(file)
if (!result.valid) {
  throw new Error(result.error)
}
```

#### Layer 2: Server-Side Magic Bytes Validation
```typescript
import { validateFileContent } from '@/lib/validation/file-validation'

const buffer = await file.arrayBuffer()
const isValid = await validateFileContent(buffer, file.type)

if (!isValid) {
  throw new Error('File content does not match declared MIME type')
}
```

### Allowed File Types

```typescript
export const ALLOWED_MIME_TYPES = [
  'application/pdf',           // Invoices, contracts
  'image/png',                 // Scanned documents
  'image/jpeg',                // Scanned documents
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',  // .xls (legacy)
  'text/csv',                  // Haul logs
]
```

### File Size & Count Limits

```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_FILES_PER_PROJECT = 50
```

### Filename Sanitization

**Protects against**:
- Directory traversal (`../../etc/passwd`)
- Shell injection (`file; rm -rf /`)
- Null byte attacks (`file.pdf\x00.exe`)

```typescript
import { sanitizeFilename } from '@/lib/validation/file-validation'

const safeFilename = sanitizeFilename('../../etc/passwd.pdf')
// Returns: "etcpasswd.pdf"
```

**Test Coverage**: See `__tests__/security/security-hardening.test.ts` (38 tests, all passing)

---

## Content Security Policy

### Implementation

**Location**: `middleware.ts`

```typescript
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'nonce-{random}' https://cdn.jsdelivr.net", // Chart.js
  "style-src 'self' 'nonce-{random}'",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",  // Prevent clickjacking
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",       // Block Flash, Java, etc.
  "upgrade-insecure-requests", // Force HTTPS
]
```

### Security Headers

**All responses include**:
- `Content-Security-Policy` (as above)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (production only)

---

## Sandboxing (AI Agent Security)

### Overview

WasteWise uses Claude Code's native sandboxing to protect against AI agent attacks and reduce permission prompts by 84% while maintaining security.

**Threat Model**: Even if an attacker compromises AI agent prompts (prompt injection), sandboxing prevents unauthorized:
- File system access (credentials, secrets, system files)
- Network requests (data exfiltration, malicious downloads)
- Command execution (system modifications)

### Implementation

**Configuration**: `.claude/sandbox.json`

**Filesystem Boundaries**:
```json
{
  "allowed_write_paths": [
    "./app/**",
    "./components/**",
    "./lib/**",
    "./__tests__/**",
    "./docs/**"
  ],
  "denied_paths": [
    "./.env",
    "./.env.*",
    "./.credentials.json",
    "./supabase/config.toml"
  ]
}
```

**Network Boundaries**:
```json
{
  "allowed_domains": [
    "api.anthropic.com",
    "*.supabase.co",
    "*.upstash.io",
    "cdn.jsdelivr.net",
    "api.exa.ai"
  ]
}
```

**Command Exclusions**:
- `git` - Requires flexible filesystem access
- `supabase` - Needs access to credentials
- `docker` - Requires host-level access

### Sandbox Profiles

**4 Predefined Profiles** (`.claude/profiles/`):

1. **wastewise-dev.json** (Default)
   - Full project write access
   - All approved network domains
   - For development agents (frontend-dev, backend-dev)

2. **wastewise-testing.json**
   - Test directories only
   - No production database access
   - For testing agents (tester, reviewer)

3. **wastewise-docs.json**
   - Documentation directories only
   - No network access
   - For documentation work

4. **wastewise-readonly.json**
   - Read-only access
   - Full network for research
   - For analysis agents (Explore, code-analyzer)

### Violation Monitoring

**Audit Logging**: `lib/observability/sandbox-logger.ts`

```typescript
import {
  logFilesystemViolation,
  logNetworkViolation,
  getSandboxStats,
  detectSuspiciousPatterns
} from '@/lib/observability/sandbox-logger'

// Violations are automatically logged
// Check for suspicious patterns
const patterns = detectSuspiciousPatterns()
if (patterns.suspicious) {
  console.error('Security alert:', patterns.reasons)
}
```

**Tracked Events**:
- Filesystem read/write/delete attempts outside boundaries
- Network requests to unapproved domains
- Command execution of excluded commands
- Permission escalation attempts

**Severity Levels**:
- **Critical**: Access to .env, credentials, secrets
- **High**: Permission escalation, deletion attempts
- **Medium**: Writes outside allowed paths
- **Low**: Reads or unapproved network requests

### Security Benefits

**Protection Against Prompt Injection**:
- ❌ Cannot read `.env` even if attacker controls prompts
- ❌ Cannot modify system files (`~/.bashrc`, etc.)
- ❌ Cannot exfiltrate data to unapproved domains
- ❌ Cannot execute malicious commands

**Reduced Attack Surface**:
- Limits damage from compromised dependencies
- Blocks social engineering attacks targeting AI agents
- Prevents supply chain attacks via build scripts

**Audit Trail**:
- All boundary violations logged with timestamps
- Suspicious pattern detection
- Integration with existing observability (logger.ts)

### Integration with Security Layers

Sandboxing is **Layer 0** in WasteWise defense-in-depth:

1. **Sandbox** (filesystem + network isolation) ← NEW
2. **IAM** (tool-level permissions)
3. **RLS** (database row-level security)
4. **Input Sanitization** (XSS/injection prevention)
5. **CSP** (browser-level protection)

All layers work together - sandbox blocks attacks before they reach other layers.

### Testing

**Test Suite**: `__tests__/security/sandbox-compliance.test.ts`

```bash
# Run sandbox compliance tests
pnpm test __tests__/security/sandbox-compliance.test.ts
```

**Validates**:
- ✅ Denied paths (`.env`) actually blocked
- ✅ Allowed paths work without prompts
- ✅ Unapproved domains trigger permission requests
- ✅ Violation logging functions correctly
- ✅ Suspicious pattern detection works

### Deployment Requirements

**Development**:
- [ ] Enable `/sandbox` command before agent work
- [ ] Use appropriate profile for task (dev/testing/docs/readonly)
- [ ] Monitor violation logs for misconfigurations

**Production** (Phase 4):
- [ ] Review and tighten sandbox boundaries
- [ ] Integrate violation logs with Sentry
- [ ] Quarterly audit of approved domains
- [ ] Update profiles as project structure evolves

### References

- [Sandboxing Guide](../docs/SANDBOXING.md) - Complete configuration guide
- [Sandbox Profiles](./.claude/profiles/README.md) - Profile documentation
- [Claude Code Sandboxing](https://code.claude.com/docs/en/security/sandboxing) - Official docs
- [@anthropic-ai/sandbox-runtime](https://github.com/anthropics/sandbox-runtime) - Open source implementation

---

## Data Protection

### Encryption

**In Transit**:
- ✅ HTTPS enforced (TLS 1.2+)
- ✅ Secure WebSocket connections
- ✅ HSTS headers

**At Rest**:
- ✅ Supabase PostgreSQL encryption (AES-256)
- ✅ Supabase Storage encryption
- ✅ Environment variables in secure storage (Vercel/`.env.local`)

### Sensitive Data Handling

**Never commit to git**:
- API keys
- Database credentials
- Session secrets
- Private keys

**Storage**:
- Environment variables only
- `.env.local` (git-ignored)
- Vercel environment variables (production)

### GDPR Compliance

**Status**: Partial (Phase 7)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Data Minimization | ✅ Pass | Only collect necessary data |
| Right to Access | ⚠️ Partial | No export feature yet (Phase 4) |
| Right to Erasure | ❌ Fail | No delete account feature (Phase 4) |
| Data Protection by Design | ✅ Pass | RLS, encryption, sanitization |
| Security of Processing | ✅ Pass | After critical fixes |
| Breach Notification | ⚠️ Partial | No incident plan (Phase 4) |

**Phase 4 Requirements**:
- [ ] Implement user data export (GDPR Article 15)
- [ ] Implement account deletion (GDPR Article 17)
- [ ] Document incident response plan (GDPR Article 33)

---

## Security Testing

### Test Suites

**Location**: `__tests__/security/`

#### 1. XSS Prevention Tests
**File**: `xss-prevention.test.ts`
**Coverage**: 37 tests, all passing
**Validates**:
- HTML sanitization (DOMPurify)
- Plain text sanitization
- Email sanitization
- URL sanitization
- Filename sanitization
- Real-world attack scenarios

#### 2. File Upload Security Tests
**File**: `security-hardening.test.ts`
**Coverage**: 38 tests, all passing
**Validates**:
- File size limits
- MIME type validation
- Extension matching
- Magic bytes validation (anti-spoofing)
- Filename sanitization
- File count limits

#### 3. RLS Policy Tests
**File**: `rls-policies.test.ts`
**Coverage**: 16 tests (requires Supabase)
**Validates**:
- Cross-user project access prevention
- Cross-user storage access prevention
- Cross-user job access prevention
- SQL injection prevention
- Directory traversal prevention

### Running Security Tests

```bash
# All security tests
pnpm test __tests__/security/

# XSS prevention only
pnpm test __tests__/security/xss-prevention.test.ts

# File upload security only
pnpm test __tests__/security/security-hardening.test.ts

# RLS policies (requires Supabase)
pnpm test __tests__/security/rls-policies.test.ts
```

### Test Results

```
Test Files  3 passed (3)
      Tests  91 passed (91)
   Duration  3.5s
```

---

## Incident Response

### Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

**Contact**:
- Email: [security@wastewise.local](mailto:security@wastewise.local)
- Response time: 24 hours
- Disclosure timeline: 90 days

### Incident Response Plan

**Phase 4 TODO**: Document complete incident response plan

**Immediate Actions** (if breach suspected):
1. ✅ Rotate all API keys immediately
2. ✅ Review Supabase audit logs
3. ✅ Check Sentry error logs
4. ✅ Notify affected users (if PII exposed)
5. ✅ Document incident timeline
6. ✅ Implement fix and deploy
7. ✅ Post-mortem analysis

---

## Security Checklist

### Pre-Deployment (Phase 4)

**Infrastructure**:
- [ ] Upstash Redis configured and tested
- [ ] Supabase RLS policies verified
- [ ] All environment variables set (production)
- [ ] HTTPS certificates configured
- [ ] WAF enabled (Cloudflare/AWS)

**Code**:
- [ ] All security tests passing
- [ ] No `console.log` in production code
- [ ] No hardcoded secrets
- [ ] TypeScript strict mode enabled
- [ ] Linting passing with zero errors

**Monitoring**:
- [ ] Sentry error tracking configured
- [ ] Rate limit metrics tracked
- [ ] Failed login attempts monitored
- [ ] Database query performance monitored

**Documentation**:
- [ ] API documentation complete
- [ ] Security headers documented
- [ ] Incident response plan complete
- [ ] GDPR compliance documented

### Post-Deployment Monitoring

**Daily**:
- Check Sentry for new errors
- Review rate limit logs

**Weekly**:
- Review Supabase audit logs
- Check for dependency vulnerabilities (`pnpm audit`)
- Review failed authentication attempts

**Monthly**:
- Rotate API keys (if not using key rotation service)
- Review and update security documentation
- Security training for team

**Quarterly**:
- Full security audit
- Penetration testing
- Dependency updates

---

## Additional Resources

### OWASP Top 10 (2021) Compliance

| Rank | Vulnerability | Status |
|------|---------------|--------|
| A01 | Broken Access Control | ✅ Fixed (Storage RLS) |
| A02 | Cryptographic Failures | ✅ Pass (HTTPS, encryption) |
| A03 | Injection | ✅ Pass (Parameterized queries, sanitization) |
| A04 | Insecure Design | ⚠️ Partial (Rate limiting needs Redis) |
| A05 | Security Misconfiguration | ⚠️ Partial (CSP partial, no WAF) |
| A06 | Vulnerable Components | ⚠️ Unknown (No dependency scanning) |
| A07 | Authentication Failures | ✅ Pass (Supabase Auth) |
| A08 | Software and Data Integrity | ✅ Pass (Git signed commits) |
| A09 | Logging & Monitoring | ⚠️ Partial (Console logs, needs service) |
| A10 | SSRF | ✅ Pass (No user-controlled URLs) |

**Overall Score**: 6/10 Pass, 4/10 Partial → **Acceptable for Phase 7**

### External Documentation

- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-21 | Initial security documentation |

**Maintained By**: Backend Development Team
**Next Review**: Before Phase 4 deployment
