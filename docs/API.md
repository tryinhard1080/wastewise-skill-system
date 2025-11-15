# WasteWise API Documentation

**Base URL:** `http://localhost:3000/api` (development)

All API endpoints require authentication via Supabase Auth (JWT token in cookie).

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Responses](#error-responses)
4. [Endpoints](#endpoints)
   - [Create Analysis Job](#create-analysis-job)
   - [List Jobs](#list-jobs)
   - [Get Job Status](#get-job-status)
   - [Cancel Job](#cancel-job)

---

## Authentication

All endpoints require authentication. The Supabase client automatically handles JWT tokens via HTTP-only cookies.

**Unauthorized Response:**
```json
{
  "error": "Unauthorized"
}
```
**Status Code:** `401`

---

## Rate Limiting

Rate limits are enforced per user:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/analyze` | 10 requests | 1 minute |
| `GET /api/jobs` | 60 requests | 1 minute |
| `GET /api/jobs/[id]` | 60 requests | 1 minute |
| `PATCH /api/jobs/[id]` | 60 requests | 1 minute |

**Rate Limit Headers:**
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Unix timestamp when the rate limit resets
- `Retry-After` - Seconds until rate limit resets (when limited)

**Rate Limit Exceeded Response:**
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```
**Status Code:** `429`

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional context
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Endpoints

### Create Analysis Job

Creates a new background analysis job.

**Endpoint:** `POST /api/analyze`

**Request Body:**
```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "jobType": "complete_analysis",
  "inputData": {
    "optional": "metadata"
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectId` | UUID | Yes | Project ID to analyze |
| `jobType` | Enum | Yes | Type of analysis job |
| `inputData` | Object | No | Optional metadata for the job |

**Job Types:**
- `invoice_extraction` - Extract data from invoices using Claude Vision
- `regulatory_research` - Research local waste regulations
- `complete_analysis` - Full WasteWise analysis workflow
- `report_generation` - Generate analysis report

**Success Response:**
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "message": "Analysis job created. Poll /api/jobs/123e4567-e89b-12d3-a456-426614174000 for status updates."
}
```
**Status Code:** `201 Created`

**Error Responses:**

- **401 Unauthorized** - Not authenticated
- **400 Validation Error** - Invalid request data
- **404 Not Found** - Project not found or access denied
- **429 Rate Limit** - Too many job creation requests
- **500 Internal Error** - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "jobType": "complete_analysis"
  }'
```

---

### List Jobs

List all analysis jobs for the authenticated user with filtering and pagination.

**Endpoint:** `GET /api/jobs`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | Enum | No | Filter by job status |
| `jobType` | Enum | No | Filter by job type |
| `projectId` | UUID | No | Filter by project ID |
| `limit` | Integer | No | Items per page (default: 20, max: 100) |
| `offset` | Integer | No | Number of items to skip (default: 0) |

**Status Values:**
- `pending` - Waiting for worker to pick up
- `processing` - Currently being processed
- `completed` - Successfully completed
- `failed` - Failed with error
- `cancelled` - Cancelled by user

**Success Response:**
```json
{
  "jobs": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "projectId": "550e8400-e29b-41d4-a716-446655440000",
      "jobType": "complete_analysis",
      "status": "completed",
      "progress": {
        "percent": 100,
        "currentStep": "Analysis complete"
      },
      "timing": {
        "createdAt": "2025-01-15T10:30:00Z",
        "startedAt": "2025-01-15T10:30:05Z",
        "completedAt": "2025-01-15T10:32:15Z",
        "durationSeconds": 130
      },
      "hasError": false,
      "hasResult": true
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```
**Status Code:** `200 OK`

**Example:**
```bash
# Get all completed jobs for a project
curl http://localhost:3000/api/jobs?status=completed&projectId=550e8400-e29b-41d4-a716-446655440000

# Get first page of all jobs
curl http://localhost:3000/api/jobs?limit=10&offset=0
```

---

### Get Job Status

Get detailed status and results for a specific job.

**Endpoint:** `GET /api/jobs/[id]`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Job ID |

**Success Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "jobType": "complete_analysis",
  "status": "completed",
  "progress": {
    "percent": 100,
    "currentStep": "Analysis complete",
    "totalSteps": 5,
    "stepsCompleted": 5
  },
  "timing": {
    "startedAt": "2025-01-15T10:30:05Z",
    "completedAt": "2025-01-15T10:32:15Z",
    "estimatedCompletion": null,
    "durationSeconds": 130
  },
  "result": {
    "recommend": true,
    "avgTonsPerHaul": 5.2,
    "targetTonsPerHaul": 8.5,
    "grossAnnualSavings": 12500.00,
    "netYear1Savings": 11500.00,
    "roiPercent": 145.5,
    "paybackMonths": 8.2
  },
  "error": null,
  "aiUsage": {
    "requests": 3,
    "tokensInput": 15420,
    "tokensOutput": 2834,
    "costUsd": 0.045
  },
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:32:15Z"
}
```
**Status Code:** `200 OK`

**Error Object (when status is "failed"):**
```json
{
  "error": {
    "message": "Failed to load project data",
    "code": "PROJECT_NOT_FOUND",
    "details": {
      "projectId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "failedAt": "2025-01-15T10:30:10Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid UUID format
- **401 Unauthorized** - Not authenticated
- **404 Not Found** - Job not found or access denied
- **500 Internal Error** - Server error

**Example:**
```bash
curl http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000
```

**Polling Pattern:**

```javascript
async function pollJobStatus(jobId) {
  while (true) {
    const response = await fetch(`/api/jobs/${jobId}`)
    const job = await response.json()

    if (job.status === 'completed') {
      return job.result
    }

    if (job.status === 'failed') {
      throw new Error(job.error.message)
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}
```

---

### Cancel Job

Cancel a pending or processing job.

**Endpoint:** `PATCH /api/jobs/[id]`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Job ID |

**Request Body:**
```json
{
  "action": "cancel"
}
```

**Success Response:**
```json
{
  "success": true,
  "job": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "cancelled"
  }
}
```
**Status Code:** `200 OK`

**Error Responses:**

- **400 Bad Request** - Invalid UUID format or action
- **401 Unauthorized** - Not authenticated
- **404 Not Found** - Job not found, access denied, or cannot be cancelled
- **500 Internal Error** - Server error

**Notes:**
- Only jobs with status `pending` or `processing` can be cancelled
- Completed, failed, or already cancelled jobs cannot be cancelled

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"action": "cancel"}'
```

---

## Workflow Example

### Complete Analysis Flow

```javascript
// 1. Create analysis job
const createResponse = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-uuid',
    jobType: 'complete_analysis'
  })
})

const { jobId } = await createResponse.json()

// 2. Poll for completion
let status = 'pending'
while (status === 'pending' || status === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 2000))

  const statusResponse = await fetch(`/api/jobs/${jobId}`)
  const job = await statusResponse.json()

  status = job.status
  console.log(`Progress: ${job.progress.percent}% - ${job.progress.currentStep}`)

  if (status === 'completed') {
    console.log('Results:', job.result)
    break
  }

  if (status === 'failed') {
    console.error('Job failed:', job.error)
    break
  }
}

// 3. Optional: List all jobs for project
const listResponse = await fetch(`/api/jobs?projectId=${projectId}&status=completed`)
const { jobs } = await listResponse.json()
console.log(`Project has ${jobs.length} completed analyses`)
```

---

## Development Notes

### Local Testing

```bash
# Start Supabase
npx supabase start

# Start development server
pnpm dev

# Start worker (separate terminal)
pnpm worker

# Test API with curl
curl http://localhost:3000/api/jobs
```

### Authentication in Development

For local testing, you can use Supabase's test users or create users via the Supabase dashboard at `http://localhost:54323`.

---

## Future Enhancements

- **Webhooks**: Optional callback URLs for job completion
- **Bulk Operations**: Create multiple jobs in a single request
- **Job Templates**: Save and reuse job configurations
- **Advanced Filtering**: Date ranges, search, sorting
- **Real-time Updates**: WebSocket support for live progress

---

**Last Updated:** Phase 2.2 - January 2025
