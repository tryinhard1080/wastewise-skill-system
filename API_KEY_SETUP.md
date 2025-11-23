# API Key Setup Instructions

## Quick Start

Edit `.env.local` and replace the placeholder values on these two lines:

### Line 18: Anthropic API Key

```bash
# BEFORE (placeholder):
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# AFTER (your real key):
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get your key**: https://console.anthropic.com/settings/keys
**Expected format**: Starts with `sk-ant-api03-`, 100+ characters

### Line 29: Exa API Key

```bash
# BEFORE (placeholder):
EXA_API_KEY=your-exa-key-here

# AFTER (your real key):
EXA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get your key**: https://dashboard.exa.ai/api-keys
**Expected format**: 40-50 characters

## Verification

After updating `.env.local`, verify the keys are loaded:

```bash
pnpm test:integration
```

**Expected**: Tests should connect to APIs without "x-api-key header is invalid" errors

**Current issue**: Keys are still placeholders (17 and 27 chars vs real 40-100+ chars)

## For GitHub Actions

After local testing works, add the same keys to GitHub Secrets:

1. Go to: https://github.com/tryinhard1080/wastewise-skill-system/settings/secrets/actions
2. Click "New repository secret"
3. Add:
   - Name: `ANTHROPIC_API_KEY`, Value: (paste your key)
   - Name: `EXA_API_KEY`, Value: (paste your key)

This allows integration tests to run in GitHub Actions CI/CD.
