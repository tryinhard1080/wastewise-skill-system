#!/usr/bin/env tsx

/**
 * Validate OpenAPI Specification
 *
 * Validates the generated OpenAPI spec for:
 * - OpenAPI 3.0 compliance
 * - Required fields
 * - Schema consistency
 * - Security definitions
 * - Example validity
 *
 * Usage:
 *   pnpm validate:openapi
 */

import swaggerJsdoc from 'swagger-jsdoc'
import { openApiDefinition } from '../lib/api-docs/openapi-config'

const options: swaggerJsdoc.Options = {
  definition: openApiDefinition,
  apis: [
    './app/api/**/*.ts',
    './lib/api-docs/examples/**/*.ts'
  ]
}

interface ValidationError {
  type: 'error' | 'warning'
  message: string
  location?: string
}

async function validateOpenAPI() {
  console.log('🔍 Validating OpenAPI specification...\n')

  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  try {
    const spec = swaggerJsdoc(options)

    // 1. Validate OpenAPI version
    if (spec.openapi !== '3.0.0') {
      errors.push({
        type: 'error',
        message: `Invalid OpenAPI version: ${spec.openapi} (expected 3.0.0)`
      })
    } else {
      console.log('✅ OpenAPI version: 3.0.0')
    }

    // 2. Validate info section
    if (!spec.info?.title) {
      errors.push({
        type: 'error',
        message: 'Missing required field: info.title'
      })
    } else {
      console.log(`✅ API Title: ${spec.info.title}`)
    }

    if (!spec.info?.version) {
      errors.push({
        type: 'error',
        message: 'Missing required field: info.version'
      })
    } else {
      console.log(`✅ API Version: ${spec.info.version}`)
    }

    // 3. Validate servers
    if (!spec.servers || spec.servers.length === 0) {
      errors.push({
        type: 'error',
        message: 'At least one server must be defined'
      })
    } else {
      console.log(`✅ Servers: ${spec.servers.length} defined`)
    }

    // 4. Validate paths
    const paths = Object.keys(spec.paths || {})
    if (paths.length === 0) {
      errors.push({
        type: 'error',
        message: 'No API paths defined'
      })
    } else {
      console.log(`✅ Paths: ${paths.length} endpoints documented`)

      // Validate each path
      let totalOperations = 0
      paths.forEach((path) => {
        const pathItem = spec.paths[path]
        const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']

        methods.forEach((method) => {
          if (pathItem[method]) {
            totalOperations++
            const operation = pathItem[method]

            // Check for summary
            if (!operation.summary) {
              warnings.push({
                type: 'warning',
                message: `Missing summary for ${method.toUpperCase()} ${path}`,
                location: path
              })
            }

            // Check for tags
            if (!operation.tags || operation.tags.length === 0) {
              warnings.push({
                type: 'warning',
                message: `Missing tags for ${method.toUpperCase()} ${path}`,
                location: path
              })
            }

            // Check for responses
            if (!operation.responses || Object.keys(operation.responses).length === 0) {
              errors.push({
                type: 'error',
                message: `No responses defined for ${method.toUpperCase()} ${path}`,
                location: path
              })
            } else {
              // Check for 200/201 success response
              const hasSuccess = operation.responses['200'] || operation.responses['201']
              if (!hasSuccess) {
                warnings.push({
                  type: 'warning',
                  message: `No success response (200/201) for ${method.toUpperCase()} ${path}`,
                  location: path
                })
              }
            }

            // Check for security if not explicitly public
            if (!operation.security && spec.security) {
              // If global security is defined but operation doesn't override
              // This is OK - it inherits global security
            }
          }
        })
      })

      console.log(`✅ Operations: ${totalOperations} total`)
    }

    // 5. Validate components
    if (spec.components) {
      const schemas = Object.keys(spec.components.schemas || {})
      const securitySchemes = Object.keys(spec.components.securitySchemes || {})
      const responses = Object.keys(spec.components.responses || {})
      const parameters = Object.keys(spec.components.parameters || {})

      console.log(`✅ Schemas: ${schemas.length} defined`)
      console.log(`✅ Security Schemes: ${securitySchemes.length} defined`)
      console.log(`✅ Reusable Responses: ${responses.length} defined`)
      console.log(`✅ Reusable Parameters: ${parameters.length} defined`)

      // Validate security schemes are used
      if (securitySchemes.length > 0 && !spec.security) {
        warnings.push({
          type: 'warning',
          message: 'Security schemes defined but no global security applied'
        })
      }
    }

    // 6. Validate tags
    if (!spec.tags || spec.tags.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'No tags defined - consider adding tags for better organization'
      })
    } else {
      console.log(`✅ Tags: ${spec.tags.length} defined`)
    }

    // 7. Check for $ref consistency
    const allRefs = JSON.stringify(spec).match(/"\$ref":"[^"]+"/g) || []
    const uniqueRefs = new Set(allRefs)
    console.log(`✅ References: ${uniqueRefs.size} unique $ref found`)

    // Validate each $ref
    uniqueRefs.forEach((ref) => {
      const refPath = ref.match(/"\$ref":"([^"]+)"/)?.[1]
      if (refPath?.startsWith('#/components/')) {
        const parts = refPath.split('/')
        const category = parts[2] // schemas, responses, parameters, etc.
        const name = parts[3]

        if (!spec.components?.[category]?.[name]) {
          errors.push({
            type: 'error',
            message: `Invalid reference: ${refPath} does not exist`,
            location: refPath
          })
        }
      }
    })

    // Print results
    console.log('\n' + '='.repeat(60))

    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n✨ Validation passed with no errors or warnings!\n')
      return true
    }

    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} Error(s) Found:\n`)
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.message}`)
        if (err.location) {
          console.log(`   Location: ${err.location}`)
        }
      })
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} Warning(s) Found:\n`)
      warnings.forEach((warn, i) => {
        console.log(`${i + 1}. ${warn.message}`)
        if (warn.location) {
          console.log(`   Location: ${warn.location}`)
        }
      })
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // Exit with error code if there are errors
    if (errors.length > 0) {
      console.log('❌ Validation failed\n')
      process.exit(1)
    } else {
      console.log('✅ Validation passed (with warnings)\n')
      return true
    }
  } catch (error) {
    console.error('\n❌ Error during validation:', error)
    process.exit(1)
  }
}

// Run validation
validateOpenAPI()
