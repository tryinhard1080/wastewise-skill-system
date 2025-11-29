# Waste Invoice & Contract Processing Architecture
**Version 1.0 - November 27, 2025**

## Executive Summary

This document provides a complete wireframe and technical architecture for processing waste management invoices and contracts using the Claude Code Master Skill agent system. The solution leverages the existing agent ecosystem (Orchestrator, Backend, Skills, Frontend, Testing) and integrates with WasteWiseRAGBOLT for data storage and retrieval.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Data Flow Diagrams](#data-flow-diagrams)
3. [Agent Responsibilities](#agent-responsibilities)
4. [Invoice Processing Workflow](#invoice-processing-workflow)
5. [Contract Processing Workflow](#contract-processing-workflow)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Frontend Components](#frontend-components)
9. [Skills Integration](#skills-integration)
10. [Error Handling & Recovery](#error-handling--recovery)
11. [Testing Strategy](#testing-strategy)
12. [Implementation Plan](#implementation-plan)

---

## 1. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Upload     │  │   Analysis   │  │   Reports    │         │
│  │   Component  │  │   Dashboard  │  │   Viewer     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │         ┌────────▼────────┐        │
          │         │  ORCHESTRATOR   │        │
          │         │     AGENT       │        │
          │         └────────┬────────┘        │
          │                  │                  │
┌─────────▼──────────────────┼──────────────────▼─────────────────┐
│                    SPECIALIZED AGENTS                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   BACKEND    │  │    SKILLS    │  │   FRONTEND   │         │
│  │    AGENT     │  │    AGENT     │  │    AGENT     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │         ┌────────▼────────┐        │
          │         │  SKILLS SYSTEM  │        │
          │         │  (waste-skills) │        │
          │         └────────┬────────┘        │
          │                  │                  │
┌─────────▼──────────────────┴──────────────────▼─────────────────┐
│                    DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Supabase   │  │  WasteWise   │  │   Storage    │         │
│  │   Database   │  │     RAG      │  │   (Files)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend (Frontend Agent)**
- React + TypeScript
- Tailwind CSS + shadcn/ui components
- React Query for state management
- Zustand for global state

**Backend (Backend Agent)**
- Node.js + Express + TypeScript
- Supabase (PostgreSQL database)
- Supabase Storage (file uploads)
- Claude AI API (Vision + Sonnet 4.5)

**Skills (Skills Agent)**
- TypeScript skills system
- Python-ported calculations
- 9 specialized waste management skills
- Conversion rate validators

**Testing (Testing Agent)**
- Vitest + Playwright
- E2E testing framework
- Calculation evals (<0.01% tolerance)

---

## 2. Data Flow Diagrams

### Invoice Processing Flow

```
┌──────────┐
│  User    │
│  Uploads │
│  Invoice │
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: File Upload & Storage                                │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Frontend     │─→│ Backend API  │─→│ Supabase     │       │
│ │ Component    │  │ /upload      │  │ Storage      │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: Document Classification                              │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Backend      │─→│ Claude       │─→│ Classify:    │       │
│ │ Agent        │  │ Vision API   │  │ Invoice vs   │       │
│ │              │  │              │  │ Contract     │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: Data Extraction (Invoice)                            │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Skills Agent │─→│ Contract     │─→│ Extract:     │       │
│ │              │  │ Extractor    │  │ • Account #  │       │
│ │              │  │ Skill        │  │ • Dates      │       │
│ │              │  │              │  │ • Charges    │       │
│ │              │  │              │  │ • Haul count │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: Database Storage                                      │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Backend      │─→│ Supabase     │─→│ Tables:      │       │
│ │ Agent        │  │ Database     │  │ • invoices   │       │
│ │              │  │              │  │ • charges    │       │
│ │              │  │              │  │ • accounts   │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 5: Analysis & Optimization                              │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Skills Agent │─→│ Analytics    │─→│ Generate:    │       │
│ │              │  │ Skill        │  │ • Variance   │       │
│ │              │  │              │  │ • Flags      │       │
│ │              │  │              │  │ • Savings    │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 6: Report Generation                                    │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Backend      │─→│ Report       │─→│ Output:      │       │
│ │ Agent        │  │ Templates    │  │ • Excel      │       │
│ │              │  │              │  │ • HTML       │       │
│ │              │  │              │  │ • PDF        │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────┐
│  User    │
│ Reviews  │
│ Results  │
└──────────┘
```

### Contract Processing Flow

```
┌──────────┐
│  User    │
│  Uploads │
│ Contract │
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: File Upload & Storage (Same as Invoice)              │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: Document Classification → Identify as Contract       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: Contract Data Extraction                             │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Skills Agent │─→│ Contract     │─→│ Extract:     │       │
│ │              │  │ Extractor    │  │ • Terms      │       │
│ │              │  │ Skill        │  │ • Rates      │       │
│ │              │  │              │  │ • Services   │       │
│ │              │  │              │  │ • Clauses    │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: Database Storage                                      │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Backend      │─→│ Supabase     │─→│ Tables:      │       │
│ │ Agent        │  │ Database     │  │ • contracts  │       │
│ │              │  │              │  │ • services   │       │
│ │              │  │              │  │ • clauses    │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 5: Contract Analysis                                    │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Skills Agent │─→│ Contract     │─→│ Analyze:     │       │
│ │              │  │ Analyzer     │  │ • Red flags  │       │
│ │              │  │              │  │ • Deadlines  │       │
│ │              │  │              │  │ • Risks      │       │
│ └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 6: Report Generation (12-Sheet Excel)                   │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────┐
│  User    │
│ Reviews  │
│ Contract │
└──────────┘
```

---

## 3. Agent Responsibilities

### Orchestrator Agent

**Role**: Central coordinator for invoice/contract processing tasks

**Responsibilities**:
1. Receive user request to process invoice or contract
2. Determine document type and route to appropriate workflow
3. Allocate tasks to specialized agents:
   - File upload → Backend Agent
   - Data extraction → Skills Agent
   - UI updates → Frontend Agent
   - Validation → Testing Agent
4. Monitor progress and handle errors
5. Validate final outputs meet acceptance criteria

**Task Allocation Example**:
```
TASK: Process waste invoice for Property ABC
ASSIGNED TO: Backend Agent
BRANCH: backend/invoice-extraction
ACCEPTANCE CRITERIA:
- [ ] File uploaded to Supabase Storage
- [ ] Document classified (invoice vs contract)
- [ ] Claude Vision extraction complete
- [ ] Data stored in database
- [ ] Accuracy >95%
DEPENDENCIES: None
PRIORITY: High
```

---

### Backend Agent

**Role**: Handle all server-side processing, APIs, and database operations

**Responsibilities**:

1. **File Upload Management**
   ```typescript
   // app/api/upload/route.ts
   export async function POST(req: Request) {
     // 1. Receive file from frontend
     // 2. Validate file type (PDF, JPEG, PNG)
     // 3. Upload to Supabase Storage
     // 4. Create database record
     // 5. Return upload status
   }
   ```

2. **Document Classification**
   ```typescript
   // lib/api/classify-document.ts
   export async function classifyDocument(fileUrl: string) {
     // 1. Call Claude Vision API
     // 2. Identify: Invoice, Contract, or Other
     // 3. Extract vendor name
     // 4. Return classification
   }
   ```

3. **Data Extraction Orchestration**
   ```typescript
   // lib/api/extract-data.ts
   export async function extractInvoiceData(documentId: string) {
     // 1. Route to Skills Agent
     // 2. Execute waste-contract-extractor skill
     // 3. Validate extraction results
     // 4. Store in database
     // 5. Return structured data
   }
   ```

4. **Database Operations**
   - Create/update invoice records
   - Store contract terms
   - Track processing status
   - Handle errors and retries

5. **Report Generation**
   ```typescript
   // lib/reports/generate-invoice-report.ts
   export async function generateInvoiceReport(propertyId: string) {
     // 1. Fetch data from database
     // 2. Apply Excel template
     // 3. Generate 12-sheet workbook
     // 4. Upload to Storage
     // 5. Return download URL
   }
   ```

**Branch Strategy**: `backend/[feature-name]`
- `backend/invoice-upload`
- `backend/contract-extraction`
- `backend/report-generation`

---

### Skills Agent

**Role**: Execute specialized waste management calculations and data extraction

**Responsibilities**:

1. **Skill Routing**
   ```typescript
   // lib/skills/executor.ts
   export async function executeDocumentProcessing(
     documentType: 'invoice' | 'contract',
     fileUrl: string,
     context: SkillContext
   ) {
     if (documentType === 'invoice') {
       return await executeSkill('waste-contract-extractor', context)
     } else if (documentType === 'contract') {
       return await executeSkill('waste-contract-extractor', context)
     }
   }
   ```

2. **Invoice Data Extraction**
   ```typescript
   // lib/skills/skills/invoice-extractor.ts
   import { BaseSkill } from '../base-skill'
   import type { InvoiceExtractionResult } from '../types'

   export class InvoiceExtractorSkill extends BaseSkill<InvoiceExtractionResult> {
     readonly name = 'invoice-extractor'
     readonly version = '1.0.0'
     readonly description = 'Extract structured data from waste invoices'

     protected async executeInternal(context: SkillContext) {
       // 1. Call Claude Vision for OCR
       // 2. Extract account numbers
       // 3. Extract charge line items
       // 4. Extract dates and totals
       // 5. Calculate haul counts
       // 6. Return structured data
     }
   }
   ```

3. **Contract Data Extraction**
   - Use existing `waste-contract-extractor` skill
   - Extract terms, clauses, rates
   - Identify red flags
   - Calculate deadlines

4. **Historical Analysis**
   ```typescript
   // lib/skills/skills/historical-analyzer.ts
   export async function analyzeExpenseHistory(invoices: Invoice[]) {
     // 1. Group by month and account
     // 2. Calculate variances
     // 3. Flag anomalies (>20% change)
     // 4. Generate investigation tracker
     // 5. Return analysis data
   }
   ```

5. **Optimization Calculations**
   ```typescript
   // lib/skills/skills/optimization-calculator.ts
   import { COMPACTOR_OPTIMIZATION_THRESHOLD } from '@/lib/constants/formulas'
   
   export async function calculateOptimizations(invoiceData: InvoiceData) {
     // 1. Calculate current annual hauls
     // 2. Determine optimization opportunities
     // 3. Calculate potential savings
     // 4. Show transparent step-by-step math
     // 5. Return optimization results
   }
   ```

6. **Conversion Rate Validation**
   - Ensure all calculations use canonical constants
   - Validate against formulas.ts
   - Run evals for accuracy

**Branch Strategy**: `skills/[feature-name]`
- `skills/invoice-extractor`
- `skills/historical-analyzer`
- `skills/optimization-calculator`

---

### Frontend Agent

**Role**: Build UI components for uploading, viewing, and analyzing documents

**Responsibilities**:

1. **Upload Component**
   ```typescript
   // components/invoice/InvoiceUpload.tsx
   export function InvoiceUpload() {
     return (
       <div>
         <FileDropzone
           acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
           onUpload={handleUpload}
         />
         <DocumentTypeToggle
           options={['Invoice', 'Contract']}
           selected={documentType}
           onChange={setDocumentType}
         />
         <Button onClick={processDocument}>
           Process Document
         </Button>
       </div>
     )
   }
   ```

2. **Historical Expense Viewer**
   ```typescript
   // components/invoice/ExpenseHistoryTable.tsx
   export function ExpenseHistoryTable({ data }: Props) {
     return (
       <Table>
         <TableHeader>
           <TableRow>
             <TableHead>Month</TableHead>
             <TableHead>Account</TableHead>
             <TableHead>Expense Category</TableHead>
             <TableHead>Amount</TableHead>
             <TableHead>% Change</TableHead>
             <TableHead>Flag</TableHead>
           </TableRow>
         </TableHeader>
         <TableBody>
           {data.map((row) => (
             <TableRow key={row.id}>
               <TableCell>{row.month}</TableCell>
               <TableCell>{row.account}</TableCell>
               <TableCell>{row.category}</TableCell>
               <TableCell className="text-right">
                 {formatCurrency(row.amount)}
               </TableCell>
               <TableCell className={row.change > 20 ? 'text-red-600' : ''}>
                 {row.change}%
               </TableCell>
               <TableCell>
                 {row.flag && <Badge variant="destructive">🚩 INVESTIGATE</Badge>}
               </TableCell>
             </TableRow>
           ))}
         </TableBody>
       </Table>
     )
   }
   ```

3. **Optimization Display**
   ```typescript
   // components/invoice/OptimizationCard.tsx
   export function OptimizationCard({ optimization }: Props) {
     return (
       <Card>
         <CardHeader>
           <CardTitle>Optimization Opportunity</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             <Section title="Current State">
               <Metric label="Annual Hauls" value={optimization.currentHauls} />
               <Metric label="Cost Per Haul" value={formatCurrency(optimization.costPerHaul)} />
               <Calculation>
                 {optimization.currentHauls} hauls × ${optimization.costPerHaul} = 
                 {formatCurrency(optimization.currentAnnualCost)}
               </Calculation>
             </Section>
             
             <Section title="With Monitors">
               <Metric label="Optimized Hauls" value={optimization.optimizedHauls} />
               <Metric label="Monitor Cost" value="$3,000/year" />
               <Calculation>
                 {optimization.optimizedHauls} hauls × ${optimization.costPerHaul} = 
                 {formatCurrency(optimization.optimizedCost)}
               </Calculation>
             </Section>
             
             <Section title="Net Savings">
               <Metric
                 label="Annual Savings"
                 value={formatCurrency(optimization.netSavings)}
                 className="text-2xl font-bold text-green-600"
               />
             </Section>
           </div>
         </CardContent>
       </Card>
     )
   }
   ```

4. **Contract Summary Viewer**
   ```typescript
   // components/contract/ContractSummary.tsx
   export function ContractSummary({ contract }: Props) {
     return (
       <div className="grid grid-cols-2 gap-6">
         <InfoCard title="Basic Information">
           <InfoRow label="Vendor" value={contract.vendorName} />
           <InfoRow label="Account #" value={contract.accountNumber} />
           <InfoRow label="Effective Date" value={contract.effectiveDate} />
         </InfoCard>
         
         <InfoCard title="Critical Dates">
           <InfoRow label="Expiration" value={contract.expirationDate} />
           <InfoRow label="Notice Required" value={`${contract.noticeDays} days`} />
           <InfoRow
             label="Notice By"
             value={contract.noticeByDate}
             className="font-bold text-red-600"
           />
         </InfoCard>
         
         <InfoCard title="Red Flags" className="col-span-2">
           {contract.redFlags.map((flag) => (
             <Alert key={flag.id} variant={flag.severity}>
               <AlertTitle>{flag.title}</AlertTitle>
               <AlertDescription>{flag.description}</AlertDescription>
             </Alert>
           ))}
         </InfoCard>
       </div>
     )
   }
   ```

5. **Report Download**
   ```typescript
   // components/invoice/ReportDownload.tsx
   export function ReportDownload({ reportId }: Props) {
     const { data: report, isLoading } = useQuery({
       queryKey: ['report', reportId],
       queryFn: () => fetchReport(reportId)
     })
     
     return (
       <Card>
         <CardHeader>
           <CardTitle>Download Report</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex gap-4">
             <Button onClick={() => downloadReport(reportId, 'excel')}>
               <FileSpreadsheet className="mr-2" />
               Download Excel (12 Sheets)
             </Button>
             <Button onClick={() => downloadReport(reportId, 'pdf')}>
               <FileText className="mr-2" />
               Download PDF
             </Button>
           </div>
         </CardContent>
       </Card>
     )
   }
   ```

**Branch Strategy**: `frontend/[feature-name]`
- `frontend/invoice-upload`
- `frontend/expense-viewer`
- `frontend/contract-summary`

---

### Testing Agent

**Role**: Ensure all processing is accurate and reliable

**Responsibilities**:

1. **Unit Tests for Skills**
   ```typescript
   // __tests__/skills/invoice-extractor.test.ts
   describe('InvoiceExtractorSkill', () => {
     test('extracts invoice data accurately', async () => {
       const skill = new InvoiceExtractorSkill()
       const result = await skill.execute(mockContext)
       
       expect(result.success).toBe(true)
       expect(result.data.invoiceNumber).toBe('INV-12345')
       expect(result.data.totalAmount).toBe(1234.56)
       expect(result.data.accounts).toHaveLength(2)
     })
     
     test('calculates haul counts correctly', async () => {
       const skill = new InvoiceExtractorSkill()
       const result = await skill.execute(mockContext)
       
       expect(result.data.accounts[0].haulCount).toBe(4)
       expect(result.data.accounts[0].haulMethod).toBe('Explicit')
     })
   })
   ```

2. **E2E Tests for Upload Flow**
   ```typescript
   // __tests__/e2e/invoice-upload.test.ts
   test('user can upload and process invoice', async ({ page }) => {
     await page.goto('/upload')
     
     // Upload file
     await page.setInputFiles('input[type="file"]', 'test-invoice.pdf')
     
     // Select document type
     await page.click('button:has-text("Invoice")')
     
     // Process
     await page.click('button:has-text("Process Document")')
     
     // Wait for completion
     await page.waitForSelector('text=Processing Complete')
     
     // Verify results displayed
     await expect(page.locator('[data-testid="invoice-number"]')).toContainText('INV-12345')
     await expect(page.locator('[data-testid="total-amount"]')).toContainText('$1,234.56')
   })
   ```

3. **Calculation Evals**
   ```typescript
   // lib/evals/invoice-calculations-eval.ts
   describe('Invoice Calculation Evals', () => {
     test('variance calculation matches expected', () => {
       const current = 1500
       const previous = 1200
       const variance = calculateVariance(current, previous)
       const expected = 25.0 // 25% increase
       
       expect(Math.abs(variance - expected)).toBeLessThan(0.01)
     })
     
     test('optimization savings calculation', () => {
       const result = calculateOptimization({
         currentHauls: 52,
         costPerHaul: 343,
         targetHauls: 26,
         monitorCost: 3000
       })
       
       const expected = {
         grossSavings: 8918,
         netSavings: 5918
       }
       
       expect(result.grossSavings).toBeCloseTo(expected.grossSavings, 0)
       expect(result.netSavings).toBeCloseTo(expected.netSavings, 0)
     })
   })
   ```

4. **Integration Tests**
   ```typescript
   // __tests__/integration/invoice-processing.test.ts
   test('full invoice processing pipeline', async () => {
     // 1. Upload
     const uploadResult = await uploadInvoice('test-invoice.pdf')
     expect(uploadResult.success).toBe(true)
     
     // 2. Classification
     const classification = await classifyDocument(uploadResult.documentId)
     expect(classification.type).toBe('invoice')
     
     // 3. Extraction
     const extraction = await extractInvoiceData(uploadResult.documentId)
     expect(extraction.success).toBe(true)
     expect(extraction.data.accounts).toHaveLength(2)
     
     // 4. Storage
     const stored = await getInvoiceFromDb(extraction.data.invoiceId)
     expect(stored).toBeDefined()
     
     // 5. Analysis
     const analysis = await analyzeInvoice(extraction.data.invoiceId)
     expect(analysis.variances).toBeDefined()
     
     // 6. Report
     const report = await generateReport(extraction.data.invoiceId)
     expect(report.url).toContain('.xlsx')
   })
   ```

**Branch Strategy**: `testing/[feature-name]`
- `testing/invoice-extraction-evals`
- `testing/e2e-upload-flow`
- `testing/calculation-accuracy`

---

## 4. Invoice Processing Workflow

### Detailed Step-by-Step Process

#### Step 1: File Upload

**Frontend Component**:
```typescript
// components/invoice/InvoiceUploadForm.tsx
export function InvoiceUploadForm() {
  const [files, setFiles] = useState<File[]>([])
  const [propertyId, setPropertyId] = useState<string>('')
  
  const uploadMutation = useMutation({
    mutationFn: async (data: { files: File[]; propertyId: string }) => {
      const formData = new FormData()
      data.files.forEach((file) => formData.append('files', file))
      formData.append('propertyId', data.propertyId)
      
      return await fetch('/api/upload/invoice', {
        method: 'POST',
        body: formData
      }).then(res => res.json())
    }
  })
  
  const handleSubmit = () => {
    uploadMutation.mutate({ files, propertyId })
  }
  
  return (
    <Form onSubmit={handleSubmit}>
      <PropertySelector value={propertyId} onChange={setPropertyId} />
      <FileUploader
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        onFilesSelected={setFiles}
      />
      <Button type="submit" disabled={uploadMutation.isPending}>
        {uploadMutation.isPending ? 'Uploading...' : 'Upload & Process'}
      </Button>
    </Form>
  )
}
```

**Backend API**:
```typescript
// app/api/upload/invoice/route.ts
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const propertyId = formData.get('propertyId') as string
    
    // 1. Validate inputs
    if (!files.length || !propertyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // 2. Upload files to Supabase Storage
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const fileName = `${propertyId}/${Date.now()}_${file.name}`
        const { data, error } = await supabase.storage
          .from('invoices')
          .upload(fileName, file)
        
        if (error) throw error
        return data
      })
    )
    
    // 3. Create database records
    const documents = await Promise.all(
      uploadedFiles.map(async (upload) => {
        const { data, error } = await supabase
          .from('documents')
          .insert({
            property_id: propertyId,
            file_path: upload.path,
            file_name: upload.path.split('/').pop(),
            file_type: 'invoice',
            status: 'uploaded',
            uploaded_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      })
    )
    
    // 4. Queue for processing
    await Promise.all(
      documents.map((doc) => queueDocumentProcessing(doc.id))
    )
    
    return NextResponse.json({
      success: true,
      documents
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

#### Step 2: Document Classification

**Backend Service**:
```typescript
// lib/services/document-classifier.ts
export async function classifyDocument(documentId: string) {
  // 1. Fetch document from database
  const { data: document } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()
  
  // 2. Get file URL
  const { data: fileUrl } = await supabase.storage
    .from('invoices')
    .createSignedUrl(document.file_path, 3600)
  
  // 3. Call Claude Vision for classification
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'url',
            url: fileUrl.signedUrl
          }
        },
        {
          type: 'text',
          text: `Classify this document as one of:
- INVOICE: A bill or statement showing charges
- CONTRACT: A service agreement with terms
- OTHER: Something else

Also extract:
- Vendor name
- Document date
- Total amount (if invoice)

Return JSON: { "type": "...", "vendor": "...", "date": "...", "amount": ... }`
        }
      ]
    }]
  })
  
  // 4. Parse response
  const classification = JSON.parse(response.content[0].text)
  
  // 5. Update database
  await supabase
    .from('documents')
    .update({
      document_type: classification.type.toLowerCase(),
      vendor_name: classification.vendor,
      document_date: classification.date,
      status: 'classified'
    })
    .eq('id', documentId)
  
  return classification
}
```

#### Step 3: Invoice Data Extraction

**Skills Execution**:
```typescript
// lib/skills/executor.ts
export async function executeInvoiceExtraction(documentId: string) {
  // 1. Get document
  const { data: document } = await supabase
    .from('documents')
    .select('*, property:properties(*)')
    .eq('id', documentId)
    .single()
  
  // 2. Build skill context
  const context: SkillContext = {
    projectId: document.property_id,
    userId: document.uploaded_by,
    project: document.property,
    invoices: [], // Will be populated by skill
    config: await getSkillConfig('invoice-extractor')
  }
  
  // 3. Execute extraction skill
  const skill = new InvoiceExtractorSkill()
  const result = await skill.execute(context)
  
  if (!result.success) {
    throw new Error(result.error.message)
  }
  
  // 4. Store extracted data
  await storeInvoiceData(documentId, result.data)
  
  return result.data
}

async function storeInvoiceData(documentId: string, data: InvoiceExtractionResult) {
  // 1. Create invoice record
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      document_id: documentId,
      invoice_number: data.invoiceNumber,
      invoice_date: data.invoiceDate,
      service_period_start: data.servicePeriodStart,
      service_period_end: data.servicePeriodEnd,
      total_amount: data.totalAmount
    })
    .select()
    .single()
  
  if (invoiceError) throw invoiceError
  
  // 2. Create account records
  for (const account of data.accounts) {
    const { error: accountError } = await supabase
      .from('invoice_accounts')
      .insert({
        invoice_id: invoice.id,
        account_number: account.accountNumber,
        account_name: account.accountName
      })
    
    if (accountError) throw accountError
    
    // 3. Create charge records
    for (const charge of account.charges) {
      await supabase
        .from('invoice_charges')
        .insert({
          invoice_id: invoice.id,
          account_number: account.accountNumber,
          expense_category: charge.category,
          amount: charge.amount,
          haul_count: charge.haulCount,
          notes: charge.notes
        })
    }
  }
}
```

#### Step 4: Historical Analysis

**Skills Execution**:
```typescript
// lib/skills/skills/historical-analyzer.ts
export class HistoricalAnalyzerSkill extends BaseSkill<HistoricalAnalysisResult> {
  readonly name = 'historical-analyzer'
  readonly version = '1.0.0'
  readonly description = 'Analyze invoice history for variances and trends'
  
  protected async executeInternal(context: SkillContext): Promise<HistoricalAnalysisResult> {
    // 1. Fetch all invoices for property
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        *,
        charges:invoice_charges(*)
      `)
      .eq('property_id', context.projectId)
      .order('invoice_date', { ascending: true })
    
    // 2. Group by month and account
    const monthlyData = this.groupByMonthAndAccount(invoices)
    
    // 3. Calculate variances
    const withVariances = this.calculateVariances(monthlyData)
    
    // 4. Flag anomalies
    const withFlags = this.flagAnomalies(withVariances)
    
    // 5. Generate investigation items
    const investigations = this.generateInvestigations(withFlags)
    
    return {
      expenseHistory: withFlags,
      investigations,
      summary: {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
        flaggedItems: investigations.length
      }
    }
  }
  
  private groupByMonthAndAccount(invoices: Invoice[]) {
    const grouped: Record<string, Record<string, ExpenseRecord[]>> = {}
    
    for (const invoice of invoices) {
      const month = format(new Date(invoice.invoice_date), 'MMM yyyy')
      
      if (!grouped[month]) grouped[month] = {}
      
      for (const charge of invoice.charges) {
        const key = charge.account_number
        
        if (!grouped[month][key]) grouped[month][key] = []
        
        grouped[month][key].push({
          month,
          account: charge.account_number,
          category: charge.expense_category,
          amount: charge.amount,
          invoiceNumber: invoice.invoice_number,
          haulCount: charge.haul_count,
          notes: charge.notes
        })
      }
    }
    
    return grouped
  }
  
  private calculateVariances(grouped: Record<string, Record<string, ExpenseRecord[]>>) {
    const withVariances: ExpenseRecord[] = []
    const months = Object.keys(grouped).sort()
    
    for (let i = 0; i < months.length; i++) {
      const currentMonth = months[i]
      const previousMonth = i > 0 ? months[i - 1] : null
      
      for (const [account, records] of Object.entries(grouped[currentMonth])) {
        for (const record of records) {
          let percentChange = 0
          
          if (previousMonth && grouped[previousMonth][account]) {
            const prevRecords = grouped[previousMonth][account]
            const prevRecord = prevRecords.find(r => r.category === record.category)
            
            if (prevRecord) {
              percentChange = ((record.amount - prevRecord.amount) / prevRecord.amount) * 100
            }
          }
          
          withVariances.push({
            ...record,
            percentChange: Math.round(percentChange * 10) / 10
          })
        }
      }
    }
    
    return withVariances
  }
  
  private flagAnomalies(records: ExpenseRecord[]) {
    return records.map(record => ({
      ...record,
      flag: Math.abs(record.percentChange) > 20 ? '🚩 INVESTIGATE' : ''
    }))
  }
  
  private generateInvestigations(records: ExpenseRecord[]) {
    return records
      .filter(r => r.flag)
      .map(r => ({
        month: r.month,
        account: r.account,
        question: `Why did ${r.category} change ${r.percentChange > 0 ? '+' : ''}${r.percentChange}%?`,
        status: 'Open',
        resolution: '[To be determined]'
      }))
  }
}
```

#### Step 5: Optimization Analysis

**Skills Execution**:
```typescript
// lib/skills/skills/optimization-calculator.ts
import {
  COMPACTOR_OPTIMIZATION_THRESHOLD,
  COMPACTOR_TARGET_TONS,
  DSQ_MONITOR_INSTALL,
  DSQ_MONITOR_MONTHLY
} from '@/lib/constants/formulas'

export class OptimizationCalculatorSkill extends BaseSkill<OptimizationResult> {
  readonly name = 'optimization-calculator'
  readonly version = '1.0.0'
  readonly description = 'Calculate waste service optimization opportunities'
  
  protected async executeInternal(context: SkillContext): Promise<OptimizationResult> {
    // 1. Fetch haul log data
    const { data: haulLog } = await supabase
      .from('haul_log')
      .select('*')
      .eq('property_id', context.projectId)
      .order('haul_date', { ascending: false })
      .limit(100)
    
    if (!haulLog || haulLog.length === 0) {
      return {
        recommend: false,
        reason: 'Insufficient haul data'
      }
    }
    
    // 2. Calculate current metrics
    const avgTons = haulLog.reduce((sum, h) => sum + h.tonnage, 0) / haulLog.length
    const maxInterval = Math.max(...haulLog.map(h => h.days_since_last || 0))
    
    // 3. Check if optimization is recommended
    const recommend = avgTons < COMPACTOR_OPTIMIZATION_THRESHOLD && maxInterval <= 14
    
    if (!recommend) {
      return {
        recommend: false,
        reason: avgTons >= COMPACTOR_OPTIMIZATION_THRESHOLD
          ? `Average tonnage (${avgTons.toFixed(2)}) already above threshold (${COMPACTOR_OPTIMIZATION_THRESHOLD})`
          : `Max interval (${maxInterval} days) exceeds 14-day limit`
      }
    }
    
    // 4. Calculate ROI
    const currentAnnualHauls = (365 / maxInterval) * haulLog.length
    const optimizedAnnualHauls = (currentAnnualHauls * avgTons) / COMPACTOR_TARGET_TONS
    const haulsEliminated = currentAnnualHauls - optimizedAnnualHauls
    
    // Get cost per haul from invoices
    const { data: recentInvoices } = await supabase
      .from('invoices')
      .select('*, charges:invoice_charges(*)')
      .eq('property_id', context.projectId)
      .order('invoice_date', { ascending: false })
      .limit(3)
    
    const avgCostPerHaul = this.calculateAvgCostPerHaul(recentInvoices)
    
    const grossAnnualSavings = haulsEliminated * avgCostPerHaul
    const annualMonitorCost = DSQ_MONITOR_MONTHLY * 12
    const netYear1Savings = grossAnnualSavings - DSQ_MONITOR_INSTALL - annualMonitorCost
    const netAnnualSavingsYear2Plus = grossAnnualSavings - annualMonitorCost
    
    const roi = (netYear1Savings / (DSQ_MONITOR_INSTALL + annualMonitorCost)) * 100
    const paybackMonths = (DSQ_MONITOR_INSTALL + annualMonitorCost) / (grossAnnualSavings / 12)
    
    // 5. Build transparent calculation breakdown
    return {
      recommend: true,
      currentState: {
        avgTonsPerHaul: avgTons,
        currentAnnualHauls,
        costPerHaul: avgCostPerHaul,
        currentAnnualCost: currentAnnualHauls * avgCostPerHaul
      },
      targetState: {
        targetTonsPerHaul: COMPACTOR_TARGET_TONS,
        optimizedAnnualHauls,
        costPerHaul: avgCostPerHaul,
        optimizedAnnualCost: optimizedAnnualHauls * avgCostPerHaul
      },
      savings: {
        haulsEliminated,
        grossAnnualSavings,
        monitorInstallCost: DSQ_MONITOR_INSTALL,
        monitorAnnualCost: annualMonitorCost,
        netYear1Savings,
        netAnnualSavingsYear2Plus,
        roi,
        paybackMonths
      },
      calculation: {
        step1: `Current: ${currentAnnualHauls.toFixed(0)} hauls/year × $${avgCostPerHaul.toFixed(2)} = $${(currentAnnualHauls * avgCostPerHaul).toFixed(2)}`,
        step2: `Optimized: ${optimizedAnnualHauls.toFixed(0)} hauls/year × $${avgCostPerHaul.toFixed(2)} = $${(optimizedAnnualHauls * avgCostPerHaul).toFixed(2)}`,
        step3: `Haul Reduction: ${currentAnnualHauls.toFixed(0)} - ${optimizedAnnualHauls.toFixed(0)} = ${haulsEliminated.toFixed(0)} fewer hauls`,
        step4: `Gross Savings: ${haulsEliminated.toFixed(0)} hauls × $${avgCostPerHaul.toFixed(2)} = $${grossAnnualSavings.toFixed(2)}`,
        step5: `Net Year 1: $${grossAnnualSavings.toFixed(2)} - $${DSQ_MONITOR_INSTALL} - $${annualMonitorCost} = $${netYear1Savings.toFixed(2)}`,
        step6: `Net Year 2+: $${grossAnnualSavings.toFixed(2)} - $${annualMonitorCost} = $${netAnnualSavingsYear2Plus.toFixed(2)}`
      }
    }
  }
  
  private calculateAvgCostPerHaul(invoices: any[]): number {
    let totalPickupCost = 0
    let totalHauls = 0
    
    for (const invoice of invoices) {
      const pickupCharges = invoice.charges.filter(
        (c: any) => c.expense_category === 'Pickup Service'
      )
      
      for (const charge of pickupCharges) {
        totalPickupCost += charge.amount
        totalHauls += charge.haul_count || 0
      }
    }
    
    return totalHauls > 0 ? totalPickupCost / totalHauls : 0
  }
}
```

#### Step 6: Report Generation

**Backend Service**:
```typescript
// lib/reports/invoice-report-generator.ts
import ExcelJS from 'exceljs'

export async function generateInvoiceReport(propertyId: string) {
  // 1. Fetch all data
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()
  
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, charges:invoice_charges(*)')
    .eq('property_id', propertyId)
  
  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('property_id', propertyId)
    .single()
  
  // 2. Run analysis
  const historicalAnalysis = await executeSkill('historical-analyzer', { projectId: propertyId })
  const optimization = await executeSkill('optimization-calculator', { projectId: propertyId })
  
  // 3. Create Excel workbook
  const workbook = new ExcelJS.Workbook()
  
  // Sheet 1: Executive Overview
  const overviewSheet = workbook.addWorksheet('Executive Overview')
  overviewSheet.addRow([`${property.name} - EXECUTIVE OVERVIEW`])
  overviewSheet.addRow(['For Leadership Briefings - See Detail Tabs for Operational Analysis'])
  overviewSheet.addRow([])
  overviewSheet.addRow([`Analysis Date: ${new Date().toLocaleDateString()}`])
  // ... more rows
  
  // Sheet 2: Historical Expense Detail
  const expenseSheet = workbook.addWorksheet('Historical Expense Detail')
  expenseSheet.addRow(['Month', 'Account', 'Expense Category', 'Amount', 'Invoice #', 'Haul Count', '% Change', 'Flag'])
  
  for (const record of historicalAnalysis.data.expenseHistory) {
    expenseSheet.addRow([
      record.month,
      record.account,
      record.category,
      record.amount,
      record.invoiceNumber,
      record.haulCount,
      record.percentChange,
      record.flag
    ])
  }
  
  // Apply conditional formatting
  expenseSheet.getColumn(8).eachCell((cell, rowNumber) => {
    if (rowNumber > 1 && cell.value === '🚩 INVESTIGATE') {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC7CE' }
      }
      cell.font = { color: { argb: 'FF9C0006' } }
    }
  })
  
  // Sheet 3: Optimization Analysis
  const optimizationSheet = workbook.addWorksheet('Optimization Analysis')
  optimizationSheet.addRow(['Section', 'Metric', 'Value'])
  optimizationSheet.addRow(['Section 1: Current State', 'Current Annual Hauls', optimization.data.currentState.currentAnnualHauls])
  optimizationSheet.addRow(['', 'Cost Per Haul', `$${optimization.data.currentState.costPerHaul}`])
  optimizationSheet.addRow(['', 'Current Annual Cost', `$${optimization.data.currentState.currentAnnualCost}`])
  optimizationSheet.addRow([])
  optimizationSheet.addRow(['Section 2: With Monitors', 'Optimized Annual Hauls', optimization.data.targetState.optimizedAnnualHauls])
  // ... more rows
  
  // Sheets 4-12: Additional sheets (Implementation Roadmap, Contract Summary, etc.)
  // ... implementation for remaining sheets
  
  // 4. Save workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer()
  
  // 5. Upload to Supabase Storage
  const fileName = `${property.name}_invoice_analysis_${Date.now()}.xlsx`
  const { data: upload, error } = await supabase.storage
    .from('reports')
    .upload(fileName, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
  
  if (error) throw error
  
  // 6. Create download URL
  const { data: urlData } = await supabase.storage
    .from('reports')
    .createSignedUrl(upload.path, 3600 * 24 * 7) // 7 days
  
  return {
    fileName,
    url: urlData.signedUrl
  }
}
```

---

## 5. Contract Processing Workflow

### Simplified Process (Uses Same Infrastructure)

The contract processing workflow follows the same structure as invoice processing, with these key differences:

1. **Classification**: Identified as "contract" instead of "invoice"
2. **Extraction Skill**: Uses `waste-contract-extractor` skill (already exists)
3. **Data Storage**: Stores in `contracts`, `contract_services`, `contract_clauses` tables
4. **Analysis**: Focus on red flags, deadlines, and risk assessment instead of expense variances
5. **Report**: Same 12-sheet Excel format with contract-specific data

**Key Contract Extraction Fields**:
```typescript
interface ContractExtractionResult {
  propertyName: string
  propertyAddress: string
  vendorName: string
  accountNumbers: string[]
  contract: {
    effectiveDate: string
    expirationDate: string
    initialTermYears: number
    renewalTermMonths: number
    autoRenew: boolean
    noticeTermDays: number
    noticeWindowStart: string
    monthlyTotal: number
  }
  serviceSchedules: ServiceSchedule[]
  onCallServices: OnCallService[]
  clauses: {
    termination: ClauseData
    rateIncrease: ClauseData
    serviceLevel: ClauseData
    // ... more clause types
  }
  redFlags: RedFlag[]
}
```

---

## 6. Database Schema

### Core Tables

```sql
-- Documents (uploaded files)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('invoice', 'contract', 'other')),
  document_type TEXT, -- Classified type after processing
  vendor_name TEXT,
  document_date DATE,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'classified', 'processing', 'completed', 'error')),
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  service_period_start DATE,
  service_period_end DATE,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(invoice_number, property_id)
);

-- Invoice Accounts
CREATE TABLE invoice_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  account_name TEXT
);

-- Invoice Charges (granular expense tracking)
CREATE TABLE invoice_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  expense_category TEXT NOT NULL CHECK (expense_category IN (
    'Pickup Service',
    'Disposal',
    'Container Rental',
    'Fuel Surcharge',
    'Franchise Fee',
    'Contamination',
    'Overage',
    'Extra Pickup',
    'Admin'
  )),
  amount DECIMAL(10, 2) NOT NULL,
  haul_count INTEGER,
  haul_method TEXT, -- 'Explicit', 'Calculated', 'Estimated'
  notes TEXT
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  vendor_name TEXT NOT NULL,
  account_numbers TEXT[] NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  initial_term_years INTEGER,
  renewal_term_months INTEGER,
  auto_renew BOOLEAN DEFAULT false,
  notice_term_days INTEGER,
  notice_by_date DATE, -- Calculated: expiration_date - notice_term_days
  monthly_total DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract Services
CREATE TABLE contract_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  container_size TEXT,
  quantity INTEGER,
  frequency TEXT,
  price_per_service DECIMAL(10, 2),
  monthly_price DECIMAL(10, 2)
);

-- Contract Clauses
CREATE TABLE contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  clause_type TEXT NOT NULL,
  article TEXT,
  summary TEXT,
  full_text TEXT,
  severity TEXT CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL'))
);

-- Analysis Results (cached)
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('historical', 'optimization', 'contract')),
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Reports (generated Excel/PDF files)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('invoice', 'contract', 'comparison')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Investigation Tracker
CREATE TABLE investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  invoice_id UUID REFERENCES invoices(id),
  month TEXT NOT NULL,
  account_number TEXT NOT NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
  resolution TEXT,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_invoices_property ON invoices(property_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_charges_invoice ON invoice_charges(invoice_id);
CREATE INDEX idx_charges_category ON invoice_charges(expense_category);
CREATE INDEX idx_contracts_property ON contracts(property_id);
CREATE INDEX idx_contracts_expiration ON contracts(expiration_date);
CREATE INDEX idx_investigations_property ON investigations(property_id);
CREATE INDEX idx_investigations_status ON investigations(status);
```

---

## 7. API Endpoints

### Invoice Endpoints

```typescript
// POST /api/upload/invoice
// Upload invoice files
interface UploadInvoiceRequest {
  files: File[]
  propertyId: string
}
interface UploadInvoiceResponse {
  success: boolean
  documents: Document[]
}

// GET /api/invoices/:propertyId
// Get all invoices for a property
interface GetInvoicesResponse {
  invoices: Invoice[]
  total: number
}

// GET /api/invoices/:invoiceId
// Get single invoice with charges
interface GetInvoiceResponse {
  invoice: Invoice & {
    charges: InvoiceCharge[]
  }
}

// GET /api/invoices/:propertyId/history
// Get historical expense analysis
interface GetHistoryResponse {
  expenseHistory: ExpenseRecord[]
  investigations: Investigation[]
  summary: {
    totalInvoices: number
    totalAmount: number
    flaggedItems: number
  }
}

// GET /api/invoices/:propertyId/optimization
// Get optimization analysis
interface GetOptimizationResponse {
  recommend: boolean
  currentState: OptimizationState
  targetState: OptimizationState
  savings: SavingsCalculation
  calculation: CalculationBreakdown
}

// POST /api/reports/invoice
// Generate invoice report
interface GenerateInvoiceReportRequest {
  propertyId: string
}
interface GenerateInvoiceReportResponse {
  reportId: string
  fileName: string
  url: string
}
```

### Contract Endpoints

```typescript
// POST /api/upload/contract
// Upload contract files
interface UploadContractRequest {
  files: File[]
  propertyId: string
}
interface UploadContractResponse {
  success: boolean
  documents: Document[]
}

// GET /api/contracts/:propertyId
// Get all contracts for a property
interface GetContractsResponse {
  contracts: Contract[]
  total: number
}

// GET /api/contracts/:contractId
// Get single contract with details
interface GetContractResponse {
  contract: Contract & {
    services: ContractService[]
    clauses: ContractClause[]
    redFlags: RedFlag[]
  }
}

// POST /api/reports/contract
// Generate contract report
interface GenerateContractReportRequest {
  contractId: string
}
interface GenerateContractReportResponse {
  reportId: string
  fileName: string
  url: string
}
```

---

## 8. Frontend Components

### Component Structure

```
components/
├── invoice/
│   ├── InvoiceUploadForm.tsx
│   ├── InvoiceList.tsx
│   ├── InvoiceDetailView.tsx
│   ├── ExpenseHistoryTable.tsx
│   ├── InvestigationTracker.tsx
│   ├── OptimizationCard.tsx
│   ├── ReportDownload.tsx
│   └── index.ts
├── contract/
│   ├── ContractUploadForm.tsx
│   ├── ContractList.tsx
│   ├── ContractSummary.tsx
│   ├── ServiceScheduleTable.tsx
│   ├── ClauseViewer.tsx
│   ├── RedFlagAlert.tsx
│   └── index.ts
└── shared/
    ├── FileDropzone.tsx
    ├── DocumentTypeToggle.tsx
    ├── PropertySelector.tsx
    ├── ProcessingStatus.tsx
    └── index.ts
```

### Key Component Examples

**Expense History Table with Flags**:
```typescript
// components/invoice/ExpenseHistoryTable.tsx
export function ExpenseHistoryTable({ propertyId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['expense-history', propertyId],
    queryFn: () => fetchExpenseHistory(propertyId)
  })
  
  if (isLoading) return <Skeleton className="h-96" />
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Historical Expense Detail</h2>
        <Button onClick={() => exportToExcel(data)}>
          <Download className="mr-2" />
          Export to Excel
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead className="text-right">Hauls</TableHead>
            <TableHead className="text-right">% Change</TableHead>
            <TableHead>Flag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.expenseHistory.map((record) => (
            <TableRow
              key={record.id}
              className={record.flag ? 'bg-red-50' : ''}
            >
              <TableCell>{record.month}</TableCell>
              <TableCell className="font-mono">{record.account}</TableCell>
              <TableCell>{record.category}</TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(record.amount)}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {record.invoiceNumber}
              </TableCell>
              <TableCell className="text-right">
                {record.haulCount || '-'}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-semibold',
                  record.percentChange > 20 && 'text-red-600',
                  record.percentChange < -20 && 'text-green-600'
                )}
              >
                {record.percentChange > 0 && '+'}
                {record.percentChange.toFixed(1)}%
              </TableCell>
              <TableCell>
                {record.flag && (
                  <Badge variant="destructive">
                    🚩 {record.flag}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {data.investigations.length > 0 && (
        <InvestigationTracker investigations={data.investigations} />
      )}
    </div>
  )
}
```

**Transparent Optimization Display**:
```typescript
// components/invoice/OptimizationCard.tsx
export function OptimizationCard({ optimization }: Props) {
  if (!optimization.recommend) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Optimization Recommended</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{optimization.reason}</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="text-green-700">
          Optimization Opportunity Identified
        </CardTitle>
        <CardDescription>
          Transparent step-by-step savings calculation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="current">Current State</TabsTrigger>
            <TabsTrigger value="target">With Monitors</TabsTrigger>
            <TabsTrigger value="calculation">Step-by-Step Math</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <MetricCard
                label="Hauls Eliminated"
                value={`${optimization.savings.haulsEliminated.toFixed(0)}/year`}
                icon={TrendingDown}
              />
              <MetricCard
                label="Gross Savings"
                value={formatCurrency(optimization.savings.grossAnnualSavings)}
                icon={DollarSign}
              />
              <MetricCard
                label="Net Savings (Year 1)"
                value={formatCurrency(optimization.savings.netYear1Savings)}
                valueClassName="text-2xl font-bold text-green-600"
                icon={CheckCircle}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="ROI"
                value={`${optimization.savings.roi.toFixed(1)}%`}
              />
              <MetricCard
                label="Payback Period"
                value={`${optimization.savings.paybackMonths.toFixed(1)} months`}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="current">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current State</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow
                  label="Average Tons Per Haul"
                  value={`${optimization.currentState.avgTonsPerHaul.toFixed(2)} tons`}
                />
                <InfoRow
                  label="Annual Hauls"
                  value={`${optimization.currentState.currentAnnualHauls.toFixed(0)} hauls`}
                />
                <InfoRow
                  label="Cost Per Haul"
                  value={formatCurrency(optimization.currentState.costPerHaul)}
                />
                <InfoRow
                  label="Annual Cost"
                  value={formatCurrency(optimization.currentState.currentAnnualCost)}
                  valueClassName="font-bold"
                />
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-mono text-sm">
                  {optimization.calculation.step1}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="target">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">With DSQ Monitors</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow
                  label="Target Tons Per Haul"
                  value={`${optimization.targetState.targetTonsPerHaul} tons`}
                />
                <InfoRow
                  label="Optimized Annual Hauls"
                  value={`${optimization.targetState.optimizedAnnualHauls.toFixed(0)} hauls`}
                />
                <InfoRow
                  label="Cost Per Haul"
                  value={formatCurrency(optimization.targetState.costPerHaul)}
                />
                <InfoRow
                  label="Annual Cost"
                  value={formatCurrency(optimization.targetState.optimizedAnnualCost)}
                  valueClassName="font-bold text-green-600"
                />
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg space-y-2">
                <p className="font-mono text-sm">
                  {optimization.calculation.step2}
                </p>
                <p className="font-mono text-sm">
                  {optimization.calculation.step3}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="calculation">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Complete Calculation Breakdown</h3>
              
              <div className="space-y-3">
                {Object.entries(optimization.calculation).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase mb-1">
                      {key.replace('step', 'Step ')}
                    </div>
                    <div className="font-mono text-sm">{value}</div>
                  </div>
                ))}
              </div>
              
              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertTitle>All Values Transparent</AlertTitle>
                <AlertDescription>
                  Every number in this calculation can be traced back to source invoices
                  and haul records. Ask questions at any time.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
```

---

## 9. Skills Integration

### Existing Skills to Leverage

1. **waste-contract-extractor** (v2.1)
   - Already handles both invoices and contracts
   - Granular expense tracking
   - Transparent optimization calculations
   - 12-sheet Excel output

2. **wastewise-analytics-validated**
   - Complete property analysis
   - 40+ validation checks
   - Can be extended for invoice-specific analysis

3. **compactor-optimization**
   - Focused ROI calculations
   - Equipment-specific analysis
   - Can feed into invoice optimization

### New Skills to Create

1. **invoice-extractor**
   ```typescript
   // Purpose: Extract structured data from invoice PDFs
   // Input: Document file URL
   // Output: InvoiceExtractionResult
   // Uses: Claude Vision API
   ```

2. **historical-analyzer**
   ```typescript
   // Purpose: Analyze expense trends and variances
   // Input: Array of invoices
   // Output: HistoricalAnalysisResult with flags
   // Uses: TypeScript calculations
   ```

3. **optimization-calculator**
   ```typescript
   // Purpose: Calculate savings opportunities
   // Input: Invoice data + haul log
   // Output: OptimizationResult with transparent math
   // Uses: Canonical formulas from formulas.ts
   ```

### Skills Registry Updates

```typescript
// lib/skills/registry.ts

// Register new skills
skillRegistry.register('invoice-extractor', new InvoiceExtractorSkill())
skillRegistry.register('historical-analyzer', new HistoricalAnalyzerSkill())
skillRegistry.register('optimization-calculator', new OptimizationCalculatorSkill())

// Register existing skills for contract processing
skillRegistry.register('waste-contract-extractor', wasteContractExtractorSkill)
```

---

## 10. Error Handling & Recovery

### Error Scenarios

1. **Upload Failures**
   ```typescript
   try {
     await uploadFile(file)
   } catch (error) {
     if (error.code === 'FILE_TOO_LARGE') {
       showToast({
         title: 'File Too Large',
         description: 'Maximum file size is 10MB. Please compress and try again.',
         variant: 'destructive'
       })
     } else if (error.code === 'INVALID_FILE_TYPE') {
       showToast({
         title: 'Invalid File Type',
         description: 'Only PDF, JPEG, and PNG files are supported.',
         variant: 'destructive'
       })
     } else {
       // Log to error tracking service
       logError('upload_failed', error)
       showToast({
         title: 'Upload Failed',
         description: 'Please try again or contact support.',
         variant: 'destructive'
       })
     }
   }
   ```

2. **Extraction Failures**
   ```typescript
   try {
     const result = await executeSkill('invoice-extractor', context)
     
     if (!result.success) {
       // Partial extraction - save what we have
       await savePartialExtraction(documentId, result.data)
       
       // Flag for manual review
       await flagForReview(documentId, result.error.message)
       
       showToast({
         title: 'Partial Extraction',
         description: 'Some data could not be extracted. Flagged for manual review.',
         variant: 'warning'
       })
     }
   } catch (error) {
     // Complete failure - retry or escalate
     await updateDocumentStatus(documentId, 'error', error.message)
     
     showToast({
       title: 'Extraction Failed',
       description: 'Unable to process document. Our team has been notified.',
       variant: 'destructive'
     })
   }
   ```

3. **Claude API Timeouts**
   ```typescript
   async function extractWithRetry(documentUrl: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await callClaudeVision(documentUrl)
       } catch (error) {
         if (error.code === 'TIMEOUT' && i < maxRetries - 1) {
           // Exponential backoff
           await sleep(Math.pow(2, i) * 1000)
           continue
         }
         throw error
       }
     }
   }
   ```

4. **Database Failures**
   ```typescript
   async function storeInvoiceDataWithRollback(documentId: string, data: InvoiceData) {
     const client = await supabase.createClient()
     
     try {
       await client.query('BEGIN')
       
       const invoice = await insertInvoice(data)
       await insertAccounts(invoice.id, data.accounts)
       await insertCharges(invoice.id, data.charges)
       
       await client.query('COMMIT')
       
       return invoice
     } catch (error) {
       await client.query('ROLLBACK')
       throw error
     }
   }
   ```

### Recovery Strategies

1. **Automatic Retry Queue**
   ```typescript
   // lib/queues/document-processing-queue.ts
   export async function queueDocumentProcessing(documentId: string) {
     await redis.rpush('document-queue', JSON.stringify({
       documentId,
       attemptCount: 0,
       queuedAt: Date.now()
     }))
   }
   
   export async function processDocumentQueue() {
     while (true) {
       const item = await redis.lpop('document-queue')
       if (!item) {
         await sleep(5000)
         continue
       }
       
       const { documentId, attemptCount } = JSON.parse(item)
       
       try {
         await processDocument(documentId)
       } catch (error) {
         if (attemptCount < 3) {
           // Retry
           await redis.rpush('document-queue', JSON.stringify({
             documentId,
             attemptCount: attemptCount + 1,
             queuedAt: Date.now()
           }))
         } else {
           // Escalate to manual review
           await flagForManualReview(documentId, error)
         }
       }
     }
   }
   ```

2. **Manual Review Interface**
   ```typescript
   // components/admin/ManualReviewQueue.tsx
   export function ManualReviewQueue() {
     const { data: reviewItems } = useQuery({
       queryKey: ['manual-review'],
       queryFn: fetchManualReviewItems
     })
     
     return (
       <div>
         <h2>Documents Flagged for Manual Review</h2>
         {reviewItems.map((item) => (
           <Card key={item.id}>
             <CardHeader>
               <CardTitle>{item.fileName}</CardTitle>
               <CardDescription>
                 Failed after {item.attemptCount} attempts
               </CardDescription>
             </CardHeader>
             <CardContent>
               <p className="text-sm text-red-600">{item.errorMessage}</p>
               <div className="flex gap-2 mt-4">
                 <Button onClick={() => retryProcessing(item.id)}>
                   Retry Processing
                 </Button>
                 <Button variant="outline" onClick={() => viewDocument(item.id)}>
                   View Document
                 </Button>
                 <Button variant="outline" onClick={() => manualEntry(item.id)}>
                   Manual Entry
                 </Button>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
     )
   }
   ```

---

## 11. Testing Strategy

### Test Coverage Goals

- **Unit Tests**: 90%+ coverage for skills and utilities
- **Integration Tests**: All API endpoints
- **E2E Tests**: Complete user workflows
- **Calculation Evals**: <0.01% tolerance

### Test Structure

```
__tests__/
├── unit/
│   ├── skills/
│   │   ├── invoice-extractor.test.ts
│   │   ├── historical-analyzer.test.ts
│   │   └── optimization-calculator.test.ts
│   ├── utils/
│   │   ├── date-helpers.test.ts
│   │   └── currency-formatter.test.ts
│   └── calculations/
│       ├── variance.test.ts
│       └── roi.test.ts
├── integration/
│   ├── api/
│   │   ├── upload-invoice.test.ts
│   │   ├── get-invoices.test.ts
│   │   └── generate-report.test.ts
│   └── database/
│       ├── invoice-storage.test.ts
│       └── contract-storage.test.ts
├── e2e/
│   ├── invoice-upload.test.ts
│   ├── invoice-analysis.test.ts
│   ├── contract-upload.test.ts
│   └── report-generation.test.ts
└── evals/
    ├── invoice-extraction-accuracy.test.ts
    ├── variance-calculation.test.ts
    └── optimization-calculation.test.ts
```

### Key Test Examples

**Invoice Extraction Eval**:
```typescript
// __tests__/evals/invoice-extraction-accuracy.test.ts
describe('Invoice Extraction Accuracy Evals', () => {
  const testInvoices = [
    {
      file: 'test-data/invoice-wm-2024-01.pdf',
      expected: {
        invoiceNumber: 'WM-2024-001',
        invoiceDate: '2024-01-15',
        totalAmount: 3456.78,
        accounts: [
          {
            accountNumber: '0156898',
            charges: [
              { category: 'Pickup Service', amount: 1176.00, haulCount: 4 }
            ]
          }
        ]
      }
    },
    // ... more test cases
  ]
  
  test.each(testInvoices)('extracts data accurately from $file', async ({ file, expected }) => {
    const skill = new InvoiceExtractorSkill()
    const context = await buildTestContext(file)
    
    const result = await skill.execute(context)
    
    expect(result.success).toBe(true)
    expect(result.data.invoiceNumber).toBe(expected.invoiceNumber)
    expect(result.data.invoiceDate).toBe(expected.invoiceDate)
    expect(result.data.totalAmount).toBeCloseTo(expected.totalAmount, 2)
    expect(result.data.accounts).toHaveLength(expected.accounts.length)
    
    for (const [i, account] of expected.accounts.entries()) {
      expect(result.data.accounts[i].accountNumber).toBe(account.accountNumber)
      expect(result.data.accounts[i].charges).toMatchObject(account.charges)
    }
  })
  
  test('accuracy exceeds 95% threshold', async () => {
    const results = await Promise.all(
      testInvoices.map(async ({ file, expected }) => {
        const skill = new InvoiceExtractorSkill()
        const context = await buildTestContext(file)
        const result = await skill.execute(context)
        
        return {
          correct: result.data.invoiceNumber === expected.invoiceNumber &&
                   result.data.totalAmount === expected.totalAmount,
          result
        }
      })
    )
    
    const accuracy = results.filter(r => r.correct).length / results.length
    
    expect(accuracy).toBeGreaterThanOrEqual(0.95)
  })
})
```

**E2E Upload & Analysis Flow**:
```typescript
// __tests__/e2e/invoice-upload.test.ts
test('complete invoice upload and analysis workflow', async ({ page }) => {
  // 1. Navigate to upload page
  await page.goto('/upload')
  await expect(page.locator('h1')).toContainText('Upload Documents')
  
  // 2. Select property
  await page.click('[data-testid="property-selector"]')
  await page.click('text=Test Property ABC')
  
  // 3. Upload file
  await page.setInputFiles('input[type="file"]', 'test-data/invoice-wm-2024-01.pdf')
  
  // 4. Confirm it's an invoice
  await page.click('button:has-text("Invoice")')
  
  // 5. Process
  await page.click('button:has-text("Upload & Process")')
  
  // 6. Wait for processing (up to 60 seconds)
  await expect(page.locator('[data-testid="processing-status"]'))
    .toContainText('Processing Complete', { timeout: 60000 })
  
  // 7. Navigate to analysis page
  await page.click('text=View Analysis')
  
  // 8. Verify expense history displayed
  await expect(page.locator('[data-testid="expense-history-table"]')).toBeVisible()
  
  // 9. Check for flagged items
  const flaggedRows = await page.locator('td:has-text("🚩 INVESTIGATE")').count()
  expect(flaggedRows).toBeGreaterThan(0)
  
  // 10. Verify optimization card
  await expect(page.locator('[data-testid="optimization-card"]')).toBeVisible()
  
  // 11. Check savings calculation
  const netSavings = await page.locator('[data-testid="net-savings"]').textContent()
  expect(netSavings).toMatch(/\$[\d,]+/)
  
  // 12. Download report
  await page.click('button:has-text("Download Excel")')
  
  // 13. Verify download started
  const download = await page.waitForEvent('download')
  expect(download.suggestedFilename()).toContain('.xlsx')
})
```

---

## 12. Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

**Tasks**:
1. Set up database schema (documents, invoices, contracts tables)
2. Create file upload API endpoint
3. Implement document classification with Claude Vision
4. Build basic upload UI component

**Acceptance Criteria**:
- [ ] User can upload PDF/image files
- [ ] Files stored in Supabase Storage
- [ ] Documents classified as invoice vs contract
- [ ] Database records created
- [ ] Basic UI shows upload status

**Branch**: `main` → `feature/invoice-contract-foundation`

---

### Phase 2: Invoice Extraction (Weeks 3-4)

**Tasks**:
1. Create InvoiceExtractorSkill
2. Implement granular charge extraction
3. Build database storage for invoices and charges
4. Create invoice detail view UI

**Acceptance Criteria**:
- [ ] Invoice data extracted with >95% accuracy
- [ ] Account-level charges stored
- [ ] Haul counts calculated
- [ ] UI displays invoice details
- [ ] Extraction evals passing

**Branch**: `feature/invoice-contract-foundation` → `feature/invoice-extraction`

---

### Phase 3: Historical Analysis (Weeks 5-6)

**Tasks**:
1. Create HistoricalAnalyzerSkill
2. Implement variance calculations
3. Build investigation tracker
4. Create expense history UI component

**Acceptance Criteria**:
- [ ] Month-over-month variances calculated
- [ ] Items auto-flagged (>20% change)
- [ ] Investigation tracker functional
- [ ] UI displays sortable/filterable table
- [ ] Calculation evals passing (<0.01% tolerance)

**Branch**: `feature/invoice-extraction` → `feature/historical-analysis`

---

### Phase 4: Optimization Calculations (Weeks 7-8)

**Tasks**:
1. Create OptimizationCalculatorSkill
2. Implement transparent savings calculations
3. Use canonical formulas from formulas.ts
4. Build optimization display UI

**Acceptance Criteria**:
- [ ] Optimization recommendations accurate
- [ ] Step-by-step calculations transparent
- [ ] Uses COMPACTOR_OPTIMIZATION_THRESHOLD (6.0)
- [ ] UI shows current vs target state
- [ ] Calculation evals passing
- [ ] Conversion rate validation passing

**Branch**: `feature/historical-analysis` → `feature/optimization-calculation`

---

### Phase 5: Contract Processing (Weeks 9-10)

**Tasks**:
1. Adapt waste-contract-extractor skill
2. Implement contract data storage
3. Build contract summary UI
4. Add red flag detection

**Acceptance Criteria**:
- [ ] Contract terms extracted accurately
- [ ] Critical dates identified
- [ ] Red flags surfaced
- [ ] UI displays contract summary
- [ ] Notice deadlines calculated

**Branch**: `feature/optimization-calculation` → `feature/contract-processing`

---

### Phase 6: Report Generation (Weeks 11-12)

**Tasks**:
1. Implement Excel report generator (12 sheets)
2. Apply formatting and conditional styling
3. Build report download UI
4. Add PDF export option

**Acceptance Criteria**:
- [ ] 12-sheet Excel workbook generated
- [ ] All data sections included
- [ ] Formatting matches spec
- [ ] Download links functional
- [ ] PDF export working

**Branch**: `feature/contract-processing` → `feature/report-generation`

---

### Phase 7: Testing & Validation (Weeks 13-14)

**Tasks**:
1. Write comprehensive unit tests
2. Create integration tests for APIs
3. Build E2E test suite
4. Run calculation evals
5. Performance testing

**Acceptance Criteria**:
- [ ] 90%+ unit test coverage
- [ ] All integration tests passing
- [ ] E2E workflows tested
- [ ] Calculation evals <0.01% tolerance
- [ ] Performance targets met

**Branch**: `feature/report-generation` → `testing/comprehensive-suite`

---

### Phase 8: Deployment & Documentation (Week 15)

**Tasks**:
1. Merge to main
2. Deploy to production
3. Write user documentation
4. Create video tutorials
5. Set up monitoring and alerts

**Acceptance Criteria**:
- [ ] Deployed to production
- [ ] User guide published
- [ ] Training videos created
- [ ] Monitoring active
- [ ] Support team trained

**Branch**: `testing/comprehensive-suite` → `main`

---

## Conclusion

This architecture provides a complete, production-ready system for processing waste invoices and contracts using the existing agent ecosystem. Key highlights:

**Strengths**:
- Leverages existing agent structure
- Uses proven waste management skills
- Granular expense tracking for operational users
- Transparent optimization calculations
- Comprehensive error handling
- Extensive test coverage

**Next Steps**:
1. Review and approve architecture
2. Begin Phase 1 implementation
3. Orchestrator allocates tasks to agents
4. Monitor progress via daily standups
5. Iterate based on feedback

**Estimated Timeline**: 15 weeks to full production deployment

---

**Version**: 1.0  
**Author**: Assistant  
**Date**: November 27, 2025  
**Status**: Ready for Implementation