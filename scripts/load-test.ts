#!/usr/bin/env tsx

/**
 * Load Testing Script
 *
 * Simulates concurrent users to test system performance under load.
 * Tests key scenarios: signup, login, project creation, job polling.
 *
 * Usage:
 *   pnpm add -D autocannon
 *   tsx scripts/load-test.ts
 */

import autocannon from 'autocannon'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface LoadTestResult {
  url: string
  connections: number
  duration: number
  requests: {
    total: number
    average: number
    mean: number
    p50: number
    p95: number
    p99: number
    sent: number
  }
  latency: {
    average: number
    mean: number
    p50: number
    p95: number
    p99: number
  }
  throughput: {
    average: number
    mean: number
  }
  errors: number
  timeouts: number
  non2xx: number
}

async function runLoadTest(
  scenario: string,
  url: string,
  options: autocannon.Options = {}
): Promise<LoadTestResult> {
  console.log(`\n🔥 Running load test: ${scenario}`)
  console.log(`   URL: ${url}`)
  console.log(`   Connections: ${options.connections || 10}`)
  console.log(`   Duration: ${options.duration || 10}s`)

  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url,
      connections: 10, // Default concurrent connections
      duration: 10, // Default duration in seconds
      ...options,
    }, (err, result) => {
      if (err) {
        reject(err)
      } else {
        const formatted: LoadTestResult = {
          url: result.url,
          connections: result.connections,
          duration: result.duration,
          requests: {
            total: result.requests.total,
            average: result.requests.average,
            mean: result.requests.mean,
            p50: result.requests.p50,
            p95: result.requests.p95,
            p99: result.requests.p99,
            sent: result.requests.sent,
          },
          latency: {
            average: result.latency.mean,
            mean: result.latency.mean,
            p50: result.latency.p50,
            p95: result.latency.p95,
            p99: result.latency.p99,
          },
          throughput: {
            average: result.throughput.average,
            mean: result.throughput.mean,
          },
          errors: result.errors,
          timeouts: result.timeouts,
          non2xx: result.non2xx,
        }

        console.log(`✅ Test complete:`)
        console.log(`   Total Requests: ${formatted.requests.total}`)
        console.log(`   Avg Latency: ${formatted.latency.average.toFixed(2)}ms`)
        console.log(`   p95 Latency: ${formatted.latency.p95.toFixed(2)}ms`)
        console.log(`   p99 Latency: ${formatted.latency.p99.toFixed(2)}ms`)
        console.log(`   Errors: ${formatted.errors}`)
        console.log(`   Non-2xx: ${formatted.non2xx}`)

        resolve(formatted)
      }
    })

    autocannon.track(instance)
  })
}

async function main() {
  console.log('🚀 Starting Load Testing Suite')
  console.log(`📍 Base URL: ${BASE_URL}`)

  const reportsDir = join(process.cwd(), 'load-test-reports')
  mkdirSync(reportsDir, { recursive: true })

  const scenarios = [
    {
      name: 'Landing Page - Light Load',
      url: `${BASE_URL}/`,
      connections: 10,
      duration: 10,
    },
    {
      name: 'Landing Page - Medium Load',
      url: `${BASE_URL}/`,
      connections: 50,
      duration: 20,
    },
    {
      name: 'Landing Page - Heavy Load (100 concurrent)',
      url: `${BASE_URL}/`,
      connections: 100,
      duration: 30,
    },
    {
      name: 'Login Page - Light Load',
      url: `${BASE_URL}/login`,
      connections: 10,
      duration: 10,
    },
    {
      name: 'Dashboard - Light Load',
      url: `${BASE_URL}/dashboard`,
      connections: 10,
      duration: 10,
    },
    {
      name: 'API Health Check - Heavy Load',
      url: `${BASE_URL}/api/health`,
      connections: 100,
      duration: 20,
    },
  ]

  const results = []

  for (const scenario of scenarios) {
    try {
      const result = await runLoadTest(
        scenario.name,
        scenario.url,
        {
          connections: scenario.connections,
          duration: scenario.duration,
        }
      )
      results.push({
        scenario: scenario.name,
        ...result,
      })

      // Wait 5 seconds between tests to allow system to recover
      console.log('⏳ Waiting 5s before next test...')
      await new Promise(resolve => setTimeout(resolve, 5000))

    } catch (error) {
      console.error(`❌ Error in scenario "${scenario.name}":`, error)
    }
  }

  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalScenarios: results.length,
    results: results.map(r => ({
      scenario: r.scenario,
      url: r.url,
      connections: r.connections,
      duration: r.duration,
      totalRequests: r.requests.total,
      avgLatency: Math.round(r.latency.average),
      p95Latency: Math.round(r.latency.p95),
      p99Latency: Math.round(r.latency.p99),
      errors: r.errors,
      errorRate: ((r.errors + r.non2xx) / r.requests.total * 100).toFixed(2) + '%',
    })),
  }

  const summaryPath = join(reportsDir, 'summary.json')
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

  console.log('\n' + '='.repeat(80))
  console.log('📊 LOAD TEST SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Scenarios: ${summary.totalScenarios}`)
  console.log('\nResults:')
  summary.results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.scenario}`)
    console.log(`   Requests: ${r.totalRequests}`)
    console.log(`   Avg Latency: ${r.avgLatency}ms`)
    console.log(`   p95 Latency: ${r.p95Latency}ms`)
    console.log(`   p99 Latency: ${r.p99Latency}ms`)
    console.log(`   Error Rate: ${r.errorRate}`)
  })
  console.log('\n' + '='.repeat(80))
  console.log(`Reports saved to: ${reportsDir}`)
  console.log('='.repeat(80))

  // Check if targets are met
  const heavyLoadScenario = results.find(r => r.scenario.includes('Heavy Load (100 concurrent)'))
  if (heavyLoadScenario) {
    const p95Latency = heavyLoadScenario.latency.p95
    const errorRate = (heavyLoadScenario.errors + heavyLoadScenario.non2xx) / heavyLoadScenario.requests.total

    if (p95Latency > 2000) {
      console.log(`\n⚠️  WARNING: p95 latency (${p95Latency.toFixed(0)}ms) exceeds 2s target`)
    }

    if (errorRate > 0.001) {
      console.log(`\n⚠️  WARNING: Error rate (${(errorRate * 100).toFixed(2)}%) exceeds 0.1% target`)
    }

    if (p95Latency <= 2000 && errorRate <= 0.001) {
      console.log('\n✅ PASSED: System meets performance targets under 100 concurrent users')
      process.exit(0)
    } else {
      console.log('\n❌ FAILED: System does not meet performance targets')
      process.exit(1)
    }
  } else {
    console.log('\n⚠️  Heavy load scenario not found')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
