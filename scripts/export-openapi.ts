#!/usr/bin/env tsx

/**
 * Export OpenAPI Specification
 *
 * Usage:
 *   pnpm export:openapi           # Export both JSON and YAML
 *   pnpm export:openapi --json    # Export JSON only
 *   pnpm export:openapi --yaml    # Export YAML only
 *
 * Output:
 *   docs/api/openapi.json
 *   docs/api/openapi.yaml
 */

import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import swaggerJsdoc from 'swagger-jsdoc'
import { openApiDefinition } from '../lib/api-docs/openapi-config'

const options: swaggerJsdoc.Options = {
  definition: openApiDefinition,
  apis: [
    './app/api/**/*.ts',
    './lib/api-docs/examples/**/*.ts'
  ]
}

async function exportOpenAPI() {
  console.log('🚀 Generating OpenAPI specification...\n')

  try {
    // Generate the spec
    const spec = swaggerJsdoc(options)

    // Create output directory
    const outputDir = path.join(process.cwd(), 'docs', 'api')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const args = process.argv.slice(2)
    const exportJson = args.includes('--json') || args.length === 0
    const exportYaml = args.includes('--yaml') || args.length === 0

    // Export JSON
    if (exportJson) {
      const jsonPath = path.join(outputDir, 'openapi.json')
      fs.writeFileSync(jsonPath, JSON.stringify(spec, null, 2), 'utf-8')
      const jsonSize = (fs.statSync(jsonPath).size / 1024).toFixed(2)
      console.log(`✅ JSON exported: ${jsonPath} (${jsonSize} KB)`)
    }

    // Export YAML
    if (exportYaml) {
      const yamlPath = path.join(outputDir, 'openapi.yaml')
      const yamlContent = yaml.dump(spec, {
        lineWidth: 120,
        noRefs: false,
        sortKeys: false
      })
      fs.writeFileSync(yamlPath, yamlContent, 'utf-8')
      const yamlSize = (fs.statSync(yamlPath).size / 1024).toFixed(2)
      console.log(`✅ YAML exported: ${yamlPath} (${yamlSize} KB)`)
    }

    // Statistics
    console.log('\n📊 Specification Statistics:')
    console.log(`   Title: ${spec.info.title}`)
    console.log(`   Version: ${spec.info.version}`)
    console.log(`   Paths: ${Object.keys(spec.paths || {}).length}`)
    console.log(`   Schemas: ${Object.keys(spec.components?.schemas || {}).length}`)
    console.log(`   Security Schemes: ${Object.keys(spec.components?.securitySchemes || {}).length}`)
    console.log(`   Tags: ${spec.tags?.length || 0}`)

    // Validate paths
    const paths = Object.keys(spec.paths || {})
    if (paths.length === 0) {
      console.warn('\n⚠️  Warning: No API paths found in specification!')
      console.warn('   Make sure JSDoc annotations are present in route files.')
    } else {
      console.log('\n📝 Documented Endpoints:')
      paths.forEach((path) => {
        const methods = Object.keys(spec.paths[path])
          .filter((m) => ['get', 'post', 'put', 'patch', 'delete'].includes(m))
          .map((m) => m.toUpperCase())
          .join(', ')
        console.log(`   ${methods.padEnd(20)} ${path}`)
      })
    }

    console.log('\n✨ Export complete!\n')
  } catch (error) {
    console.error('❌ Error generating OpenAPI spec:', error)
    process.exit(1)
  }
}

// Run the export
exportOpenAPI()
