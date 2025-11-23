# WasteWise Responsive Design - Quick Start

> Complete responsive design validation and testing for WasteWise (375px - 1440px)

## Quick Commands

```bash
# Run full responsive test suite (audit + tests + screenshots)
pnpm test:responsive

# Quick viewport validation only
pnpm test:responsive:quick

# Static code audit only
pnpm audit:responsive

# View test report in browser
pnpm test:e2e:report

# Run tests in UI mode (interactive debugging)
pnpm test:e2e:ui responsive-viewports
```

## Viewports Tested

| Device        | Width  | Tailwind  | Usage             |
| ------------- | ------ | --------- | ----------------- |
| Mobile Small  | 375px  | (default) | iPhone SE         |
| Mobile Large  | 414px  | (default) | iPhone 14 Pro Max |
| Tablet        | 768px  | `md:`     | iPad              |
| Desktop       | 1024px | `lg:`     | Laptops           |
| Large Desktop | 1440px | `xl:`     | MacBook Pro       |

## Current Status

**Audit Results** (as of 2025-11-21):

- Total Issues: 77
- Errors: 0 🟢
- Warnings: 41 🟡
- Info: 36 🔵

**Most Common Issues**:

1. Hardcoded widths (w-[XXXpx])
2. Grid layouts without mobile breakpoints
3. Tables without overflow wrappers

## Responsive Components

Use these helper components for consistent responsive behavior:

### ResponsiveContainer

```tsx
import { ResponsiveContainer } from "@/components/responsive/responsive-container";

<ResponsiveContainer maxWidth="xl" padding={true}>
  {children}
</ResponsiveContainer>;
```

### ResponsiveGrid

```tsx
import { ResponsiveGrid } from "@/components/responsive/responsive-grid";

<ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md">
  {cards}
</ResponsiveGrid>;
```

### ResponsiveTable

```tsx
import { ResponsiveTable } from "@/components/responsive/responsive-table";

<ResponsiveTable>
  <table className="min-w-full">...</table>
</ResponsiveTable>;
```

## Pre-Commit Checklist

Before committing UI changes:

```bash
# 1. Audit your changes
pnpm audit:responsive

# 2. Fix issues reported

# 3. Run responsive tests
pnpm test:responsive:quick

# 4. Review screenshots (if needed)
ls __tests__/e2e/screenshots/
```

## Documentation

- **[Responsive Design Guide](./docs/RESPONSIVE_DESIGN.md)** - Complete responsive patterns
- **[Audit Checklist](./docs/RESPONSIVE_AUDIT_CHECKLIST.md)** - Pre-deployment validation
- **[Implementation Summary](./docs/RESPONSIVE_IMPLEMENTATION_SUMMARY.md)** - Technical overview

## Common Fixes

### Hardcoded Width

```tsx
// ❌ WRONG
<div className="w-[1200px]">Content</div>

// ✅ CORRECT
<div className="w-full max-w-7xl mx-auto">Content</div>
```

### Missing Mobile Breakpoint

```tsx
// ❌ WRONG
<div className="grid grid-cols-4 gap-4">

// ✅ CORRECT
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Table Overflow

```tsx
// ❌ WRONG
<table>...</table>

// ✅ CORRECT
<div className="overflow-x-auto">
  <table className="min-w-full">...</table>
</div>
```

### Button on Mobile

```tsx
// ❌ WRONG
<Button className="w-32">Submit</Button>

// ✅ CORRECT
<Button className="w-full md:w-auto">Submit</Button>
```

## Testing Individual Pages

```bash
# Test specific page
pnpm test:responsive:quick --grep "Landing Page"

# Test specific viewport
pnpm test:responsive:quick --grep "mobile-small"

# Generate screenshots for visual comparison
pnpm test:responsive:quick --grep "screenshot"
```

## Need Help?

1. **Check the docs**: Start with [RESPONSIVE_DESIGN.md](./docs/RESPONSIVE_DESIGN.md)
2. **Run the audit**: `pnpm audit:responsive` shows specific issues
3. **View examples**: Check responsive components in `components/responsive/`
4. **Ask the team**: Mobile development team maintains this infrastructure

---

**Quick Links**:

- 📚 [Full Documentation](./docs/)
- 🧪 [Test Suite](./__tests__/e2e/responsive-viewports.spec.ts)
- 🛠️ [Audit Script](./scripts/audit-responsive.ts)
- 📦 [Components](./components/responsive/)
