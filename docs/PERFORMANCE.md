# Performance Optimization Guide

## Overview

This document outlines the performance targets, testing procedures, and optimization strategies for the WasteWise application.

## Performance Targets

### Page Load Performance

- **Lighthouse Performance Score**: ≥90 on all pages
- **Page Load Time (p95)**: <2 seconds
- **First Contentful Paint (FCP)**: <1.5s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Total Blocking Time (TBT)**: <300ms
- **Cumulative Layout Shift (CLS)**: <0.1

### Load Handling

- **Concurrent Users**: Support 100 concurrent users
- **Error Rate**: <0.1% under load
- **API Response Time (p95)**: <2000ms

### Bundle Size

- **Total Bundle Size**: <5MB
- **Individual Chunks**: <500KB
- **Initial Page Load**: <200KB (gzipped)

## Testing Tools

### 1. Lighthouse Audits

```bash
# Run Lighthouse audit on all key pages
pnpm perf:lighthouse

# View reports
open lighthouse-reports/summary.json
open lighthouse-reports/landing-page.html
```

**What it tests:**

- Performance score
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)
- Speed Index
- Time to Interactive (TTI)

### 2. Load Testing

```bash
# Run load tests with autocannon
pnpm perf:load

# View results
open load-test-reports/summary.json
```

**Test scenarios:**

- Light load (10 concurrent users, 10s)
- Medium load (50 concurrent users, 20s)
- Heavy load (100 concurrent users, 30s)

**Metrics tracked:**

- Total requests handled
- Average latency
- p95/p99 latency
- Error rate
- Throughput (req/s)

### 3. Bundle Analysis

```bash
# Build application first
pnpm build

# Analyze bundle sizes
pnpm perf:bundle

# View report
open bundle-reports/bundle-analysis.json
```

**What it analyzes:**

- Total bundle size
- Individual chunk sizes
- Largest bundles
- Code splitting opportunities

### 4. Complete Performance Suite

```bash
# Run all performance tests
pnpm perf:all
```

## Optimization Strategies

### Frontend Optimizations

#### 1. Code Splitting

```typescript
// Use dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Disable SSR if not needed
})

// Route-based code splitting (automatic in Next.js)
// Each page in app/ directory is automatically code-split
```

#### 2. Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/images/hero.jpg"
  alt="Hero image"
  width={800}
  height={600}
  priority // For above-the-fold images
  placeholder="blur" // Optional blur-up effect
/>
```

**Current issue**: `images.unoptimized: true` in next.config.mjs (line 6)

- **Impact**: Missing automatic image optimization, WebP conversion, responsive images
- **Fix**: Remove or set to `false` and configure image domains

#### 3. Font Optimization

```typescript
// Use next/font for automatic font optimization
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Prevent layout shift
  preload: true,
});
```

#### 4. Lazy Loading

```typescript
// Lazy load components below the fold
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@/components/Footer"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
```

#### 5. Bundle Optimization

```javascript
// next.config.mjs
const nextConfig = {
  // Enable SWC minification (default in Next.js 14)
  swcMinify: true,

  // Optimize packages
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
  },

  // Remove unused code
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
  },
};
```

### Backend Optimizations

#### 1. Database Indexing

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_invoice_data_project_id ON invoice_data(project_id);
CREATE INDEX idx_haul_log_project_id ON haul_log(project_id);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status, created_at);
```

#### 2. API Response Caching

```typescript
// Use Next.js cache helpers
import { unstable_cache } from "next/cache";

const getCachedProjectData = unstable_cache(
  async (projectId: string) => {
    return await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
  },
  ["project-data"],
  { revalidate: 60 }, // Cache for 60 seconds
);
```

#### 3. Selective Field Queries

```typescript
// Only select needed fields
const { data } = await supabase
  .from("projects")
  .select("id, name, property_type") // Not 'select('*')'
  .eq("user_id", userId);
```

#### 4. Connection Pooling

Already configured in Supabase client (connection pooling enabled by default)

#### 5. Edge Functions (Future)

Consider moving time-sensitive operations to Supabase Edge Functions for lower latency

### Caching Strategy

#### 1. Static Generation (ISR)

```typescript
// Use ISR for semi-static pages
export const revalidate = 3600 // Revalidate every hour

export default async function Page() {
  const data = await fetchData()
  return <div>{/* render */}</div>
}
```

#### 2. Client-Side Caching (SWR)

```typescript
import useSWR from "swr";

function Dashboard() {
  const { data, error } = useSWR("/api/projects", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000, // 30 seconds
  });
}
```

#### 3. HTTP Cache Headers

```typescript
// API routes
export async function GET(request: Request) {
  const data = await fetchData();

  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
```

## Performance Monitoring

### Development

```bash
# Monitor bundle size during development
pnpm build && pnpm perf:bundle
```

### CI/CD

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    branches: [master]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Build application
        run: pnpm build

      - name: Run bundle analysis
        run: pnpm perf:bundle

      - name: Start dev server
        run: pnpm dev &
        env:
          CI: true

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse audits
        run: pnpm perf:lighthouse

      - name: Run load tests
        run: pnpm perf:load

      - name: Upload reports
        uses: actions/upload-artifact@v4
        with:
          name: performance-reports
          path: |
            lighthouse-reports/
            load-test-reports/
            bundle-reports/
```

### Production

- Integrate with Sentry for real-time performance monitoring
- Use Vercel Analytics (already configured via `@vercel/analytics`)
- Set up alerts for performance degradation

## Performance Budget

### Enforcement

Create `.lighthouserc.json` to enforce performance budget:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["warn", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }]
      }
    }
  }
}
```

## Optimization Checklist

### Pre-Deployment

- [ ] Run `pnpm build` successfully
- [ ] Bundle analysis shows <5MB total
- [ ] No individual chunks >500KB
- [ ] Lighthouse score ≥90 on all pages
- [ ] Load test passes (100 concurrent users, <2s p95, <0.1% errors)
- [ ] No console errors or warnings
- [ ] Images optimized (WebP, responsive sizes)
- [ ] Fonts optimized (preload, font-display: swap)
- [ ] Critical CSS inlined
- [ ] Database queries optimized with indexes
- [ ] API routes use appropriate caching
- [ ] Sentry performance monitoring configured

### Post-Deployment

- [ ] Monitor Core Web Vitals in production
- [ ] Set up performance alerts
- [ ] Review real user monitoring (RUM) data
- [ ] Identify slow API endpoints
- [ ] Optimize based on actual usage patterns

## Common Performance Issues

### Issue: Large Bundle Size

**Symptoms:**

- Total bundle >5MB
- Individual chunks >500KB
- Slow initial page load

**Solutions:**

1. Analyze bundle with `pnpm perf:bundle`
2. Identify large dependencies
3. Use dynamic imports for heavy components
4. Consider lighter alternatives (e.g., date-fns → date-fns-tz)
5. Remove unused dependencies

### Issue: Slow API Responses

**Symptoms:**

- API routes taking >2s
- Timeouts under load
- Database connection errors

**Solutions:**

1. Add database indexes
2. Optimize Supabase queries (select only needed fields)
3. Implement caching
4. Use RPC functions for complex queries
5. Consider pagination for large datasets

### Issue: Poor Lighthouse Score

**Symptoms:**

- Performance score <90
- High LCP or TBT
- Layout shifts (high CLS)

**Solutions:**

1. Optimize images (use Next.js Image)
2. Preload critical fonts
3. Minimize JavaScript execution
4. Use code splitting
5. Eliminate render-blocking resources

### Issue: High Error Rate Under Load

**Symptoms:**

- Errors >0.1% at 100 concurrent users
- Database connection timeouts
- Memory leaks

**Solutions:**

1. Implement proper error handling
2. Add retry logic for transient failures
3. Optimize background worker (reduce memory usage)
4. Scale database connections (Supabase pooling)
5. Add rate limiting (already configured with Upstash)

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Supabase Performance Guide](https://supabase.com/docs/guides/database/performance)

---

**Last Updated**: 2025-11-21
**Maintained By**: Performance Testing Team
