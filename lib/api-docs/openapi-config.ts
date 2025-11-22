/**
 * OpenAPI 3.0 Configuration for WasteWise API
 *
 * This file defines the base OpenAPI specification including:
 * - API metadata
 * - Server configurations
 * - Security schemes
 * - Reusable components (schemas, responses, parameters)
 */

import type { OAS3Definition } from 'swagger-jsdoc'

const isDevelopment = process.env.NODE_ENV === 'development'
const baseUrl = isDevelopment
  ? 'http://localhost:3000'
  : process.env.NEXT_PUBLIC_APP_URL || 'https://wastewise.com'

export const openApiDefinition: OAS3Definition = {
  openapi: '3.0.0',
  info: {
    title: 'WasteWise API',
    version: '1.0.0',
    description: `
# WasteWise API Documentation

WasteWise is a waste management optimization SaaS platform for multifamily properties.

## Features
- **Async Job Processing**: Long-running analysis jobs with real-time progress tracking
- **Invoice Extraction**: Claude Vision AI-powered data extraction from waste invoices
- **Optimization Analysis**: Compactor utilization and cost optimization recommendations
- **Regulatory Research**: Automated ordinance research and compliance checking
- **Report Generation**: Excel workbooks and interactive HTML dashboards

## Authentication
All API endpoints require authentication via Supabase JWT tokens.

1. Obtain a token by calling \`POST /api/auth/login\`
2. Include the token in all subsequent requests: \`Authorization: Bearer <token>\`
3. Tokens expire after 1 hour - refresh using \`POST /api/auth/refresh\`

## Async Job Pattern
Many operations are asynchronous due to AI processing times (30s - 5 minutes):

1. **Start Job**: \`POST /api/analyze\` → Returns \`{ jobId }\`
2. **Poll Status**: \`GET /api/jobs/{jobId}\` → Check \`status\` and \`progress_percent\`
3. **Get Results**: When \`status === "completed"\`, access \`result_data\`

## Rate Limiting
- **Authenticated users**: 100 requests/minute
- **Admin users**: 500 requests/minute
- Rate limit headers are returned: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`

## Error Handling
All errors follow a consistent format:
\`\`\`json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { /* Additional context */ }
}
\`\`\`

## Pagination
List endpoints support pagination:
- \`page\` (default: 1)
- \`limit\` (default: 20, max: 100)
- Response includes: \`data\`, \`total\`, \`page\`, \`limit\`, \`totalPages\`
    `.trim(),
    contact: {
      name: 'WasteWise Support',
      email: 'support@wastewise.com'
    },
    license: {
      name: 'Proprietary',
      url: 'https://wastewise.com/terms'
    }
  },
  servers: [
    {
      url: baseUrl,
      description: isDevelopment ? 'Development server' : 'Production server'
    },
    ...(isDevelopment ? [{
      url: 'http://localhost:3000',
      description: 'Local development'
    }] : [])
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Projects',
      description: 'Project management operations'
    },
    {
      name: 'Files',
      description: 'File upload and management'
    },
    {
      name: 'Analysis',
      description: 'Waste analysis and optimization jobs'
    },
    {
      name: 'Jobs',
      description: 'Job status and results'
    },
    {
      name: 'Reports',
      description: 'Report generation and download'
    },
    {
      name: 'Admin',
      description: 'Administrative operations (admin-only)'
    },
    {
      name: 'Health',
      description: 'System health and monitoring'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT token obtained from /api/auth/login'
      }
    },
    schemas: {
      // Common schemas
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Human-readable error message'
          },
          code: {
            type: 'string',
            description: 'Machine-readable error code'
          },
          details: {
            type: 'object',
            description: 'Additional error context',
            additionalProperties: true
          }
        }
      },
      ValidationError: {
        type: 'object',
        required: ['error', 'code', 'details'],
        properties: {
          error: {
            type: 'string',
            example: 'Validation failed'
          },
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR'
          },
          details: {
            type: 'object',
            properties: {
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    message: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        required: ['data', 'total', 'page', 'limit', 'totalPages'],
        properties: {
          data: {
            type: 'array',
            items: {}
          },
          total: {
            type: 'integer',
            description: 'Total number of items'
          },
          page: {
            type: 'integer',
            description: 'Current page number'
          },
          limit: {
            type: 'integer',
            description: 'Items per page'
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages'
          }
        }
      },

      // User schemas
      User: {
        type: 'object',
        required: ['id', 'email', 'role', 'created_at'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'User ID'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          role: {
            type: 'string',
            enum: ['admin', 'user'],
            description: 'User role'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          }
        }
      },

      // Project schemas
      Project: {
        type: 'object',
        required: ['id', 'name', 'property_type', 'units', 'equipment_type', 'status'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          user_id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: 'Riverside Gardens Apartments'
          },
          property_type: {
            type: 'string',
            enum: ['Garden-Style', 'Mid-Rise', 'High-Rise'],
            description: 'Property type'
          },
          units: {
            type: 'integer',
            minimum: 1,
            example: 250,
            description: 'Number of units in property'
          },
          equipment_type: {
            type: 'string',
            enum: ['COMPACTOR', 'DUMPSTER', 'BOTH'],
            description: 'Waste equipment type'
          },
          location: {
            type: 'object',
            properties: {
              city: { type: 'string' },
              state: { type: 'string' },
              zip: { type: 'string' }
            }
          },
          status: {
            type: 'string',
            enum: ['draft', 'processing', 'completed', 'failed'],
            description: 'Project status'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          updated_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },

      // Job schemas
      AnalysisJob: {
        type: 'object',
        required: ['id', 'status', 'job_type', 'created_at'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Job ID'
          },
          user_id: {
            type: 'string',
            format: 'uuid'
          },
          project_id: {
            type: 'string',
            format: 'uuid'
          },
          job_type: {
            type: 'string',
            enum: ['complete_analysis', 'invoice_extraction', 'contract_extraction', 'regulatory_research'],
            description: 'Type of analysis job'
          },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed'],
            description: 'Current job status'
          },
          progress_percent: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'Completion percentage'
          },
          current_step: {
            type: 'string',
            description: 'Current processing step',
            example: 'Extracting invoice data'
          },
          started_at: {
            type: 'string',
            format: 'date-time',
            description: 'Processing start time'
          },
          completed_at: {
            type: 'string',
            format: 'date-time',
            description: 'Processing completion time'
          },
          error_message: {
            type: 'string',
            description: 'Error message if job failed'
          },
          error_code: {
            type: 'string',
            description: 'Error code if job failed'
          },
          result_data: {
            type: 'object',
            description: 'Analysis results (available when status is completed)',
            additionalProperties: true
          },
          ai_usage: {
            type: 'object',
            description: 'AI token usage and cost tracking',
            properties: {
              input_tokens: { type: 'integer' },
              output_tokens: { type: 'integer' },
              total_cost: { type: 'number' }
            }
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },

      // File schemas
      ProjectFile: {
        type: 'object',
        required: ['id', 'project_id', 'file_name', 'file_type', 'storage_path'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          project_id: {
            type: 'string',
            format: 'uuid'
          },
          file_name: {
            type: 'string',
            example: 'invoice-january-2025.pdf'
          },
          file_type: {
            type: 'string',
            enum: ['invoice', 'contract', 'haul_log'],
            description: 'Type of document'
          },
          storage_path: {
            type: 'string',
            description: 'Supabase storage path'
          },
          file_size: {
            type: 'integer',
            description: 'File size in bytes'
          },
          mime_type: {
            type: 'string',
            example: 'application/pdf'
          },
          uploaded_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },

      // System health schemas
      SystemHealth: {
        type: 'object',
        required: ['status', 'timestamp'],
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'degraded', 'unhealthy']
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          services: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  latency_ms: { type: 'number' }
                }
              },
              storage: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  latency_ms: { type: 'number' }
                }
              },
              ai: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  latency_ms: { type: 'number' }
                }
              }
            }
          },
          version: {
            type: 'string',
            example: '1.0.0'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Authentication required',
              code: 'UNAUTHORIZED'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Insufficient permissions',
              code: 'FORBIDDEN'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Resource not found',
              code: 'NOT_FOUND'
            }
          }
        }
      },
      ValidationError: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationError'
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                limit: 100,
                reset: '2025-01-15T12:00:00Z'
              }
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Internal server error',
              code: 'INTERNAL_ERROR'
            }
          }
        }
      }
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number (1-indexed)',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Items per page',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        }
      },
      ProjectIdParam: {
        name: 'id',
        in: 'path',
        description: 'Project ID',
        required: true,
        schema: {
          type: 'string',
          format: 'uuid'
        }
      },
      JobIdParam: {
        name: 'id',
        in: 'path',
        description: 'Job ID',
        required: true,
        schema: {
          type: 'string',
          format: 'uuid'
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ]
}

export default openApiDefinition
