# Swagger UI Interactive Documentation Guide

## Accessing the Documentation

### URL

```
http://localhost:3000/api-docs
```

### What You'll See

## Page Layout

### 1. Header Section (Blue Gradient)

```
┌─────────────────────────────────────────────────────────────────┐
│  WasteWise API Documentation                                    │
│  Interactive API explorer for the WasteWise waste management    │
│  optimization platform                                          │
│                                                                 │
│  [Download JSON]  [Back to App]                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Quick Start Guide (Gray Background)

```
┌─────────────────────────────────────────────────────────────────┐
│  Quick Start                                                    │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ 1           │  │ 2           │  │ 3           │           │
│  │ Auth        │  │ Async Jobs  │  │ Rate Limits │           │
│  │             │  │             │  │             │           │
│  │ Login→Token │  │ Create→Poll │  │ 100 req/min │           │
│  │ Authorize   │  │ →Results    │  │ 500 admins  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Interactive Swagger UI

```
┌─────────────────────────────────────────────────────────────────┐
│  WasteWise API  v1.0.0                                          │
│  [Authorize 🔓]                              [Filter: ____]     │
│                                                                 │
│  ▼ Authentication                                               │
│     POST /api/auth/login        User login                      │
│     POST /api/auth/signup       User registration               │
│                                                                 │
│  ▼ Projects                                                     │
│     GET  /api/projects          List user's projects            │
│     POST /api/projects          Create new project              │
│                                                                 │
│  ▼ Analysis                                                     │
│     POST /api/analyze           Create analysis job             │
│                                                                 │
│  ▼ Jobs                                                         │
│     GET  /api/jobs              List user's jobs                │
│     GET  /api/jobs/{id}         Get job status                  │
│                                                                 │
│  ▼ Health                                                       │
│     GET  /api/health            API health check                │
│     GET  /api/health/worker     Worker health check             │
│                                                                 │
│  ▼ Admin (13 endpoints)                                         │
│     GET  /api/admin/jobs        List all jobs                   │
│     GET  /api/admin/users       List all users                  │
│     ... (and 11 more)                                           │
│                                                                 │
│  ▼ Schemas                                                      │
│     AnalysisJob                                                 │
│     Project                                                     │
│     User                                                        │
│     ... (5 more)                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Using the Documentation

### Step 1: Authenticate

1. **Click the "Authorize" button** (top right, with lock icon)

2. **Enter your JWT token**:

   ```
   Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Click "Authorize"**

4. **Click "Close"**

Now all endpoints will include your token automatically!

### Step 2: Explore Endpoints

#### Expand an Endpoint Group

Click on a tag (e.g., "Analysis") to expand/collapse all endpoints in that category.

#### View Endpoint Details

Click on any endpoint to see:

```
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/analyze                                              │
│  Create analysis job                                            │
│                                                                 │
│  Creates a background job for long-running waste analysis       │
│  operations.                                                    │
│                                                                 │
│  Async Job Pattern:                                             │
│  1. Create job with this endpoint → Returns jobId               │
│  2. Poll GET /api/jobs/{jobId} every 2 seconds                  │
│  3. Check status field: pending → processing → completed        │
│  4. When completed, access results in result_data field         │
│                                                                 │
│  Processing Time: 30 seconds to 5 minutes depending on job type │
│                                                                 │
│  [Try it out]                                                   │
│                                                                 │
│  Parameters                                                     │
│    Request body  *required                                      │
│      Media type: application/json                               │
│                                                                 │
│      {                                                          │
│        "projectId": "d82e2314-7ccf-404e-a133-0caebb154c7e",    │
│        "jobType": "complete_analysis",                         │
│        "inputData": {},                                         │
│        "priority": 5                                            │
│      }                                                          │
│                                                                 │
│  Responses                                                      │
│    ▼ 201  Job created successfully                             │
│    ▼ 400  Validation error                                     │
│    ▼ 401  Authentication required                              │
│    ▼ 404  Project not found or access denied                   │
│    ▼ 429  Rate limit exceeded (10 requests/minute)             │
│    ▼ 500  Internal server error                                │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3: Test Endpoints

#### Click "Try it out"

```
┌─────────────────────────────────────────────────────────────────┐
│  [Try it out]  ← Click this                                     │
│                                                                 │
│  → Changes to editable fields                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Edit Request Body

```
┌─────────────────────────────────────────────────────────────────┐
│  Request body  *required                                        │
│    Media type: application/json                                 │
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐    │
│    │ {                                                    │    │
│    │   "projectId": "your-project-id-here",              │    │
│    │   "jobType": "complete_analysis"                    │    │
│    │ }                                                    │    │
│    └─────────────────────────────────────────────────────┘    │
│                                                                 │
│    [Execute]                                                    │
└─────────────────────────────────────────────────────────────────┘
```

#### Click "Execute"

Sends the request and shows the response:

```
┌─────────────────────────────────────────────────────────────────┐
│  Responses                                                      │
│                                                                 │
│  ▼ Server response                                              │
│     Code: 201                                                   │
│     Duration: 125 ms                                            │
│                                                                 │
│     Response body                                               │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ {                                                    │   │
│     │   "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  │   │
│     │   "status": "pending",                               │   │
│     │   "message": "Analysis job created..."               │   │
│     │ }                                                    │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│     Response headers                                            │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ content-type: application/json; charset=utf-8        │   │
│     │ x-ratelimit-limit: 10                                │   │
│     │ x-ratelimit-remaining: 9                             │   │
│     │ x-ratelimit-reset: 1736942400                        │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Responses                                                    │
│     ▼ 201  Job created successfully                             │
│        Example Value | Schema                                  │
│        {                                                        │
│          "jobId": "string",                                     │
│          "status": "pending",                                   │
│          "message": "string"                                    │
│        }                                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Common Workflows

### Workflow 1: Create and Monitor Analysis Job

1. **POST /api/analyze**
   - Try it out
   - Enter projectId and jobType
   - Execute
   - Copy the returned `jobId`

2. **GET /api/jobs/{id}**
   - Try it out
   - Paste the jobId in the `id` parameter
   - Execute repeatedly (every 2 seconds)
   - Watch `progress_percent` increase
   - When `status === "completed"`, view `result_data`

### Workflow 2: List Projects and Create Analysis

1. **GET /api/projects**
   - Try it out
   - Execute
   - Find a project ID

2. **POST /api/projects/{id}/analyze**
   - Try it out
   - Enter the project ID
   - Execute
   - Follow polling workflow above

### Workflow 3: Admin Monitoring

1. **GET /api/admin/jobs/monitoring**
   - Try it out (admin only)
   - Execute
   - View queue metrics

2. **GET /api/admin/system/metrics**
   - Try it out (admin only)
   - Execute
   - View system performance

## Features Demonstrated

### 1. Request Examples

Each endpoint shows multiple example requests:

```
Examples ▼
  ▶ complete_analysis      Complete analysis with all features
  ▶ invoice_extraction     Invoice extraction only
```

### 2. Response Examples

Each response code shows example responses:

```
Responses
  ▼ 201  Job created successfully
     Example Value | Schema
     {
       "jobId": "a1b2c3d4...",
       "status": "pending"
     }
```

### 3. Schema Definitions

Click on schemas to see structure:

```
▼ AnalysisJob
  {
    "id": "string (uuid)",
    "status": "pending | processing | completed | failed",
    "progress_percent": 0-100,
    "result_data": { ... }
  }
```

### 4. Security Indicators

Endpoints show lock icon if authentication required:

```
POST /api/analyze  🔒
```

### 5. Validation Errors

Shows detailed validation errors:

```
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [
      {
        "path": ["projectId"],
        "message": "Required"
      }
    ]
  }
}
```

## Tips and Tricks

### Filter Endpoints

Use the filter box to quickly find endpoints:

```
[Filter: jobs ]  ← Type "jobs"
```

Shows only endpoints with "jobs" in the path or description.

### Collapse All

Click tag headers to collapse/expand sections for easier navigation.

### Copy as cURL

After executing a request, you can copy as cURL command:

```bash
curl -X POST "http://localhost:3000/api/analyze" \
  -H "accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"...","jobType":"complete_analysis"}'
```

### Persistent Authorization

Your authorization token persists in the browser, so you don't need to re-enter it every time you refresh the page.

### Response Duration

Shows how long each request took - useful for performance testing.

### Download Spec

Use "Download JSON" button in header to save the OpenAPI spec for:

- Importing into Postman/Insomnia
- Generating client SDKs
- Offline reference

## Keyboard Shortcuts

- **Ctrl/Cmd + F**: Filter endpoints
- **Tab**: Navigate between fields
- **Enter**: Execute request (when focused on Execute button)
- **Esc**: Close modals/dialogs

## Troubleshooting

### "Authorization required" errors

1. Make sure you clicked "Authorize" button
2. Verify token format: `Bearer <token>`
3. Check token hasn't expired (1 hour lifetime)

### CORS errors

- The API includes CORS headers for localhost
- If testing from different origin, you may need to configure CORS in Next.js

### Rate limit errors

- Wait for the time specified in `retryAfter`
- Check `X-RateLimit-Reset` header for reset time

### 404 errors

- Verify the endpoint path is correct
- Check if you have the required permissions (e.g., admin endpoints)

## Advanced Usage

### Compare Responses

Open multiple endpoints in different browser tabs to compare responses.

### Testing Error Cases

Try invalid data to see error responses:

```json
{
  "projectId": "not-a-uuid",
  "jobType": "invalid-type"
}
```

### Rate Limit Testing

Execute same endpoint multiple times quickly to trigger rate limit and see:

- 429 status code
- `retryAfter` seconds
- Rate limit headers

---

**Interactive Documentation URL**: http://localhost:3000/api-docs

**Tip**: Bookmark this page for quick access during development!
