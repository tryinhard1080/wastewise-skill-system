# WasteWise Sandboxing Guide

**Last Updated**: 2025-11-21
**Version**: 1.0.0
**Purpose**: Complete guide to sandboxing configuration for WasteWise development

---

## Table of Contents

1. [Overview](#overview)
2. [Why Sandboxing for WasteWise](#why-sandboxing-for-wastewise)
3. [Quick Start](#quick-start)
4. [Configuration Files](#configuration-files)
5. [Sandbox Profiles](#sandbox-profiles)
6. [Protected Resources](#protected-resources)
7. [Network Boundaries](#network-boundaries)
8. [Violation Monitoring](#violation-monitoring)
9. [Agent-Based Development](#agent-based-development)
10. [Testing & Validation](#testing--validation)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

---

## Overview

WasteWise uses Claude Code's native sandboxing to create secure boundaries for AI agent operations. This provides:

- **84% reduction** in permission prompts (faster development)
- **Protection** against prompt injection attacks
- **Automatic blocking** of sensitive files (.env, credentials, secrets)
- **Network isolation** to prevent unauthorized API calls

**Platform Support**: macOS and Linux (Windows support planned)

---

## Why Sandboxing for WasteWise

### Security Benefits

**Threat Model**: WasteWise processes sensitive data (invoice extraction, contract analysis, regulatory research). If an attacker compromises AI agent prompts, sandboxing prevents:

❌ **Credential Theft**

- Cannot read `.env` (API keys for Anthropic, Supabase, Upstash)
- Cannot access `.credentials.json` (OAuth tokens)
- Cannot read `supabase/config.toml` (database credentials)

❌ **Data Exfiltration**

- Network requests limited to approved domains only
- Blocks unauthorized external API calls
- Prevents malicious downloads

❌ **System Compromise**

- Cannot modify shell configs (`~/.bashrc`, `~/.zshrc`)
- Cannot access system directories
- Command execution restricted

### Productivity Benefits

✅ **Faster Development**

- 84% fewer permission prompts
- Agents work autonomously within boundaries
- No interruptions for file operations in project directories

✅ **Clear Boundaries**

- Pre-defined allowed/denied paths
- Explicit network domain allowlist
- Task-specific profiles (dev, testing, docs, readonly)

✅ **Audit Trail**

- All boundary violations logged
- Suspicious pattern detection
- Integration with existing observability

---

## Quick Start

### Enable Sandboxing

**Step 1: Enable sandbox with defaults**

```
/sandbox
```

This automatically:

- Grants write access to project directories (app, components, lib, tests, docs)
- Denies access to sensitive files (.env, credentials, config.toml)
- Allows network requests to approved domains only
- Excludes git/supabase/docker from sandbox

**Step 2: Verify configuration**

```bash
cat .claude/sandbox.json
```

**Step 3: Start development**

```
# Launch agent (automatically inherits sandbox)
Use Task tool with subagent_type="frontend-dev" to implement feature
```

### Switching Profiles

**Use specific profile for task**:

```
/sandbox-profile testing   # For writing tests
/sandbox-profile docs      # For documentation
/sandbox-profile readonly  # For code analysis
```

---

## Configuration Files

### Main Configuration

**File**: `.claude/sandbox.json`

**Purpose**: Defines default sandbox boundaries for WasteWise project

**Structure**:

```json
{
  "version": "1.0.0",
  "description": "WasteWise sandboxing configuration",
  "filesystem": {
    "allowed_write_paths": [
      "./app/**",
      "./components/**",
      "./lib/**",
      "./__tests__/**",
      "./docs/**",
      "./scripts/**",
      "./public/**",
      "./supabase/migrations/**",
      "./supabase/seed.sql",
      "./.claude/**"
    ],
    "denied_paths": [
      "./.env",
      "./.env.*",
      "./.credentials.json",
      "./supabase/config.toml",
      "./node_modules/**",
      "./.git/**",
      "./.next/**",
      "./dist/**",
      "./.vercel/**"
    ]
  },
  "network": {
    "allowed_domains": [
      "api.anthropic.com",
      "*.supabase.co",
      "*.upstash.io",
      "cdn.jsdelivr.net",
      "api.exa.ai",
      "api.tavily.com",
      "api.brave.com",
      "registry.npmjs.org",
      "*.github.com"
    ]
  },
  "commands": {
    "excluded": ["git", "supabase", "docker"],
    "auto_approve_in_sandbox": true
  }
}
```

### Profile Configurations

**Location**: `.claude/profiles/*.json`

**Purpose**: Task-specific boundary definitions

**Available Profiles**:

1. `wastewise-dev.json` - Full development access
2. `wastewise-testing.json` - Test directories only
3. `wastewise-docs.json` - Documentation only
4. `wastewise-readonly.json` - Read-only analysis

See [Sandbox Profiles](#sandbox-profiles) section for details.

---

## Sandbox Profiles

### 1. Development Profile (Default)

**File**: `.claude/profiles/wastewise-dev.json`

**Use Cases**:

- Frontend development (UI components, pages, forms)
- Backend development (API routes, database queries)
- Skills development (calculation logic, AI integrations)
- General coding tasks

**Filesystem Access**:

- ✅ Write: All project directories
- ❌ Denied: .env, credentials, config, node_modules
- ✅ Read: Full source code access

**Network Access**:

- ✅ All approved domains (Anthropic, Supabase, Upstash, etc.)

**Excluded Commands**:

- git (standard permissions)
- supabase (standard permissions)
- docker (standard permissions)

**Recommended Agents**:

- frontend-dev
- backend-dev
- coder
- skills-agent

**Activate**:

```
/sandbox  # Default profile
```

---

### 2. Testing Profile

**File**: `.claude/profiles/wastewise-testing.json`

**Use Cases**:

- Writing unit tests
- Creating test fixtures
- Running test suites
- Test-driven development (TDD)

**Filesystem Access**:

- ✅ Write: `./__tests__/**`, `./lib/evals/**` only
- ✅ Read: Source code (for test creation)
- ❌ Denied: Production code modifications

**Network Access**:

- ✅ `api.anthropic.com` only (for test mocks)
- ❌ No production databases or external services

**Excluded Commands**:

- git, supabase, docker

**Allowed Test Commands**:

- `pnpm test`
- `pnpm test:unit`
- `pnpm test:e2e`
- `pnpm eval`

**Recommended Agents**:

- tester
- reviewer

**Activate**:

```
/sandbox-profile testing
```

**Security Notes**:

- Read-only access to source code for test creation
- Write access limited to test directories only
- No access to production databases or APIs
- Ideal for TDD workflows

---

### 3. Documentation Profile

**File**: `.claude/profiles/wastewise-docs.json`

**Use Cases**:

- Writing documentation
- Updating README files
- Creating guides and tutorials
- Maintaining Claude Code instructions

**Filesystem Access**:

- ✅ Write: `./docs/**`, `./.claude/**`, `*.md` files
- ✅ Read: Source code (for documentation accuracy)
- ❌ Denied: All code modifications

**Network Access**:

- ❌ No network access (fully offline)

**Excluded Commands**:

- git only

**Allowed Commands**:

- markdownlint
- prettier

**Recommended Agents**:

- documentation-agent
- technical-writer

**Activate**:

```
/sandbox-profile docs
```

**Security Notes**:

- Read-only access to source code
- Write access limited to documentation
- No network access required
- Safe for external contributors

---

### 4. Read-Only Profile

**File**: `.claude/profiles/wastewise-readonly.json`

**Use Cases**:

- Code exploration and analysis
- Security audits
- Performance profiling
- Research and learning
- Answering codebase questions

**Filesystem Access**:

- ❌ NO write access anywhere
- ✅ Read: Full source code access
- ❌ Denied: Sensitive files (.env, credentials)

**Network Access**:

- ✅ Full access to all approved domains (for research)

**Excluded Commands**:

- None (all commands sandboxed)

**Allowed Read-Only Commands**:

- grep, find, cat, less, head, tail
- pnpm list
- git log, git diff

**Recommended Agents**:

- Explore
- researcher
- code-analyzer
- security-auditor

**Activate**:

```
/sandbox-profile readonly
```

**Restrictions**:

- NO file modifications
- NO git commits
- NO package installations
- NO database modifications

---

## Protected Resources

### Always Denied (All Profiles)

**Environment Variables**:

- `.env` - Main environment configuration
- `.env.*` - All environment variants (.env.local, .env.production, etc.)

**Credentials**:

- `.credentials.json` - OAuth tokens (Rube MCP)
- `supabase/config.toml` - Database credentials

**Dependencies & Build Artifacts**:

- `node_modules/` - Package dependencies
- `.next/` - Next.js build output
- `dist/` - Distribution builds
- `.vercel/` - Deployment artifacts

**Version Control**:

- `.git/` - Git internals (prevent corruption)

**Logs**:

- `worker.log` - Background worker logs

### Why These Are Protected

**Security**:

- **API Keys**: Anthropic, Supabase, Upstash credentials
- **Tokens**: OAuth access tokens for MCP integrations
- **Secrets**: Database passwords, service keys

**Integrity**:

- **Dependencies**: Prevent malicious package modifications
- **Git**: Avoid repository corruption
- **Build Artifacts**: Ensure clean builds

**Performance**:

- **node_modules**: Massive directory (slow operations)
- **Build outputs**: Regenerated automatically

---

## Network Boundaries

### Approved Domains

**AI Services**:

- `api.anthropic.com` - Claude AI for invoice extraction, regulatory research

**Backend Infrastructure**:

- `*.supabase.co` - Database, storage, authentication
- `*.upstash.io` - Redis for rate limiting

**Search APIs** (Regulatory Research):

- `api.exa.ai` - Primary search provider
- `api.tavily.com` - Fallback search
- `api.brave.com` - Fallback search

**CDN & Assets**:

- `cdn.jsdelivr.net` - Chart.js for HTML report visualizations

**Development Tools**:

- `registry.npmjs.org` - Package management
- `*.github.com` - Version control, CI/CD

### Domain Rationale

**Why These Domains?**

1. **api.anthropic.com**
   - Core WasteWise functionality (invoice extraction, regulatory analysis)
   - Required for all AI-powered features

2. **\*.supabase.co**
   - Database queries, file storage, authentication
   - Backend infrastructure

3. **\*.upstash.io**
   - Distributed rate limiting
   - Production security requirement

4. **Search APIs**
   - Regulatory ordinance research
   - Fallback providers for reliability

5. **cdn.jsdelivr.net**
   - Chart.js library for HTML dashboards
   - Interactive waste analytics visualizations

6. **registry.npmjs.org**
   - Package installation and updates
   - Development workflow

7. **\*.github.com**
   - Code repository access
   - CI/CD workflows

### Adding New Domains

**When to Add**:

- New AI service integration
- Additional search provider
- New CDN or external library
- Required API for feature development

**How to Add**:

1. Edit `.claude/sandbox.json`
2. Add domain to `network.allowed_domains` array
3. Document rationale in `network.explanation`
4. Test with sandbox enabled
5. Commit configuration change

**Example**:

```json
{
  "network": {
    "allowed_domains": [
      "api.anthropic.com",
      "api.newservice.com" // Added for [feature name]
    ],
    "explanation": {
      "newservice": "Required for [specific functionality]"
    }
  }
}
```

---

## Violation Monitoring

### Audit Logging

**Implementation**: `lib/observability/sandbox-logger.ts`

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

### Usage

**Log Violations**:

```typescript
import {
  logFilesystemViolation,
  logNetworkViolation,
  logCommandViolation,
} from "@/lib/observability/sandbox-logger";

// Automatic logging by Claude Code
// Manual logging if needed:
logFilesystemViolation("write", "/path/to/file", false, "frontend-dev");
logNetworkViolation("malicious.com", "https://malicious.com/api", false);
```

**View Statistics**:

```typescript
import { getSandboxStats } from "@/lib/observability/sandbox-logger";

const stats = getSandboxStats();
console.log("Total violations:", stats.total_violations);
console.log("By type:", stats.violations_by_type);
console.log("By severity:", stats.violations_by_severity);
```

**Detect Suspicious Patterns**:

```typescript
import { detectSuspiciousPatterns } from "@/lib/observability/sandbox-logger";

const patterns = detectSuspiciousPatterns();
if (patterns.suspicious) {
  console.error("Security alert!");
  console.error("Reasons:", patterns.reasons);
  console.info("Recommendations:", patterns.recommendations);
}
```

**Export Violations**:

```typescript
import { exportViolations } from "@/lib/observability/sandbox-logger";

const json = exportViolations();
// Save to file or send to monitoring service
```

### Suspicious Pattern Detection

**Automatic Detection** of:

- **Multiple critical violations** (>3) - Access to credentials/secrets
- **High denial rate** (>50%) - Misconfigured boundaries
- **Repeated access attempts** (>5) to same denied resource
- **Permission escalation** attempts

**Response**:

- Log security alerts
- Provide recommendations for resolution
- Integration with Sentry (Phase 4)

---

## Agent-Based Development

### Why Sandbox Agents?

WasteWise uses **agent-orchestrated development** (frontend-dev, backend-dev, skills-agent, etc.). Sandboxing ensures:

✅ **Security**: Agents can't access secrets even if prompts compromised
✅ **Productivity**: 84% fewer permission prompts
✅ **Clarity**: Clear boundaries for each agent type

### Agent Sandbox Mapping

| Agent Type    | Profile  | Filesystem   | Network  | Use Case            |
| ------------- | -------- | ------------ | -------- | ------------------- |
| frontend-dev  | dev      | Full project | All APIs | UI development      |
| backend-dev   | dev      | Full project | All APIs | API routes, workers |
| skills-agent  | dev      | Full project | All APIs | Calculation logic   |
| tester        | testing  | Tests only   | Limited  | Writing tests       |
| reviewer      | testing  | Tests only   | Limited  | Code review         |
| Explore       | readonly | Read-only    | All APIs | Code exploration    |
| researcher    | readonly | Read-only    | All APIs | Research tasks      |
| code-analyzer | readonly | Read-only    | All APIs | Security audits     |

### Workflow

**Step 1: Enable sandbox**

```
/sandbox
```

**Step 2: Launch agent** (inherits active profile)

```
Use Task tool with subagent_type="frontend-dev" to implement user dashboard
```

**Step 3: Switch profile if needed**

```
/sandbox-profile testing
Use Task tool with subagent_type="tester" to write unit tests
```

**Step 4: Monitor violations**

```typescript
import { getSandboxStats } from "@/lib/observability/sandbox-logger";
const stats = getSandboxStats();
// Review after agent completes
```

---

## Testing & Validation

### Test Suite

**File**: `__tests__/security/sandbox-compliance.test.ts`

**Run Tests**:

```bash
# All sandbox tests
pnpm test __tests__/security/sandbox-compliance.test.ts

# Watch mode
pnpm test:watch __tests__/security/sandbox-compliance.test.ts
```

**Test Coverage**:

1. ✅ Denied file access (.env) actually blocked
2. ✅ Allowed paths work without permission
3. ✅ Unapproved domains trigger permission requests
4. ✅ Violation logging functions correctly
5. ✅ Suspicious pattern detection works
6. ✅ Profile switching behavior
7. ✅ Command exclusions respected

### Manual Validation

**Verify Denied Access**:

```bash
# Should fail or require permission
cat .env
cat .credentials.json
cat supabase/config.toml
```

**Verify Allowed Access**:

```bash
# Should succeed without prompts
ls app/
cat lib/skills/types.ts
echo "test" > docs/test.md
```

**Verify Network Isolation**:

```bash
# Approved domain - should succeed
curl https://api.anthropic.com

# Unapproved domain - should require permission
curl https://example.com
```

### Integration with CI/CD

**GitHub Actions** (planned):

```yaml
# .github/workflows/security.yml
- name: Sandbox Compliance Tests
  run: pnpm test __tests__/security/sandbox-compliance.test.ts
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Sandbox Not Active

**Symptom**: All operations require permission prompts

**Diagnosis**:

```bash
# Check if /sandbox was called
echo $CLAUDE_SANDBOX_ENABLED
```

**Solution**:

```
/sandbox
```

---

#### Issue 2: Legitimate Operation Blocked

**Symptom**: Agent can't access file in project directory

**Diagnosis**:

```bash
# Check sandbox.json configuration
cat .claude/sandbox.json | grep -A 10 "allowed_write_paths"
```

**Solution**:

1. Verify path is in `allowed_write_paths`
2. Check for typos in path pattern
3. Add missing path if legitimate:

```json
{
  "filesystem": {
    "allowed_write_paths": ["./new-directory/**"]
  }
}
```

---

#### Issue 3: Network Request Fails

**Symptom**: API call to approved domain blocked

**Diagnosis**:

```bash
# Check network configuration
cat .claude/sandbox.json | grep -A 5 "allowed_domains"
```

**Solution**:

1. Verify domain in `allowed_domains`
2. Check wildcard patterns (e.g., `*.supabase.co` vs `supabase.co`)
3. Add missing domain if legitimate

---

#### Issue 4: Git Commands Require Permission

**Symptom**: Every git command prompts for permission

**Diagnosis**:

```bash
# Check excluded commands
cat .claude/sandbox.json | grep -A 3 "excluded"
```

**Solution**: Git is intentionally excluded for flexibility

```json
{
  "commands": {
    "excluded": ["git", "supabase", "docker"]
  }
}
```

This is expected behavior - git operations use standard permission flow.

---

#### Issue 5: High Violation Count

**Symptom**: Many sandbox violations logged

**Diagnosis**:

```typescript
import {
  getSandboxStats,
  detectSuspiciousPatterns,
} from "@/lib/observability/sandbox-logger";

const stats = getSandboxStats();
console.log(stats);

const patterns = detectSuspiciousPatterns();
console.log(patterns);
```

**Solution**:

1. Review violation logs to understand patterns
2. Adjust sandbox.json if violations are legitimate needs
3. Investigate if violations are suspicious (credential access attempts)

---

## Best Practices

### Development Workflow

1. **Start Every Session with /sandbox**

   ```
   /sandbox
   ```

2. **Use Appropriate Profile**
   - Development work → default (dev)
   - Writing tests → `testing`
   - Documentation → `docs`
   - Code analysis → `readonly`

3. **Monitor Violations Periodically**

   ```typescript
   import { getSandboxStats } from "@/lib/observability/sandbox-logger";
   const stats = getSandboxStats();
   ```

4. **Review Suspicious Patterns**
   ```typescript
   import { detectSuspiciousPatterns } from "@/lib/observability/sandbox-logger";
   const patterns = detectSuspiciousPatterns();
   if (patterns.suspicious) {
     // Investigate and address
   }
   ```

### Configuration Management

1. **Start Restrictive**
   - Begin with minimal permissions
   - Expand based on actual needs (not anticipated)
   - Monitor violations to understand requirements

2. **Document Changes**
   - Add explanation for new allowed paths
   - Justify network domain additions
   - Update profile descriptions

3. **Review Monthly**
   - Update `last_updated` and `next_review` in sandbox.json
   - Remove deprecated domains
   - Tighten boundaries as project stabilizes

4. **Test Before Committing**
   ```bash
   pnpm test __tests__/security/sandbox-compliance.test.ts
   ```

### Security Guidelines

1. **Never Disable Sandbox for Convenience**
   - Use profile switching instead
   - Add legitimate paths to configuration
   - Document exceptions with rationale

2. **Investigate Critical Violations**
   - Any access attempt to .env, credentials, secrets
   - Permission escalation attempts
   - Repeated access to same denied resource

3. **Keep Approved Domains Minimal**
   - Only add domains with clear justification
   - Remove domains when features deprecated
   - Use wildcards carefully (\*.example.com)

4. **Integrate with Monitoring** (Phase 4)
   - Send critical violations to Sentry
   - Alert on suspicious patterns
   - Quarterly security audits

---

## Integration with Security Layers

Sandboxing is **Layer 0** in WasteWise defense-in-depth:

```
Layer 0: Sandbox (filesystem + network isolation)
         ↓
Layer 1: Network (HTTPS, DDoS protection, WAF)
         ↓
Layer 2: Middleware (CSP, rate limiting, headers)
         ↓
Layer 3: API Routes (auth, sanitization, validation)
         ↓
Layer 4: Database (RLS, parameterized queries)
         ↓
Layer 5: Storage (RLS, file validation, size limits)
```

**How Layers Work Together**:

1. **Sandbox blocks** unauthorized file/network access BEFORE it reaches other layers
2. **Network layer** handles DDoS, HTTPS enforcement for approved traffic
3. **Middleware** adds security headers, rate limits approved requests
4. **API routes** authenticate, sanitize, validate approved operations
5. **Database** enforces RLS on authenticated queries
6. **Storage** validates files from authenticated users

**Example Attack Scenario**:

**Attack**: Prompt injection tries to exfiltrate .env to external server

1. **Layer 0 (Sandbox)**: ❌ Blocks .env read → Attack stops here
2. **Layer 1-5**: Never reached

**Attack**: Malicious dependency tries to access Supabase

1. **Layer 0 (Sandbox)**: ❌ Blocks unapproved domain → Attack stops here
2. **Layer 1-5**: Never reached

**Attack**: Legitimate request with malicious payload

1. **Layer 0 (Sandbox)**: ✅ Approved operation, passes through
2. **Layer 1 (Network)**: ✅ HTTPS validated, passes through
3. **Layer 2 (Middleware)**: ✅ Rate limit OK, CSP headers added
4. **Layer 3 (API)**: ❌ Input sanitization catches XSS → Attack stopped
5. **Layer 4-5**: Never reached

---

## Maintenance Schedule

**Monthly Review**:

- [ ] Review violation logs for patterns
- [ ] Update approved domains (add/remove as needed)
- [ ] Verify profile configurations still accurate
- [ ] Test sandbox compliance suite
- [ ] Update `last_updated` in sandbox.json

**Quarterly Audit**:

- [ ] Security review of all configurations
- [ ] Penetration testing of sandbox boundaries
- [ ] Dependency audit (npm audit, etc.)
- [ ] Update documentation for changes
- [ ] Team training on sandbox usage

**After Major Changes**:

- [ ] New feature requiring network access → Update domains
- [ ] Directory structure changes → Update filesystem paths
- [ ] New agent types → Update profile mappings
- [ ] Security incident → Review and tighten boundaries

---

## References

- [Global Sandboxing Guide](~/.claude/sandboxing.md) - Cross-project documentation
- [Sandbox Quick Reference](./.claude/SANDBOX_QUICK_REF.md) - Cheatsheet
- [Security Documentation](./SECURITY.md) - Complete security guide
- [Quality Checklist](./.claude/quality-checklist.md) - Pre-commit validation
- [Claude Code Sandboxing](https://code.claude.com/docs/en/security/sandboxing) - Official docs
- [@anthropic-ai/sandbox-runtime](https://github.com/anthropics/sandbox-runtime) - Open source

---

## Changelog

| Version | Date       | Changes                                |
| ------- | ---------- | -------------------------------------- |
| 1.0.0   | 2025-11-21 | Initial sandboxing guide for WasteWise |

**Maintained By**: Development Team
**Next Review**: 2025-12-21 (monthly)
