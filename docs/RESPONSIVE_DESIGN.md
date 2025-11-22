# WasteWise Responsive Design Guide

## Viewport Breakpoints

WasteWise uses a mobile-first approach with the following breakpoints:

| Device | Width | Tailwind Class | Usage |
|--------|-------|----------------|-------|
| Mobile Small | 375px | (default) | iPhone SE, base mobile |
| Mobile Large | 414px | (default) | iPhone 14 Pro Max |
| Tablet | 768px | `md:` | iPad, small tablets |
| Desktop | 1024px | `lg:` | Small desktops, laptops |
| Large Desktop | 1440px | `xl:` | MacBook Pro, large screens |

## Core Principles

### 1. Mobile-First Design

Always start with mobile layout, then add responsive classes for larger screens:

```tsx
// ✅ CORRECT - Mobile first
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Column 1</div>
  <div className="w-full md:w-1/2">Column 2</div>
</div>

// ❌ WRONG - Desktop first
<div className="flex flex-row md:flex-col gap-4">
  <div className="w-1/2 md:w-full">Column 1</div>
</div>
```

### 2. Touch Target Sizes

All interactive elements MUST be at least 44x44px on mobile:

```tsx
// ✅ CORRECT - Adequate touch target
<Button className="h-11 px-6">Submit</Button>

// ❌ WRONG - Too small for touch
<Button className="h-6 px-2 text-xs">Submit</Button>
```

### 3. Text Readability

Font sizes should scale appropriately:

```tsx
// ✅ CORRECT - Responsive text
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  Headline
</h1>

// ❌ WRONG - Fixed small text
<p className="text-xs">Important information</p>
```

### 4. Responsive Spacing

Use responsive padding and margins:

```tsx
// ✅ CORRECT
<div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">

// ❌ WRONG
<div className="px-2 py-2">
```

## Component Patterns

### Responsive Container

Use `ResponsiveContainer` for consistent page-level padding:

```tsx
import { ResponsiveContainer } from '@/components/responsive/responsive-container'

export default function Page() {
  return (
    <ResponsiveContainer maxWidth="xl">
      <h1>Page Content</h1>
    </ResponsiveContainer>
  )
}
```

### Responsive Grid

Use `ResponsiveGrid` for consistent grid layouts:

```tsx
import { ResponsiveGrid } from '@/components/responsive/responsive-grid'

export default function Dashboard() {
  return (
    <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md">
      <StatCard />
      <StatCard />
      <StatCard />
      <StatCard />
    </ResponsiveGrid>
  )
}
```

### Responsive Tables

Always wrap tables in `ResponsiveTable` for horizontal scroll on mobile:

```tsx
import { ResponsiveTable } from '@/components/responsive/responsive-table'

export default function DataTable() {
  return (
    <ResponsiveTable>
      <table className="min-w-full">
        <thead>...</thead>
        <tbody>...</tbody>
      </table>
    </ResponsiveTable>
  )
}
```

### Forms

Stack form inputs vertically on mobile:

```tsx
// ✅ CORRECT - Stacks on mobile, side-by-side on tablet+
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField name="city" />
  <FormField name="state" />
</div>

// ❌ WRONG - Forces 2 columns on mobile
<div className="grid grid-cols-2 gap-4">
  <FormField name="city" />
  <FormField name="state" />
</div>
```

### Buttons

Submit buttons should be full-width on mobile:

```tsx
// ✅ CORRECT
<Button type="submit" className="w-full md:w-auto">
  Submit
</Button>

// ❌ WRONG - Fixed width breaks on mobile
<Button type="submit" className="w-32">
  Submit
</Button>
```

## Image Optimization

### Next.js Image Component

Always use Next.js `<Image>` component for optimized, responsive images:

```tsx
import Image from 'next/image'

// ✅ CORRECT
<Image
  src="/dashboard-preview.jpg"
  alt="Dashboard Preview"
  width={1200}
  height={800}
  className="w-full h-auto"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// ❌ WRONG - No optimization
<img src="/dashboard-preview.jpg" alt="Dashboard" className="w-full" />
```

### Responsive Image Sizes

Define appropriate sizes for different viewports:

```tsx
<Image
  src="/hero-image.jpg"
  alt="Hero"
  width={1440}
  height={900}
  sizes="(max-width: 375px) 375px,
         (max-width: 768px) 768px,
         (max-width: 1024px) 1024px,
         1440px"
  priority // For above-the-fold images
/>
```

## Common Pitfalls

### 1. Hardcoded Widths

```tsx
// ❌ WRONG - Breaks on mobile
<div className="w-[1200px]">Content</div>

// ✅ CORRECT
<div className="w-full max-w-7xl mx-auto">Content</div>
```

### 2. Missing Overflow

```tsx
// ❌ WRONG - Table overflows on mobile
<table>...</table>

// ✅ CORRECT
<div className="overflow-x-auto">
  <table className="min-w-full">...</table>
</div>
```

### 3. Fixed Positioning Without Responsive Adjustments

```tsx
// ❌ WRONG - Overlaps on mobile
<div className="fixed right-8 bottom-8">Chat Widget</div>

// ✅ CORRECT
<div className="fixed right-2 bottom-2 sm:right-8 sm:bottom-8">
  Chat Widget
</div>
```

### 4. Ignoring Safe Areas (Mobile)

```tsx
// ✅ CORRECT - Accounts for notches/home indicators
<div className="pb-safe-bottom pt-safe-top">
  Content
</div>
```

## Testing Checklist

Before deploying, verify on ALL viewports:

- [ ] **375px (Mobile Small)** - iPhone SE
  - [ ] No horizontal scroll
  - [ ] All buttons min 44x44px
  - [ ] Text readable (min 14px body)
  - [ ] Forms stack vertically
  - [ ] Images load and scale

- [ ] **414px (Mobile Large)** - iPhone 14 Pro Max
  - [ ] Same as 375px
  - [ ] Layout improvements visible

- [ ] **768px (Tablet)** - iPad
  - [ ] Grid layouts expand (1 col → 2 cols)
  - [ ] Navigation shows more items
  - [ ] Sidebars appear (if applicable)

- [ ] **1024px (Desktop)** - Laptops
  - [ ] Full desktop layout
  - [ ] All features visible
  - [ ] Optimal spacing

- [ ] **1440px (Large Desktop)** - MacBook Pro
  - [ ] Content centered with max-width
  - [ ] No excessive white space
  - [ ] Images high quality

## Automated Testing

Run responsive tests before every commit:

```bash
# Visual regression testing
pnpm test:e2e __tests__/e2e/responsive-viewports.spec.ts

# Manual testing with Playwright UI
pnpm test:e2e:ui
```

## Tools & Resources

### Browser DevTools

- Chrome DevTools: Toggle device toolbar (Cmd+Shift+M)
- Responsive design mode
- Network throttling for slow connections

### Playwright Testing

```bash
# Run all responsive tests
pnpm test:e2e responsive-viewports

# Run specific viewport
pnpm test:e2e responsive-viewports --grep "mobile-small"

# UI mode for debugging
pnpm test:e2e:ui
```

### Accessibility

- Minimum font size: 14px for body text
- Line height: 1.5 for paragraphs
- Color contrast: 4.5:1 minimum (WCAG AA)

## Performance

### Image Optimization

- Use WebP/AVIF formats (Next.js handles automatically)
- Lazy load below-the-fold images
- Use proper `sizes` attribute
- Set explicit width/height to prevent layout shift

### CSS Optimization

- Avoid CSS-in-JS for responsive styles
- Use Tailwind's JIT mode (default in v3+)
- Minimize custom media queries

### JavaScript

- Avoid layout calculations in JavaScript
- Use CSS for responsive behavior when possible
- Consider `matchMedia` for complex responsive logic

## Future Enhancements

- [ ] Container queries for component-level responsiveness
- [ ] Fluid typography with `clamp()`
- [ ] Advanced image art direction with `<picture>`
- [ ] PWA installation prompts on mobile

---

**Last Updated**: 2025-11-21
**Version**: 1.0.0
**Maintained By**: Mobile Development Team
