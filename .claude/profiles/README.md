# WasteWise Sandbox Profiles

This directory contains predefined sandbox configurations for different development scenarios. Each profile balances security with productivity by defining specific filesystem, network, and command boundaries.

---

## Available Profiles

### 1. Development Profile (`wastewise-dev.json`)

**Purpose**: Full development access for building features

**Use Cases**:

- Frontend development (UI components, pages, forms)
- Backend development (API routes, database queries)
- Skills development (calculation logic, AI integrations)
- General coding tasks

**Access**:

- ✅ Write: All project directories (app, components, lib, tests, docs)
- ❌ Denied: Sensitive files (.env, credentials, config)
- ✅ Network: All approved project APIs
- ⚠️ Commands: Git/Supabase/Docker excluded (standard permissions)

**Recommended Agents**: frontend-dev, backend-dev, coder, skills-agent

---

### 2. Testing Profile (`wastewise-testing.json`)

**Purpose**: Isolated testing environment

**Use Cases**:

- Writing unit tests
- Creating test fixtures
- Running test suites
- Test-driven development (TDD)

**Access**:

- ✅ Write: Test directories only (**tests**, lib/evals)
- ✅ Read: Source code (for test creation)
- ❌ Denied: Production databases, external APIs
- ✅ Network: Anthropic API only (for mocks)

**Recommended Agents**: tester, reviewer

---

### 3. Documentation Profile (`wastewise-docs.json`)

**Purpose**: Documentation updates without code access

**Use Cases**:

- Writing documentation
- Updating README files
- Creating guides and tutorials
- Maintaining .claude instructions

**Access**:

- ✅ Write: Documentation directories only (docs, .claude, \*.md)
- ✅ Read: Source code (for accuracy)
- ❌ Network: No network access (offline work)
- ⚠️ Commands: Markdown linters only

**Recommended Agents**: documentation-agent, technical-writer

---

### 4. Read-Only Profile (`wastewise-readonly.json`)

**Purpose**: Code analysis without modifications

**Use Cases**:

- Code exploration and analysis
- Security audits
- Performance profiling
- Research and learning
- Answering codebase questions

**Access**:

- ❌ Write: No write access anywhere
- ✅ Read: Full source code access
- ✅ Network: Full access (for research/documentation)
- ✅ Commands: Read-only commands only (grep, cat, git log)

**Recommended Agents**: Explore, researcher, code-analyzer, security-auditor

---

## How to Use Profiles

### Method 1: Via /sandbox Command

```
# Default profile (dev)
/sandbox

# Specific profile
/sandbox-profile testing
/sandbox-profile docs
/sandbox-profile readonly
```

### Method 2: Via settings.json

```json
{
  "sandbox": {
    "enabled": true,
    "activeProfile": "wastewise-dev"
  }
}
```

### Method 3: Project-Specific (.claude/sandbox.json)

The base `.claude/sandbox.json` defines the `dev` profile as default. Other profiles inherit and restrict these settings.

---

## Profile Comparison

| Feature           | Dev      | Testing  | Docs     | ReadOnly |
| ----------------- | -------- | -------- | -------- | -------- |
| Write source code | ✅       | ❌       | ❌       | ❌       |
| Write tests       | ✅       | ✅       | ❌       | ❌       |
| Write docs        | ✅       | ❌       | ✅       | ❌       |
| Read source       | ✅       | ✅       | ✅       | ✅       |
| Network access    | Full     | Limited  | None     | Full     |
| Git operations    | Excluded | Excluded | Excluded | ReadOnly |
| Database access   | Full     | None     | None     | ReadOnly |

---

## Security Boundaries

### All Profiles Block

**Filesystem**:

- `.env` and `.env.*` (environment variables)
- `.credentials.json` (OAuth credentials)
- `supabase/config.toml` (database config)
- `node_modules/` (dependencies)
- `.git/` (version control internals)
- Build artifacts (`.next/`, `dist/`)

**Commands**:

- Sensitive operations require explicit approval
- Excluded commands use standard permission flow
- Auto-approval within sandbox boundaries

---

## Custom Profiles

### Creating a New Profile

1. Copy an existing profile JSON file
2. Modify `profile_name`, `description`, and `use_cases`
3. Adjust `allowed_write_paths` and `allowed_domains`
4. Document `security_notes` and `restrictions`
5. Test with validation suite

### Profile Structure

```json
{
  "profile_name": "my-custom-profile",
  "description": "Brief description",
  "use_cases": ["case 1", "case 2"],
  "filesystem": {
    "allowed_write_paths": ["./specific/**"],
    "denied_paths": ["./.env"]
  },
  "network": {
    "allowed_domains": ["api.example.com"]
  },
  "commands": {
    "excluded": ["git"],
    "auto_approve_in_sandbox": true
  },
  "agents": {
    "recommended_for": ["agent-type"]
  }
}
```

---

## Validation

### Test Profile Configuration

```bash
# Run sandbox compliance tests
pnpm test __tests__/security/sandbox-compliance.test.ts

# Verify specific profile
/sandbox-profile testing
# Then attempt operations to verify boundaries
```

### Expected Behaviors

**Dev Profile**:

- ✅ Write to `./app/page.tsx` succeeds
- ❌ Read `.env` fails
- ✅ Fetch from `api.anthropic.com` succeeds
- ❌ Fetch from `malicious.com` requires permission

**Testing Profile**:

- ✅ Write to `./__tests__/unit/calc.test.ts` succeeds
- ❌ Write to `./app/page.tsx` fails
- ❌ Fetch from `supabase.co` fails (no production DB)

**Docs Profile**:

- ✅ Write to `./docs/guide.md` succeeds
- ❌ Write to `./lib/utils.ts` fails
- ❌ Any network request fails (offline)

**ReadOnly Profile**:

- ❌ Any write operation fails
- ✅ Read any source file succeeds
- ✅ Any approved network request succeeds

---

## Troubleshooting

### Profile Not Activating

**Problem**: `/sandbox-profile testing` has no effect
**Solution**: Ensure sandbox is enabled first with `/sandbox`

### Operations Blocked Unexpectedly

**Problem**: Legitimate operation requires permission
**Solution**:

1. Check active profile matches task type
2. Review profile's `allowed_write_paths`
3. Switch to appropriate profile or extend current one

### Network Request Fails

**Problem**: API call to approved domain blocked
**Solution**:

1. Verify domain in profile's `allowed_domains`
2. Check for typos (case-sensitive)
3. Add domain to profile if missing

---

## Best Practices

1. **Start Restrictive**: Use the most restrictive profile that allows your task
2. **Match Profile to Task**: Testing work → testing profile, docs → docs profile
3. **Monitor Violations**: Review sandbox logs to understand actual needs
4. **Document Changes**: Explain why profiles are extended
5. **Test Thoroughly**: Validate profile changes before committing
6. **Review Monthly**: Update profiles as project evolves

---

## Maintenance

**Review Schedule**: Monthly
**Last Updated**: 2025-11-21
**Next Review**: 2025-12-21

**Maintenance Checklist**:

- [ ] Verify all profiles still align with project structure
- [ ] Check for new sensitive files to deny
- [ ] Review network domains for deprecated services
- [ ] Update agent recommendations
- [ ] Run validation suite

---

## References

- [Global Sandboxing Guide](~/.claude/sandboxing.md)
- [WasteWise Security Documentation](../docs/SECURITY.md)
- [Project Sandbox Config](../.claude/sandbox.json)
- [Claude Code Sandboxing Docs](https://code.claude.com/docs/en/security/sandboxing)
