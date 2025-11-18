# WasteWise API Documentation

**Version**: 1.0.0
**Base URL**: `http://localhost:3000` (development) | `https://your-domain.com` (production)
**Last Updated**: 2025-11-18 (Phase 7)

All API endpoints require authentication via Supabase Auth (JWT token).

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Responses](#error-responses)
4. [Endpoints](#endpoints)
   - [Start Analysis Job](#start-analysis-job)
   - [Get Job Status](#get-job-status)
   - [Cancel Job](#cancel-job)
5. [Workflow Example](#workflow-example)
6. [Development Notes](#development-notes)

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

### Start Analysis Job

Creates a new complete analysis job for a specific project.

**Endpoint:** `POST /api/projects/{projectId}/analyze`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectId` | UUID | Project ID to analyze |

**Request Body:** None required

**Success Response:**
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "message": "Analysis started. Use job ID to check progress."
}
```
**Status Code:** `200 OK`

**Error Responses:**

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `NO_INVOICE_DATA` | Project has no invoice data to analyze |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication token |
| 404 | `PROJECT_NOT_FOUND` | Project doesn't exist or user doesn't own it |
| 409 | `DUPLICATE_JOB` | Job already pending or processing for this project |
| 500 | `INTERNAL_ERROR` | Server error during job creation |

**Example:**
```bash
curl -X POST http://localhost:3000/api/projects/550e8400-e29b-41d4-a716-446655440000/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Notes:**
- The job type is automatically set to `complete_analysis`
- Only one analysis job can be pending/processing per project at a time
- Background worker will pick up the job within 2 seconds
- Use the returned `jobId` to poll for status updates at `/api/jobs/{jobId}`

---

### Get Job Status

Get detailed status and results for a specific job.

**Endpoint:** `GET /api/jobs/[id]`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Job ID |

**Success Response (Processing):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "jobType": "complete_analysis",
  "status": "processing",
  "progress": {
    "percent": 45,
    "currentStep": "Running optimization analyses",
    "stepsCompleted": 2,
    "totalSteps": 5
  },
  "timing": {
    "startedAt": "2025-11-18T10:30:00.000Z",
    "completedAt": null,
    "durationSeconds": null
  },
  "result": null,
  "error": null,
  "aiUsage": {
    "requests": 0,
    "tokensInput": 0,
    "tokensOutput": 0,
    "costUsd": 0
  }
}
```

**Success Response (Completed):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "jobType": "complete_analysis",
  "status": "completed",
  "progress": {
    "percent": 100,
    "currentStep": "Analysis completed",
    "stepsCompleted": 5,
    "totalSteps": 5
  },
  "timing": {
    "startedAt": "2025-11-18T10:30:00.000Z",
    "completedAt": "2025-11-18T10:33:45.000Z",
    "durationSeconds": 225
  },
  "result": {
    "summary": {
      "totalSavingsPotential": 42500,
      "currentMonthlyCost": 3200,
      "optimizedMonthlyCost": 2500,
      "savingsPercentage": 21.875,
      "dateRange": {
        "start": "2025-01-01",
        "end": "2025-06-30"
      },
      "totalHauls": 22
    },
    "recommendations": [
      {
        "priority": 1,
        "title": "Install DSQ Compactor Monitors",
        "description": "Property is under-utilizing compactor capacity...",
        "estimatedAnnualSavings": 28500,
        "implementationTimeline": "2-4 weeks",
        "confidenceLevel": "HIGH"
      }
    ],
    "reports": {
      "excelWorkbook": {
        "fileName": "wastewise-analysis-abc-123-2025-11-18.xlsx",
        "storagePath": "analysis-reports/...",
        "downloadUrl": "https://...",
        "size": 245678
      },
      "htmlDashboard": {
        "fileName": "wastewise-dashboard-abc-123-2025-11-18.html",
        "storagePath": "analysis-reports/...",
        "downloadUrl": "https://...",
        "size": 156432
      }
    },
    "aiUsage": {
      "totalRequests": 0,
      "totalTokensInput": 0,
      "totalTokensOutput": 0,
      "totalCostUsd": 0
    }
  },
  "error": null,
  "aiUsage": {
    "requests": 0,
    "tokensInput": 0,
    "tokensOutput": 0,
    "costUsd": 0
  }
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

Cancel a pending or processing analysis job.

**Endpoint:** `DELETE /api/jobs/{jobId}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `jobId` | UUID | Job ID to cancel |

**Request Body:** None required

**Success Response:**
```json
{
  "success": true,
  "message": "Job cancelled successfully",
  "jobId": "123e4567-e89b-12d3-a456-426614174000"
}
```
**Status Code:** `200 OK`

**Error Responses:**

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_STATUS` | Job is already completed, failed, or cancelled |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication token |
| 404 | `JOB_NOT_FOUND` | Job doesn't exist or user doesn't own it |
| 500 | `INTERNAL_ERROR` | Server error during cancellation |

**Notes:**
- Only jobs with status `pending` or `processing` can be cancelled
- Cancelling a processing job will stop execution immediately
- Cancelled jobs retain their partial progress data

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Workflow Example

### Complete Analysis Flow

```javascript
import { createClient } from '@/lib/supabase/client'

async function analyzeProject(projectId) {
  const supabase = createClient()

  // 1. Get authentication token
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  // 2. Start analysis job
  const createResponse = await fetch(`/api/projects/${projectId}/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  const { jobId } = await createResponse.json()
  console.log('Analysis started:', jobId)

  // 3. Poll for completion (every 2 seconds)
  let status = 'pending'
  while (status === 'pending' || status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 2000))

    const statusResponse = await fetch(`/api/jobs/${jobId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const job = await statusResponse.json()
    status = job.status

    console.log(`Progress: ${job.progress.percent}% - ${job.progress.currentStep}`)

    if (status === 'completed') {
      console.log('Analysis completed!')
      console.log('Savings:', job.result.summary.totalSavingsPotential)
      console.log('Excel:', job.result.reports.excelWorkbook.downloadUrl)
      console.log('HTML:', job.result.reports.htmlDashboard.downloadUrl)
      return job.result
    }

    if (status === 'failed') {
      console.error('Job failed:', job.error.message)
      throw new Error(job.error.message)
    }
  }
}

// Usage
try {
  const result = await analyzeProject('your-project-id')
  console.log('Total recommendations:', result.recommendations.length)
} catch (error) {
  console.error('Analysis error:', error)
}
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

## Support

For API support or to report issues:
- **GitHub Issues**: Report bugs or feature requests
- **Documentation**: Full project documentation in `.claude/CLAUDE.md`
- **Testing**: Use test credentials from `PHASE_7_TEST_RESULTS.md`

---

**Last Updated:** 2025-11-18 (Phase 7 - Integration Testing)
**Version:** 1.0.0

**Generated with [Claude Code](https://claude.com/claude-code)**
