/**
 * Claude Vision API Utility
 *
 * Provides utilities for extracting structured data from documents using
 * Claude Vision API (Claude 3.5 Sonnet).
 *
 * Supports:
 * - Invoice data extraction
 * - Haul log extraction
 * - Contract data extraction
 * - Base64 image encoding
 * - Cost calculation
 */

import Anthropic from '@anthropic-ai/sdk'
import type { InvoiceData, HaulLogEntry, ContractData } from '@/lib/skills/types'

// Anthropic API pricing (as of Dec 2024)
const INPUT_COST_PER_MTK = 3.0 // $3 per million tokens
const OUTPUT_COST_PER_MTK = 15.0 // $15 per million tokens

/**
 * Calculate cost for Anthropic API usage
 */
export function calculateAnthropicCost(usage: {
  input_tokens: number
  output_tokens: number
}): number {
  const inputCost = (usage.input_tokens / 1_000_000) * INPUT_COST_PER_MTK
  const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_MTK
  return inputCost + outputCost
}

/**
 * Invoice extraction prompt template
 */
const INVOICE_EXTRACTION_PROMPT = `Extract the following data from this waste management invoice:

Property Information:
- Property name
- Property address
- Number of units (if available)

Service Information:
- Service period (start and end dates)
- Billing date
- Invoice number

Line Items (for each service):
- Service description
- Container type (compactor, dumpster, open top)
- Container size (cubic yards or tons)
- Quantity
- Frequency (pickups per week/month)
- Unit price
- Total price

Totals:
- Subtotal
- Tax
- Total amount

Vendor:
- Company name
- Contact information

Return the data as JSON matching this exact schema (use null for missing values):
{
  "property": {
    "name": "string",
    "address": "string",
    "units": number | null
  },
  "service": {
    "periodStart": "YYYY-MM-DD",
    "periodEnd": "YYYY-MM-DD",
    "invoiceNumber": "string",
    "billingDate": "YYYY-MM-DD"
  },
  "lineItems": [
    {
      "description": "string",
      "containerType": "COMPACTOR" | "DUMPSTER" | "OPEN_TOP" | "OTHER",
      "containerSize": number,
      "quantity": number,
      "frequency": "string",
      "unitPrice": number,
      "totalPrice": number
    }
  ],
  "totals": {
    "subtotal": number,
    "tax": number,
    "total": number
  },
  "vendor": {
    "name": "string",
    "contact": "string" | null
  }
}

IMPORTANT:
- Use uppercase for containerType: "COMPACTOR", "DUMPSTER", "OPEN_TOP", or "OTHER"
- If container type is unclear, use "OTHER"
- All numbers should be numeric values, not strings
- Dates should be in YYYY-MM-DD format
- Return ONLY the JSON object, no additional text`

/**
 * Haul log extraction prompt template
 */
const HAUL_LOG_EXTRACTION_PROMPT = `Extract haul log entries from this document. For each service record, extract:

- Date and time
- Container type and size
- Weight (tons) or volume (cubic yards)
- Service type (pickup, delivery, exchange, etc.)
- Notes or comments

Return as JSON array matching this schema:
[
  {
    "date": "YYYY-MM-DD",
    "time": "HH:MM" | null,
    "containerType": "COMPACTOR" | "DUMPSTER" | "OPEN_TOP" | "OTHER",
    "containerSize": number,
    "weight": number | null,
    "volume": number | null,
    "serviceType": "PICKUP" | "DELIVERY" | "EXCHANGE" | "OTHER",
    "notes": "string" | null
  }
]

IMPORTANT:
- Use uppercase for containerType: "COMPACTOR", "DUMPSTER", "OPEN_TOP", or "OTHER"
- Use uppercase for serviceType: "PICKUP", "DELIVERY", "EXCHANGE", or "OTHER"
- All numbers should be numeric values, not strings
- Dates should be in YYYY-MM-DD format
- Time should be in HH:MM format (24-hour)
- Return ONLY the JSON array, no additional text`

/**
 * Extract invoice data from a document using Claude Vision
 */
export async function extractInvoiceWithVision(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{
  invoice: InvoiceData
  usage: { input_tokens: number; output_tokens: number }
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const base64Data = fileBuffer.toString('base64')

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as
                | 'image/jpeg'
                | 'image/png'
                | 'image/gif'
                | 'image/webp',
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: INVOICE_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  })

  // Extract text content from response
  const textContent = message.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude Vision response')
  }

  // Parse JSON response
  let extractedData: any
  try {
    // Remove markdown code blocks if present
    let jsonText = textContent.text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '')
    }
    extractedData = JSON.parse(jsonText)
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from Claude Vision response: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  // Transform extracted data to InvoiceData format
  const invoice: InvoiceData = {
    sourceFile: fileName,
    extractionDate: new Date().toISOString(),
    propertyName: extractedData.property?.name || '',
    propertyAddress: extractedData.property?.address || '',
    units: extractedData.property?.units || undefined,
    servicePeriodStart: extractedData.service?.periodStart || '',
    servicePeriodEnd: extractedData.service?.periodEnd || '',
    invoiceNumber: extractedData.service?.invoiceNumber || '',
    billingDate: extractedData.service?.billingDate || '',
    lineItems: (extractedData.lineItems || []).map((item: any) => ({
      description: item.description || '',
      containerType: item.containerType || 'OTHER',
      containerSize: item.containerSize || 0,
      quantity: item.quantity || 0,
      frequency: item.frequency || '',
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || 0,
    })),
    subtotal: extractedData.totals?.subtotal || 0,
    tax: extractedData.totals?.tax || 0,
    total: extractedData.totals?.total || 0,
    vendorName: extractedData.vendor?.name || '',
    vendorContact: extractedData.vendor?.contact || undefined,
  }

  return {
    invoice,
    usage: message.usage,
  }
}

/**
 * Extract haul log entries from a document using Claude Vision
 */
export async function extractHaulLogWithVision(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{
  haulLogs: HaulLogEntry[]
  usage: { input_tokens: number; output_tokens: number }
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const base64Data = fileBuffer.toString('base64')

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as
                | 'image/jpeg'
                | 'image/png'
                | 'image/gif'
                | 'image/webp',
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: HAUL_LOG_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  })

  // Extract text content from response
  const textContent = message.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude Vision response')
  }

  // Parse JSON response
  let extractedData: any[]
  try {
    // Remove markdown code blocks if present
    let jsonText = textContent.text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '')
    }
    extractedData = JSON.parse(jsonText)
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from Claude Vision response: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  // Transform extracted data to HaulLogEntry format
  const haulLogs: HaulLogEntry[] = extractedData.map((entry: any) => ({
    sourceFile: fileName,
    date: entry.date || '',
    time: entry.time || undefined,
    containerType: entry.containerType || 'OTHER',
    containerSize: entry.containerSize || 0,
    weight: entry.weight || undefined,
    volume: entry.volume || undefined,
    serviceType: entry.serviceType || 'OTHER',
    notes: entry.notes || undefined,
  }))

  return {
    haulLogs,
    usage: message.usage,
  }
}

/**
 * Contract extraction prompt template
 */
const CONTRACT_EXTRACTION_PROMPT = `Extract the following information from this waste management service contract:

PROPERTY & VENDOR:
- Property name and address
- Number of units (if residential)
- Vendor/hauler name and contact
- Contract effective date (start)
- Contract expiration date (end)
- Contract term length (in months)
- Auto-renewal clause (yes/no/not specified)

SERVICE SPECIFICATIONS:
- Container types and sizes
- Service frequency (e.g., "2x per week", "1x per month")
- Service days/times
- Additional services included

PRICING:
- Monthly base fee (if applicable)
- Per-pickup rate
- Per-ton rate
- Fuel surcharge (percentage or fixed)
- Other fees (disposal, admin, etc.)
- Price escalation terms
- CPI adjustment clause

TERMS & OBLIGATIONS:
- Termination notice period (days)
- Early termination penalty ($ or %)
- Insurance requirements
- Payment terms (net 30, etc.)
- Late payment penalty

Return as JSON matching this schema (use null for missing values):
{
  "property": {
    "name": "string",
    "address": "string",
    "units": number | null
  },
  "vendor": {
    "name": "string",
    "contact": "string" | null,
    "phone": "string" | null,
    "email": "string" | null
  },
  "contractDates": {
    "effectiveDate": "YYYY-MM-DD",
    "expirationDate": "YYYY-MM-DD",
    "termMonths": number,
    "autoRenew": boolean
  },
  "services": [
    {
      "containerType": "COMPACTOR" | "DUMPSTER" | "OPEN_TOP" | "OTHER",
      "containerSize": number,
      "frequency": "string",
      "serviceDays": "string" | null
    }
  ],
  "pricing": {
    "monthlyBase": number | null,
    "perPickup": number | null,
    "perTon": number | null,
    "fuelSurcharge": number | null,
    "otherFees": [{"description": "string", "amount": number}] | null,
    "escalationClause": "string" | null,
    "cpiAdjustment": boolean
  },
  "terms": {
    "terminationNoticeDays": number,
    "earlyTerminationPenalty": "string" | null,
    "insuranceRequired": boolean,
    "paymentTerms": "string",
    "latePenalty": "string" | null
  }
}

IMPORTANT:
- Use uppercase for containerType: "COMPACTOR", "DUMPSTER", "OPEN_TOP", or "OTHER"
- All numbers should be numeric values, not strings
- Dates should be in YYYY-MM-DD format
- Return ONLY the JSON object, no additional text`

/**
 * Extract contract data from a document using Claude Vision
 */
export async function extractContractData(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{
  contract: ContractData
  usage: { input_tokens: number; output_tokens: number }
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const base64Data = fileBuffer.toString('base64')

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as
                | 'image/jpeg'
                | 'image/png'
                | 'image/gif'
                | 'image/webp',
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: CONTRACT_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  })

  // Extract text content from response
  const textContent = message.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude Vision response')
  }

  // Parse JSON response
  let extractedData: any
  try {
    // Remove markdown code blocks if present
    let jsonText = textContent.text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '')
    }
    extractedData = JSON.parse(jsonText)
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from Claude Vision response: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  // Transform extracted data to ContractData format
  const contract: ContractData = {
    sourceFile: fileName,
    extractionDate: new Date().toISOString(),
    property: {
      name: extractedData.property?.name || '',
      address: extractedData.property?.address || '',
      units: extractedData.property?.units || undefined,
    },
    vendor: {
      name: extractedData.vendor?.name || '',
      contact: extractedData.vendor?.contact || undefined,
      phone: extractedData.vendor?.phone || undefined,
      email: extractedData.vendor?.email || undefined,
    },
    contractDates: {
      effectiveDate: extractedData.contractDates?.effectiveDate || '',
      expirationDate: extractedData.contractDates?.expirationDate || '',
      termMonths: extractedData.contractDates?.termMonths || 0,
      autoRenew: extractedData.contractDates?.autoRenew ?? false,
    },
    services: (extractedData.services || []).map((service: any) => ({
      containerType: service.containerType || 'OTHER',
      containerSize: service.containerSize || 0,
      frequency: service.frequency || '',
      serviceDays: service.serviceDays || undefined,
    })),
    pricing: {
      monthlyBase: extractedData.pricing?.monthlyBase || undefined,
      perPickup: extractedData.pricing?.perPickup || undefined,
      perTon: extractedData.pricing?.perTon || undefined,
      fuelSurcharge: extractedData.pricing?.fuelSurcharge || undefined,
      otherFees: extractedData.pricing?.otherFees || undefined,
      escalationClause: extractedData.pricing?.escalationClause || undefined,
      cpiAdjustment: extractedData.pricing?.cpiAdjustment ?? false,
    },
    terms: {
      terminationNoticeDays: extractedData.terms?.terminationNoticeDays || 30,
      earlyTerminationPenalty: extractedData.terms?.earlyTerminationPenalty || undefined,
      insuranceRequired: extractedData.terms?.insuranceRequired ?? false,
      paymentTerms: extractedData.terms?.paymentTerms || 'Net 30',
      latePenalty: extractedData.terms?.latePenalty || undefined,
    },
  }

  return {
    contract,
    usage: message.usage,
  }
}

/**
 * Detect document type from file name and content
 */
export function detectDocumentType(fileName: string): 'invoice' | 'haul-log' | 'contract' | 'unknown' {
  const lowerName = fileName.toLowerCase()

  // Contract patterns
  if (
    lowerName.includes('contract') ||
    lowerName.includes('agreement') ||
    lowerName.includes('service agreement')
  ) {
    return 'contract'
  }

  // Invoice patterns
  if (
    lowerName.includes('invoice') ||
    lowerName.includes('bill') ||
    lowerName.includes('statement')
  ) {
    return 'invoice'
  }

  // Haul log patterns
  if (
    lowerName.includes('haul') ||
    lowerName.includes('log') ||
    lowerName.includes('pickup') ||
    lowerName.includes('service')
  ) {
    return 'haul-log'
  }

  return 'unknown'
}
