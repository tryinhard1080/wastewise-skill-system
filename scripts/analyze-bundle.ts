#!/usr/bin/env tsx

/**
 * Bundle Size Analysis Script
 *
 * Analyzes Next.js build output to identify large bundles and optimization opportunities.
 *
 * Usage:
 *   pnpm build
 *   tsx scripts/analyze-bundle.ts
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface BundleInfo {
  name: string
  size: number
  sizeKB: number
  sizeMB: number
  type: 'page' | 'chunk' | 'static'
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function getBundleSize(filePath: string): number {
  try {
    const stats = statSync(filePath)
    return stats.size
  } catch {
    return 0
  }
}

function analyzeBuildDirectory(dir: string, type: 'page' | 'chunk' | 'static'): BundleInfo[] {
  const bundles: BundleInfo[] = []

  try {
    const files = readdirSync(dir)

    for (const file of files) {
      const filePath = join(dir, file)
      const stats = statSync(filePath)

      if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.css'))) {
        const size = stats.size
        bundles.push({
          name: file,
          size,
          sizeKB: size / 1024,
          sizeMB: size / (1024 * 1024),
          type,
        })
      } else if (stats.isDirectory()) {
        // Recursively analyze subdirectories
        const subBundles = analyzeBuildDirectory(filePath, type)
        bundles.push(...subBundles)
      }
    }
  } catch (error) {
    console.error(`Error analyzing directory ${dir}:`, error)
  }

  return bundles
}

function main() {
  console.log('📦 Analyzing Next.js Bundle Sizes')

  const buildDir = join(process.cwd(), '.next')
  const staticDir = join(buildDir, 'static')
  const chunksDir = join(staticDir, 'chunks')

  // Check if build exists
  try {
    statSync(buildDir)
  } catch {
    console.error('❌ Build directory not found. Run "pnpm build" first.')
    process.exit(1)
  }

  const allBundles: BundleInfo[] = []

  // Analyze pages
  console.log('\n🔍 Analyzing page bundles...')
  const pageBundles = analyzeBuildDirectory(join(staticDir, 'chunks', 'pages'), 'page')
  allBundles.push(...pageBundles)

  // Analyze chunks
  console.log('🔍 Analyzing chunk bundles...')
  const chunkBundles = analyzeBuildDirectory(chunksDir, 'chunk')
    .filter(b => !b.name.includes('pages/')) // Exclude page chunks already analyzed
  allBundles.push(...chunkBundles)

  // Sort by size (largest first)
  allBundles.sort((a, b) => b.size - a.size)

  // Calculate totals
  const totalSize = allBundles.reduce((sum, b) => sum + b.size, 0)
  const totalSizeMB = totalSize / (1024 * 1024)

  // Identify large bundles (>500KB)
  const largeBundles = allBundles.filter(b => b.sizeKB > 500)

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalBundles: allBundles.length,
    totalSize: formatBytes(totalSize),
    totalSizeMB: totalSizeMB.toFixed(2) + ' MB',
    largeBundles: largeBundles.length,
    largeThreshold: '500 KB',
    bundles: allBundles.map(b => ({
      name: b.name,
      size: formatBytes(b.size),
      sizeKB: b.sizeKB.toFixed(2) + ' KB',
      type: b.type,
      isLarge: b.sizeKB > 500,
    })),
    top10Largest: allBundles.slice(0, 10).map(b => ({
      name: b.name,
      size: formatBytes(b.size),
      type: b.type,
    })),
  }

  // Save report
  const reportsDir = join(process.cwd(), 'bundle-reports')
  mkdirSync(reportsDir, { recursive: true })
  const reportPath = join(reportsDir, 'bundle-analysis.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 BUNDLE SIZE SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Bundles: ${report.totalBundles}`)
  console.log(`Total Size: ${report.totalSize}`)
  console.log(`Large Bundles (>${report.largeThreshold}): ${report.largeBundles}`)
  console.log('\nTop 10 Largest Bundles:')
  report.top10Largest.forEach((b, i) => {
    console.log(`${i + 1}. ${b.name} - ${b.size} (${b.type})`)
  })
  console.log('\n' + '='.repeat(60))
  console.log(`Full report saved to: ${reportPath}`)
  console.log('='.repeat(60))

  // Check thresholds
  if (largeBundles.length > 0) {
    console.log(`\n⚠️  WARNING: ${largeBundles.length} bundle(s) exceed 500KB`)
    console.log('   Consider code splitting or lazy loading for these bundles')
  }

  if (totalSizeMB > 5) {
    console.log(`\n⚠️  WARNING: Total bundle size (${totalSizeMB.toFixed(2)} MB) exceeds 5MB`)
    console.log('   Consider optimizing dependencies and removing unused code')
  }

  if (largeBundles.length === 0 && totalSizeMB <= 5) {
    console.log('\n✅ PASSED: Bundle sizes are within acceptable limits')
    process.exit(0)
  } else {
    console.log('\n❌ FAILED: Bundle optimization needed')
    process.exit(1)
  }
}

main()
