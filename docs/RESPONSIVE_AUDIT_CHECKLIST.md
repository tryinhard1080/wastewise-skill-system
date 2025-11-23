# Responsive Design Audit Checklist

## Pre-Deployment Validation

Use this checklist before merging any UI changes to ensure responsive design compliance.

## 1. Viewport Testing

### Mobile Small (375px)

- [ ] No horizontal scrollbar
- [ ] All content visible without zooming
- [ ] Navigation accessible (hamburger menu if needed)
- [ ] Forms fully functional
- [ ] Buttons clickable without precision
- [ ] Images load and scale properly
- [ ] Text readable (min 14px body text)
- [ ] Touch targets min 44x44px
- [ ] Modal/dialogs fit on screen

### Mobile Large (414px)

- [ ] Same as Mobile Small
- [ ] Layout improvements visible
- [ ] No regressions from 375px

### Tablet (768px)

- [ ] Grid layouts expand (typically 2 columns)
- [ ] Navigation shows more items
- [ ] Sidebars visible (if applicable)
- [ ] Better use of horizontal space
- [ ] Forms side-by-side where appropriate

### Desktop (1024px)

- [ ] Full desktop layout active
- [ ] All navigation visible
- [ ] Optimal content width
- [ ] Sidebars/panels visible
- [ ] Hover states functional

### Large Desktop (1440px)

- [ ] Content centered with max-width
- [ ] No excessive white space
- [ ] Images high resolution
- [ ] Layout scales proportionally

## 2. Component-Level Checks

### Navigation

- [ ] Mobile: Hamburger menu or compact nav
- [ ] Tablet: Expanded nav or horizontal menu
- [ ] Desktop: Full navigation bar
- [ ] Sticky positioning works on all viewports
- [ ] Active states visible

### Forms

- [ ] Inputs full-width on mobile
- [ ] Labels above inputs on mobile
- [ ] Grid layouts on tablet+ (side-by-side)
- [ ] Validation messages visible
- [ ] Submit buttons full-width on mobile
- [ ] Dropdowns/selects functional on touch

### Tables

- [ ] Horizontal scroll on mobile
- [ ] Sticky headers (optional)
- [ ] Readable cell content
- [ ] Actions accessible on mobile
- [ ] Overflow indicators visible

### Cards/Grids

- [ ] Mobile: 1 column
- [ ] Tablet: 2-3 columns
- [ ] Desktop: 3-4 columns
- [ ] Consistent spacing
- [ ] No card overflow

### Modals/Dialogs

- [ ] Full-screen or near-full on mobile
- [ ] Centered on desktop
- [ ] Close button accessible
- [ ] Scrollable content if needed
- [ ] Backdrop visible

### Images

- [ ] Responsive sizing
- [ ] Proper aspect ratios maintained
- [ ] Lazy loading for below-fold
- [ ] Alt text present
- [ ] No layout shift during load

## 3. Accessibility Checks

### Touch Targets

- [ ] All buttons min 44x44px on mobile
- [ ] Links have adequate spacing
- [ ] Form controls easy to tap
- [ ] No accidental taps on adjacent elements

### Typography

- [ ] Body text min 14px on mobile
- [ ] Headings scale appropriately
- [ ] Line height min 1.5 for paragraphs
- [ ] Text doesn't overflow containers
- [ ] Proper text wrapping

### Color & Contrast

- [ ] 4.5:1 contrast for body text (WCAG AA)
- [ ] 3:1 contrast for large text
- [ ] Focus indicators visible
- [ ] No color-only information

### Keyboard Navigation

- [ ] Tab order logical
- [ ] Focus visible on all interactive elements
- [ ] Skip links present
- [ ] Dropdown menus keyboard accessible

## 4. Performance Checks

### Images

- [ ] WebP/AVIF formats used
- [ ] Proper `sizes` attribute
- [ ] Width/height specified
- [ ] Critical images use `priority`
- [ ] Lazy loading for below-fold

### CSS

- [ ] No unused Tailwind classes
- [ ] Minimal custom CSS
- [ ] No layout thrashing
- [ ] Efficient responsive breakpoints

### JavaScript

- [ ] No layout calculations in JS
- [ ] Debounced resize handlers
- [ ] Lazy load non-critical components
- [ ] Code splitting by route

## 5. Automated Tests

### Playwright Tests

```bash
# Run all responsive tests
pnpm test:e2e responsive-viewports

# Check specific viewport
pnpm test:e2e --grep "mobile-small"

# Visual regression
pnpm test:e2e --grep "screenshot"
```

### Expected Results

- [ ] All viewport tests pass
- [ ] No horizontal scroll detected
- [ ] No overflow elements found
- [ ] Touch targets validated
- [ ] Screenshots generated for visual review

## 6. Manual Testing

### Device Testing

- [ ] Tested on real iPhone (if available)
- [ ] Tested on real Android (if available)
- [ ] Tested on real iPad/tablet
- [ ] Tested on laptop (1024px-1440px)
- [ ] Tested on external monitor (>1440px)

### Browser Testing

- [ ] Chrome (mobile & desktop)
- [ ] Safari (mobile & desktop)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)

### Orientation Testing

- [ ] Portrait mode (mobile/tablet)
- [ ] Landscape mode (mobile/tablet)
- [ ] Layout adapts correctly

## 7. Common Issues Checklist

### Layout

- [ ] No fixed widths that break on mobile
- [ ] No hardcoded pixel widths > 375px
- [ ] Proper use of max-width
- [ ] Container padding consistent
- [ ] No horizontal scroll

### Forms

- [ ] Inputs stack on mobile
- [ ] Buttons full-width on mobile
- [ ] Adequate spacing between fields
- [ ] Validation messages visible
- [ ] No cut-off labels

### Navigation

- [ ] Mobile menu functional
- [ ] Desktop navigation doesn't wrap
- [ ] Active states visible
- [ ] Dropdowns work on touch
- [ ] Logo scales appropriately

### Content

- [ ] Text doesn't overflow
- [ ] Images scale properly
- [ ] Videos responsive
- [ ] Embeds (YouTube, etc.) responsive
- [ ] Code blocks scroll horizontally if needed

## 8. Regression Checks

After fixing responsive issues:

- [ ] Re-run automated tests
- [ ] Verify screenshots match expected
- [ ] Check no new issues introduced
- [ ] Validate on all viewports
- [ ] Test user flows end-to-end

## 9. Documentation

- [ ] Update RESPONSIVE_DESIGN.md if patterns changed
- [ ] Document any custom responsive utilities
- [ ] Note any viewport-specific behaviors
- [ ] Update test fixtures if needed

## 10. Sign-Off

Before merging to master:

- [ ] All automated tests pass
- [ ] Manual testing complete on 3+ devices
- [ ] Screenshots reviewed and approved
- [ ] No critical responsive issues
- [ ] Performance metrics acceptable
- [ ] Accessibility audit passed

---

## Quick Test Script

```bash
# 1. Run responsive audit
pnpm tsx scripts/audit-responsive.ts

# 2. Fix reported issues

# 3. Run automated tests
pnpm test:e2e responsive-viewports

# 4. Manual testing (open browser)
pnpm dev

# 5. Generate screenshots
pnpm test:e2e --grep "screenshot"

# 6. Review screenshots in __tests__/e2e/screenshots/
```

---

**Last Updated**: 2025-11-21
**Version**: 1.0.0
