# Sandbox Quick Reference

**WasteWise Project** | Last Updated: 2025-11-21

---

## 🚀 Quick Start

```bash
# Enable sandbox with defaults
/sandbox

# Switch to specific profile
/sandbox-profile testing    # Tests only
/sandbox-profile docs       # Documentation only
/sandbox-profile readonly   # Analysis only
```

---

## 📋 Common Commands

### Enable/Disable

```bash
# Enable sandbox (recommended for all development)
/sandbox

# Check if sandbox active
echo $CLAUDE_SANDBOX_ENABLED

# Disable sandbox (not recommended)
# Use profile switching instead
```

### View Configuration

```bash
# Main configuration
cat .claude/sandbox.json

# Available profiles
ls .claude/profiles/

# Specific profile
cat .claude/profiles/wastewise-dev.json
```

### Monitor Violations

```typescript
// In code
import {
  getSandboxStats,
  detectSuspiciousPatterns,
} from "@/lib/observability/sandbox-logger";

// Get statistics
const stats = getSandboxStats();
console.log("Total violations:", stats.total_violations);
console.log("By severity:", stats.violations_by_severity);

// Check for suspicious activity
const patterns = detectSuspiciousPatterns();
if (patterns.suspicious) {
  console.error("Alert:", patterns.reasons);
  console.info("Actions:", patterns.recommendations);
}
```

---

## 🎯 Profile Selection Guide

| Task                 | Profile       | Command                     |
| -------------------- | ------------- | --------------------------- |
| Frontend development | dev (default) | `/sandbox`                  |
| Backend development  | dev (default) | `/sandbox`                  |
| Writing tests        | testing       | `/sandbox-profile testing`  |
| Writing docs         | docs          | `/sandbox-profile docs`     |
| Code review          | readonly      | `/sandbox-profile readonly` |
| Security audit       | readonly      | `/sandbox-profile readonly` |

---

## 🔒 Protected Resources (Always Denied)

```
❌ .env
❌ .env.*
❌ .credentials.json
❌ supabase/config.toml
❌ node_modules/**
❌ .git/**
❌ .next/**
❌ dist/**
```

---

## ✅ Allowed Write Paths (Dev Profile)

```
✅ ./app/**
✅ ./components/**
✅ ./lib/**
✅ ./__tests__/**
✅ ./docs/**
✅ ./scripts/**
✅ ./public/**
✅ ./supabase/migrations/**
✅ ./.claude/**
```

---

## 🌐 Approved Network Domains

```
✅ api.anthropic.com          # Claude AI
✅ *.supabase.co              # Database/Storage
✅ *.upstash.io               # Redis/Rate Limiting
✅ cdn.jsdelivr.net           # Chart.js
✅ api.exa.ai                 # Search (primary)
✅ api.tavily.com             # Search (fallback)
✅ api.brave.com              # Search (fallback)
✅ registry.npmjs.org         # Package management
✅ *.github.com               # Git/CI/CD
```

---

## 🚫 Excluded Commands

These run **outside sandbox** (standard permissions):

```
git          # Needs flexible filesystem access
supabase     # Needs database credentials
docker       # Needs host-level access
```

---

## 🧪 Testing

```bash
# Run sandbox compliance tests
pnpm test __tests__/security/sandbox-compliance.test.ts

# Run all security tests
pnpm test __tests__/security/

# Watch mode
pnpm test:watch __tests__/security/sandbox-compliance.test.ts
```

---

## 🐛 Troubleshooting

### Issue: Operations Require Permission

**Diagnosis**:

```bash
# Check if sandbox active
/sandbox

# Verify configuration
cat .claude/sandbox.json
```

**Solution**: Ensure `/sandbox` was called at session start.

---

### Issue: Legitimate File Access Blocked

**Diagnosis**:

```bash
# Check allowed paths
cat .claude/sandbox.json | grep -A 10 "allowed_write_paths"
```

**Solution**: Add path to `allowed_write_paths` in `.claude/sandbox.json`.

---

### Issue: Network Request Fails

**Diagnosis**:

```bash
# Check allowed domains
cat .claude/sandbox.json | grep -A 8 "allowed_domains"
```

**Solution**: Add domain to `allowed_domains` in `.claude/sandbox.json`.

---

### Issue: High Violation Count

**Diagnosis**:

```typescript
import { getSandboxStats } from "@/lib/observability/sandbox-logger";
console.log(getSandboxStats());
```

**Solution**:

1. Review violations to understand patterns
2. Adjust sandbox.json if violations are legitimate
3. Investigate if violations are suspicious

---

## 📊 Violation Severity Levels

| Level        | Examples                         | Action                  |
| ------------ | -------------------------------- | ----------------------- |
| **Critical** | .env, credentials, secrets       | Immediate investigation |
| **High**     | Permission escalation, deletions | Review and address      |
| **Medium**   | Writes outside allowed paths     | Check if legitimate     |
| **Low**      | Reads, unapproved network        | Monitor patterns        |

---

## 🔄 Agent Workflow

```
1. /sandbox                    # Enable sandbox

2. Launch agent
   Use Task tool with subagent_type="frontend-dev"

3. Agent inherits sandbox      # Automatic

4. Monitor violations
   import { getSandboxStats } from '@/lib/observability/sandbox-logger'

5. Switch profile if needed
   /sandbox-profile testing
```

---

## 📝 Pre-Commit Checklist

```bash
# 1. Verify sandbox was active
echo "Sandbox was enabled: ✅"

# 2. Check for violations
# (Run in code)
const stats = getSandboxStats()
console.log('Violations:', stats.total_violations)

# 3. Run sandbox tests
pnpm test __tests__/security/sandbox-compliance.test.ts

# 4. Review suspicious patterns
const patterns = detectSuspiciousPatterns()
if (patterns.suspicious) {
  # Review before committing
}
```

---

## 📚 Full Documentation

- **Complete Guide**: `docs/SANDBOXING.md`
- **Security**: `docs/SECURITY.md`
- **Global Guide**: `~/.claude/sandboxing.md`
- **Profiles**: `.claude/profiles/README.md`
- **Quality Checklist**: `.claude/quality-checklist.md`

---

## 🆘 Get Help

**Common Questions**:

1. Read `docs/SANDBOXING.md` - Comprehensive guide
2. Check `~/.claude/sandboxing.md` - Global concepts
3. Review `.claude/profiles/README.md` - Profile details
4. Run sandbox tests to validate configuration

**Still Stuck?**:

- Check violation logs: `getSandboxStats()`
- Review suspicious patterns: `detectSuspiciousPatterns()`
- Verify configuration: `cat .claude/sandbox.json`

---

## 🎓 Best Practices

1. ✅ **Always start with /sandbox**
2. ✅ **Use appropriate profile for task**
3. ✅ **Monitor violations periodically**
4. ✅ **Review suspicious patterns**
5. ✅ **Document configuration changes**
6. ✅ **Test before committing**
7. ❌ **Never disable for convenience**
8. ❌ **Never hardcode credentials**

---

**Remember**: Sandboxing reduces permission prompts by **84%** while **enhancing security**. Use it always!
