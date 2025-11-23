# Responsive Design Migration Guide

## Overview

This guide helps you migrate existing WasteWise pages to use the new responsive infrastructure.

## Step-by-Step Migration

### 1. Identify Pages to Migrate

Run the audit to find pages with responsive issues:

```bash
pnpm audit:responsive
```

Review the report: `responsive-audit-report.json`

**Priority Order**:

1. High-traffic pages (landing, login, dashboard)
2. User-facing forms (project creation, settings)
3. Data display pages (results, reports)
4. Admin/internal pages

### 2. Backup Current State

```bash
# Create a feature branch
git checkout -b fix/responsive-migration

# Take screenshots before changes
pnpm test:responsive:quick --grep "screenshot"
mv __tests__/e2e/screenshots __tests__/e2e/screenshots-before
```

### 3. Apply Responsive Patterns

#### Pattern 1: Replace Fixed Widths

**Before**:

```tsx
<div className="w-[1200px] px-8">Content</div>
```

**After**:

```tsx
import { ResponsiveContainer } from "@/components/responsive/responsive-container";

<ResponsiveContainer maxWidth="xl">Content</ResponsiveContainer>;
```

#### Pattern 2: Responsive Grid Layouts

**Before**:

```tsx
<div className="grid grid-cols-4 gap-4">
  {stats.map((stat) => (
    <StatCard {...stat} />
  ))}
</div>
```

**After**:

```tsx
import { ResponsiveGrid } from "@/components/responsive/responsive-grid";

<ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md">
  {stats.map((stat) => (
    <StatCard {...stat} />
  ))}
</ResponsiveGrid>;
```

#### Pattern 3: Table Wrappers

**Before**:

```tsx
<table className="w-full">
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

**After**:

```tsx
import { ResponsiveTable } from "@/components/responsive/responsive-table";

<ResponsiveTable>
  <table className="min-w-full">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</ResponsiveTable>;
```

#### Pattern 4: Forms

**Before**:

```tsx
<div className="flex gap-4">
  <Input name="city" />
  <Input name="state" />
</div>
```

**After**:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input name="city" />
  <Input name="state" />
</div>
```

#### Pattern 5: Buttons

**Before**:

```tsx
<Button type="submit">Submit</Button>
```

**After**:

```tsx
<Button type="submit" className="w-full md:w-auto">
  Submit
</Button>
```

#### Pattern 6: Images

**Before**:

```tsx
<img src="/hero.jpg" alt="Hero" className="w-full" />
```

**After**:

```tsx
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1440}
  height={900}
  className="w-full h-auto"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1440px"
  priority
/>;
```

### 4. Test Your Changes

```bash
# Run responsive tests
pnpm test:responsive:quick --grep "YourPage"

# Generate new screenshots
pnpm test:responsive:quick --grep "screenshot.*YourPage"

# Compare before/after
ls __tests__/e2e/screenshots-before/
ls __tests__/e2e/screenshots/
```

### 5. Validate on Real Devices

**Minimum Testing**:

- [ ] iPhone Safari (375px)
- [ ] iPad Safari (768px)
- [ ] Chrome Desktop (1024px+)

**Use DevTools**:

```
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M)
3. Test each viewport
4. Check for:
   - No horizontal scroll
   - Readable text
   - Clickable buttons
   - Functional forms
```

### 6. Address Common Issues

#### Issue: Content Overflows on Mobile

**Symptom**: Horizontal scrollbar appears

**Fix**:

```tsx
// Find the overflowing element
// Replace fixed width with max-width

// Before
<div className="w-[800px]">

// After
<div className="w-full max-w-3xl">
```

#### Issue: Text Too Small on Mobile

**Symptom**: Text hard to read on 375px

**Fix**:

```tsx
// Use responsive text sizing

// Before
<p className="text-sm">

// After
<p className="text-sm md:text-base">
```

#### Issue: Buttons Too Small on Mobile

**Symptom**: Hard to tap accurately

**Fix**:

```tsx
// Ensure minimum 44x44px touch target

// Before
<Button size="sm">Click</Button>

// After
<Button className="min-h-11 min-w-11">Click</Button>
```

#### Issue: Grid Breaks on Mobile

**Symptom**: Columns too narrow on small screens

**Fix**:

```tsx
// Stack on mobile, grid on desktop

// Before
<div className="grid grid-cols-3">

// After
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### 7. Commit Your Changes

```bash
# Run final validation
pnpm audit:responsive
pnpm test:responsive:quick

# Commit if all tests pass
git add .
git commit -m "fix: migrate [PageName] to responsive design"

# Push and create PR
git push origin fix/responsive-migration
```

## Page-by-Page Checklist

### Landing Page (app/page.tsx)

- [ ] Replace hardcoded widths (w-[XXXpx])
- [ ] Add responsive image optimization
- [ ] Test hero section on mobile
- [ ] Validate feature cards stack on mobile
- [ ] Check CTA buttons full-width on mobile

**Issues Found**: 15 warnings (mostly hardcoded widths)

### Login Page (app/(auth)/login/page.tsx)

- [ ] Form inputs full-width on mobile
- [ ] Submit button full-width on mobile
- [ ] Card centered on all viewports
- [ ] Links easily tappable

**Issues Found**: 2 warnings

### Dashboard (app/dashboard/page.tsx)

- [ ] Stats grid: 1 col mobile, 2 col tablet, 4 col desktop
- [ ] Quick action cards responsive
- [ ] No horizontal scroll on mobile
- [ ] Charts/graphs responsive

**Issues Found**: 6 warnings (grid layouts)

### Projects List (app/projects/page.tsx)

- [ ] Table wrapped in ResponsiveTable
- [ ] Action buttons adequate size
- [ ] Filters stack on mobile
- [ ] Pagination works on mobile

**Issues Found**: TBD (needs audit)

### Project Creation (app/projects/new/page.tsx)

- [ ] Form fields stack on mobile
- [ ] City/State side-by-side on tablet+
- [ ] Dropdowns functional on touch
- [ ] Submit/Cancel buttons responsive

**Issues Found**: 3 warnings (grid layouts)

## Testing Matrix

| Page        | 375px | 414px | 768px | 1024px | 1440px | Status  |
| ----------- | ----- | ----- | ----- | ------ | ------ | ------- |
| Landing     | ⏳    | ⏳    | ⏳    | ⏳     | ⏳     | Pending |
| Login       | ⏳    | ⏳    | ⏳    | ⏳     | ⏳     | Pending |
| Signup      | ⏳    | ⏳    | ⏳    | ⏳     | ⏳     | Pending |
| Dashboard   | ⏳    | ⏳    | ⏳    | ⏳     | ⏳     | Pending |
| Projects    | ⏳    | ⏳    | ⏳    | ⏳     | ⏳     | Pending |
| New Project | ⏳    | ⏳    | ⏳    | ⏳     | ⏳     | Pending |

**Legend**: ⏳ Pending | ✅ Pass | ❌ Fail

## Automated Migration Script

For bulk migrations, use this helper script:

```bash
# Find all TSX files with hardcoded widths
pnpm audit:responsive | grep "w-\[" > responsive-issues.txt

# Review and fix in batches
cat responsive-issues.txt | head -10

# After fixes, re-run audit
pnpm audit:responsive
```

## Performance Impact

### Expected Improvements

**Image Optimization**:

- Before: 2-3 MB images
- After: 200-500 KB (WebP/AVIF)
- Improvement: 80-90% reduction

**CSS Bundle**:

- Before: Custom media queries (~5 KB)
- After: Tailwind utilities (JIT, ~2 KB)
- Improvement: 60% smaller

**Layout Shift**:

- Before: CLS 0.15-0.25
- After: CLS <0.1 (with width/height)
- Improvement: Better UX, higher Lighthouse score

## Rollback Plan

If responsive changes break functionality:

```bash
# Revert to previous commit
git revert HEAD

# Or restore from backup screenshots
mv __tests__/e2e/screenshots-before __tests__/e2e/screenshots

# Re-deploy previous version
pnpm deploy:staging
```

## Support

**Questions?**

- Check [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) for patterns
- Review [RESPONSIVE_AUDIT_CHECKLIST.md](./RESPONSIVE_AUDIT_CHECKLIST.md) for validation
- See [RESPONSIVE_README.md](../RESPONSIVE_README.md) for quick commands

**Found a bug?**

- Run `pnpm audit:responsive` to identify
- Create issue with screenshots
- Tag mobile development team

---

**Last Updated**: 2025-11-21
**Migration Status**: In Progress (0/6 pages complete)
**Maintained By**: Mobile Development Team
