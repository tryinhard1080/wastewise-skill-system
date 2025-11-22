# WasteWise API Documentation

Complete OpenAPI 3.0 documentation for the WasteWise waste management optimization API.

## Quick Links

- **Interactive Documentation**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI Spec (JSON)**: [openapi.json](./openapi.json)
- **OpenAPI Spec (YAML)**: [openapi.yaml](./openapi.yaml)
- **API Endpoint**: [http://localhost:3000/api/openapi.json](http://localhost:3000/api/openapi.json)

## Overview

WasteWise provides a comprehensive API for waste management optimization:

- **Invoice Extraction**: AI-powered data extraction from waste invoices using Claude Vision
- **Optimization Analysis**: Compactor utilization and cost optimization recommendations
- **Regulatory Research**: Automated ordinance research and compliance checking
- **Report Generation**: Excel workbooks and interactive HTML dashboards
- **Async Job Processing**: Background processing for long-running AI operations

## Authentication

All API endpoints require authentication via Supabase JWT tokens.

### Getting a Token

1. **Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

2. **Use Token in Requests**:
```bash
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer <your_token>"
```

3. **Token Refresh** (tokens expire after 1 hour):
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<your_refresh_token>"
  }'
```

## Async Job Pattern

Most analysis operations are asynchronous due to AI processing times (30 seconds to 5 minutes):

### 1. Create Job

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "d82e2314-7ccf-404e-a133-0caebb154c7e",
    "jobType": "complete_analysis"
  }'
```

Response:
```json
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "message": "Analysis job created. Poll /api/jobs/a1b2c3d4-e5f6-7890-abcd-ef1234567890 for status updates."
}
```

### 2. Poll Status (every 2 seconds)

```bash
curl http://localhost:3000/api/jobs/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer <token>"
```

Response (processing):
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "processing",
  "progress_percent": 45,
  "current_step": "Extracting invoice data (3/6 files)",
  "created_at": "2025-01-15T10:00:00Z",
  "started_at": "2025-01-15T10:01:00Z"
}
```

### 3. Get Results (when completed)

Response (completed):
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "completed",
  "progress_percent": 100,
  "current_step": "Completed",
  "result_data": {
    "yardsPerDoor": 0.12,
    "costPerDoor": 18.50,
    "optimizations": [
      {
        "type": "compactor_monitors",
        "description": "Install compactor fullness monitors",
        "savings": 1200,
        "payback_months": 8
      }
    ]
  },
  "ai_usage": {
    "input_tokens": 15000,
    "output_tokens": 3000,
    "total_cost": 0.45
  },
  "created_at": "2025-01-15T10:00:00Z",
  "started_at": "2025-01-15T10:01:00Z",
  "completed_at": "2025-01-15T10:04:30Z"
}
```

## Rate Limiting

- **Authenticated Users**: 100 requests per minute
- **Admin Users**: 500 requests per minute

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1736942400
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions for this operation |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data (see details) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Pagination

List endpoints support pagination via query parameters:

- `page` (default: 1) - Page number (1-indexed)
- `limit` (default: 20, max: 100) - Items per page

### Example

```bash
curl "http://localhost:3000/api/jobs?page=2&limit=50" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "data": [...],
  "total": 150,
  "page": 2,
  "limit": 50,
  "totalPages": 3
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PATCH /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Analysis
- `POST /api/analyze` - Create analysis job
- `POST /api/projects/{id}/analyze` - Analyze specific project

### Jobs
- `GET /api/jobs` - List user's jobs
- `GET /api/jobs/{id}` - Get job status

### Health
- `GET /api/health` - API health check
- `GET /api/health/worker` - Worker health check

### Admin (Admin Only)
- `GET /api/admin/jobs` - List all jobs
- `GET /api/admin/jobs/{id}` - Get job details
- `POST /api/admin/jobs/{id}/retry` - Retry failed job
- `GET /api/admin/jobs/monitoring` - Job queue metrics
- `GET /api/admin/jobs/stats` - Job statistics
- `GET /api/admin/workers/health` - Worker health status
- `GET /api/admin/system/health` - System health
- `GET /api/admin/system/metrics` - System metrics
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{id}` - Get user details
- `PATCH /api/admin/users/{id}` - Update user
- `GET /api/admin/skills` - List all skills
- `PATCH /api/admin/skills/{id}` - Update skill configuration
- `GET /api/admin/audit` - Get audit log

## Using the Interactive Documentation

1. **Start the dev server**:
```bash
pnpm dev
```

2. **Open the API docs**:
```
http://localhost:3000/api-docs
```

3. **Authenticate**:
   - Click the "Authorize" button
   - Enter: `Bearer <your_token>`
   - Click "Authorize"

4. **Try endpoints**:
   - Expand any endpoint
   - Click "Try it out"
   - Fill in parameters
   - Click "Execute"

## Exporting the Specification

### Generate Both JSON and YAML
```bash
pnpm export:openapi
```

### Generate JSON Only
```bash
pnpm export:openapi:json
```

### Generate YAML Only
```bash
pnpm export:openapi:yaml
```

Output files:
- `docs/api/openapi.json`
- `docs/api/openapi.yaml`

## Validating the Specification

```bash
pnpm validate:openapi
```

This validates:
- OpenAPI 3.0 compliance
- Required fields present
- Schema consistency
- Security definitions
- Reference validity

## Using with API Clients

### Postman

1. Import the specification:
   - File → Import → Link
   - URL: `http://localhost:3000/api/openapi.json`

2. Configure authentication:
   - Authorization → Type: Bearer Token
   - Token: `<your_token>`

### Insomnia

1. Import the specification:
   - Application → Preferences → Data → Import Data
   - URL: `http://localhost:3000/api/openapi.json`

2. Set up authentication:
   - Auth → Bearer Token
   - Token: `<your_token>`

### API Code Generation

Generate client SDKs from the OpenAPI spec:

```bash
# TypeScript/JavaScript
npx openapi-generator-cli generate \
  -i docs/api/openapi.json \
  -g typescript-axios \
  -o ./client

# Python
openapi-generator-cli generate \
  -i docs/api/openapi.json \
  -g python \
  -o ./python-client

# Go
openapi-generator-cli generate \
  -i docs/api/openapi.json \
  -g go \
  -o ./go-client
```

## Development

### Adding New Endpoints

1. **Create the route file** (e.g., `app/api/my-endpoint/route.ts`)

2. **Add JSDoc annotations**:
```typescript
/**
 * @swagger
 * /api/my-endpoint:
 *   get:
 *     summary: My endpoint
 *     description: Detailed description
 *     tags:
 *       - MyTag
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 */
export async function GET(request: NextRequest) {
  // Implementation
}
```

3. **Validate the spec**:
```bash
pnpm validate:openapi
```

4. **Export the updated spec**:
```bash
pnpm export:openapi
```

### Adding New Schemas

1. **Add to `lib/api-docs/openapi-config.ts`**:
```typescript
components: {
  schemas: {
    MySchema: {
      type: 'object',
      required: ['field1'],
      properties: {
        field1: {
          type: 'string',
          description: 'Field description'
        }
      }
    }
  }
}
```

2. **Reference in routes**:
```typescript
/**
 * @swagger
 * ...
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MySchema'
 */
```

## Support

For API support:
- Email: support@wastewise.com
- Documentation: https://wastewise.com/docs
- Status: https://status.wastewise.com

## License

Proprietary - See [Terms of Service](https://wastewise.com/terms)

---

**Last Updated**: 2025-01-15
**API Version**: 1.0.0
**OpenAPI Version**: 3.0.0
