#!/usr/bin/env tsx

/**
 * Responsive Design Audit Script
 *
 * Scans all TSX files for common responsive issues:
 * - Hardcoded widths without responsive classes
 * - Missing overflow-x-auto on wide content
 * - Fixed pixel sizes that should be responsive
 * - Missing mobile-first responsive variants
 */

import * as fs from 'fs'
import * as path from 'path'

interface ResponsiveIssue {
  file: string
  line: number
  issue: string
  code: string
  severity: 'error' | 'warning' | 'info'
}

const issues: ResponsiveIssue[] = []

// Patterns to detect
const HARDCODED_WIDTH_REGEX = /className="[^"]*\bw-\[(\d+)px\]/g
const FIXED_WIDTH_REGEX = /width:\s*["']?(\d+)px/g
const MIN_WIDTH_REGEX = /min-width:\s*["']?(\d+)px/g
const MAX_WIDTH_WITHOUT_RESPONSIVE = /className="[^"]*\bmax-w-\[(\d+)px\][^"]*"/g
const TABLE_WITHOUT_SCROLL = /<table[^>]*>/g
const FORM_GRID_COLS = /grid-cols-(\d+)(?!\s+(?:sm|md|lg|xl):)/g

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    const lineNumber = index + 1

    // Check for hardcoded widths in className
    const hardcodedWidths = line.matchAll(HARDCODED_WIDTH_REGEX)
    for (const match of hardcodedWidths) {
      const width = parseInt(match[1])
      if (width > 200) {
        issues.push({
          file: filePath,
          line: lineNumber,
          issue: `Hardcoded width w-[${width}px] should use responsive classes or max-w-*`,
          code: line.trim(),
          severity: 'warning',
        })
      }
    }

    // Check for fixed widths in style attributes
    const fixedWidths = line.matchAll(FIXED_WIDTH_REGEX)
    for (const match of fixedWidths) {
      const width = parseInt(match[1])
      if (width > 200 && !line.includes('responsive')) {
        issues.push({
          file: filePath,
          line: lineNumber,
          issue: `Fixed width ${width}px should be responsive or use CSS variables`,
          code: line.trim(),
          severity: 'warning',
        })
      }
    }

    // Check for min-width that might break mobile
    const minWidths = line.matchAll(MIN_WIDTH_REGEX)
    for (const match of minWidths) {
      const width = parseInt(match[1])
      if (width > 375) {
        issues.push({
          file: filePath,
          line: lineNumber,
          issue: `min-width: ${width}px might break on mobile (375px)`,
          code: line.trim(),
          severity: 'error',
        })
      }
    }

    // Check for tables without overflow wrapper
    if (TABLE_WITHOUT_SCROLL.test(line)) {
      const hasOverflow =
        line.includes('overflow-x-auto') ||
        line.includes('overflow-auto') ||
        line.includes('overflow-scroll')

      if (!hasOverflow) {
        issues.push({
          file: filePath,
          line: lineNumber,
          issue: 'Table should be wrapped in overflow-x-auto container for mobile',
          code: line.trim(),
          severity: 'warning',
        })
      }
    }

    // Check for grid-cols without responsive variants
    const gridCols = line.matchAll(FORM_GRID_COLS)
    for (const match of gridCols) {
      const cols = parseInt(match[1])
      if (cols > 1) {
        issues.push({
          file: filePath,
          line: lineNumber,
          issue: `grid-cols-${cols} should have responsive variants (e.g., grid-cols-1 md:grid-cols-${cols})`,
          code: line.trim(),
          severity: 'info',
        })
      }
    }

    // Check for common missing responsive patterns
    if (line.includes('flex-row') && !line.includes('flex-col')) {
      if (!line.match(/flex-col\s+(?:sm|md|lg):flex-row/)) {
        issues.push({
          file: filePath,
          line: lineNumber,
          issue: 'flex-row might need flex-col on mobile (flex-col sm:flex-row)',
          code: line.trim(),
          severity: 'info',
        })
      }
    }

    // Check for buttons without mobile width
    if (line.includes('<Button') || line.includes('<button')) {
      if (
        !line.includes('w-full') &&
        !line.includes('w-auto') &&
        !line.includes('className="') &&
        line.includes('type="submit"')
      ) {
        issues.push({
          file: filePath,
          line: lineNumber,
          issue: 'Submit buttons should be w-full on mobile',
          code: line.trim(),
          severity: 'info',
        })
      }
    }
  })
}

function scanDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (
        !entry.name.startsWith('.') &&
        entry.name !== 'node_modules' &&
        entry.name !== 'dist'
      ) {
        scanDirectory(fullPath)
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
      scanFile(fullPath)
    }
  }
}

// Main execution
console.log('Starting Responsive Design Audit...\n')

const dirsToScan = ['app', 'components']

for (const dir of dirsToScan) {
  if (fs.existsSync(dir)) {
    console.log(`Scanning ${dir}/...`)
    scanDirectory(dir)
  }
}

// Group issues by severity
const errors = issues.filter((i) => i.severity === 'error')
const warnings = issues.filter((i) => i.severity === 'warning')
const info = issues.filter((i) => i.severity === 'info')

// Print summary
console.log('\n=== RESPONSIVE DESIGN AUDIT RESULTS ===\n')

if (errors.length > 0) {
  console.log(`🔴 ERRORS (${errors.length}):`)
  errors.forEach((issue) => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`    ${issue.issue}`)
    console.log(`    ${issue.code.substring(0, 100)}...\n`)
  })
}

if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length}):`)
  warnings.slice(0, 10).forEach((issue) => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`    ${issue.issue}`)
    console.log(`    ${issue.code.substring(0, 100)}...\n`)
  })
  if (warnings.length > 10) {
    console.log(`  ... and ${warnings.length - 10} more warnings\n`)
  }
}

if (info.length > 0) {
  console.log(`ℹ️  INFO (${info.length}):`)
  info.slice(0, 5).forEach((issue) => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`    ${issue.issue}\n`)
  })
  if (info.length > 5) {
    console.log(`  ... and ${info.length - 5} more suggestions\n`)
  }
}

console.log('=== SUMMARY ===')
console.log(`Total Issues: ${issues.length}`)
console.log(`  Errors: ${errors.length}`)
console.log(`  Warnings: ${warnings.length}`)
console.log(`  Info: ${info.length}`)

// Write detailed report
const reportPath = 'responsive-audit-report.json'
fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2))
console.log(`\nDetailed report written to: ${reportPath}`)

// Exit code
process.exit(errors.length > 0 ? 1 : 0)
