#!/bin/bash

###
# Responsive Design Testing Script
#
# Runs comprehensive responsive design validation:
# 1. Audit codebase for responsive issues
# 2. Run Playwright viewport tests
# 3. Generate screenshots
# 4. Create summary report
###

set -e

echo "╔════════════════════════════════════════╗"
echo "║  WasteWise Responsive Design Testing  ║"
echo "╔════════════════════════════════════════╗"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Run static code audit
echo "📋 Step 1/4: Running static code audit..."
echo ""

if pnpm tsx scripts/audit-responsive.ts; then
  echo -e "${GREEN}✓ No critical responsive issues found${NC}"
else
  echo -e "${YELLOW}⚠ Responsive issues found - see report above${NC}"
fi

echo ""

# Step 2: Run Playwright responsive tests
echo "🧪 Step 2/4: Running Playwright viewport tests..."
echo ""

pnpm test:e2e responsive-viewports --reporter=list

echo ""

# Step 3: Generate screenshots
echo "📸 Step 3/4: Generating responsive screenshots..."
echo ""

# Create screenshots directory
mkdir -p __tests__/e2e/screenshots

# Run tests that generate screenshots
pnpm test:e2e responsive-viewports --grep "screenshot" --reporter=list

echo ""

# Step 4: Create summary report
echo "📊 Step 4/4: Creating summary report..."
echo ""

REPORT_FILE="responsive-test-report.md"

cat > $REPORT_FILE <<EOF
# Responsive Design Test Report

**Date**: $(date +"%Y-%m-%d %H:%M:%S")
**Branch**: $(git rev-parse --abbrev-ref HEAD)
**Commit**: $(git rev-parse --short HEAD)

## Test Results

### Static Code Audit

$(if [ -f responsive-audit-report.json ]; then
  TOTAL_ISSUES=$(cat responsive-audit-report.json | grep -c '"file"' || echo "0")
  echo "- Total issues: $TOTAL_ISSUES"
  echo "- Report: \`responsive-audit-report.json\`"
else
  echo "- No audit report found"
fi)

### Viewport Tests

$(if [ -f playwright-report/index.html ]; then
  echo "- Full report: \`playwright-report/index.html\`"
else
  echo "- No Playwright report found"
fi)

### Screenshots Generated

\`\`\`
$(ls -1 __tests__/e2e/screenshots/*.png 2>/dev/null | wc -l) screenshots generated
\`\`\`

Screenshots directory: \`__tests__/e2e/screenshots/\`

## Viewports Tested

- ✅ Mobile Small (375px)
- ✅ Mobile Large (414px)
- ✅ Tablet (768px)
- ✅ Desktop (1024px)
- ✅ Large Desktop (1440px)

## Pages Tested

- Landing Page (/)
- Login Page (/login)
- Signup Page (/signup)
- Dashboard (/dashboard)
- Projects List (/projects)
- New Project (/projects/new)

## Next Steps

1. Review screenshots in \`__tests__/e2e/screenshots/\`
2. Check Playwright report: \`npx playwright show-report\`
3. Address any failing tests or visual regressions
4. Update responsive components as needed

EOF

echo -e "${GREEN}✓ Report created: $REPORT_FILE${NC}"
echo ""

# Summary
echo "╔════════════════════════════════════════╗"
echo "║           Testing Complete!            ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📁 Output files:"
echo "  - $REPORT_FILE"
echo "  - responsive-audit-report.json"
echo "  - playwright-report/index.html"
echo "  - __tests__/e2e/screenshots/"
echo ""
echo "🔍 View Playwright report:"
echo "  pnpm test:e2e:report"
echo ""
echo "📸 View screenshots:"
echo "  ls __tests__/e2e/screenshots/"
echo ""
