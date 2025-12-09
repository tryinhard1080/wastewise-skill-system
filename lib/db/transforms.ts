/**
 * Data Transformation Utilities
 *
 * Transforms raw database records into application-specific formats.
 * Useful for preparing data for dashboards, reports, and API responses.
 */

import type { Database } from '@/types/database.types'
import type {
  InvoiceRecord,
  HaulLogRecord,
  OptimizationRecord,
  ContractRecord,
  RegulatoryRecord,
} from './index'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type InvoiceRow = Database['public']['Tables']['invoice_data']['Row']
type HaulLogRow = Database['public']['Tables']['haul_log']['Row']
type OptimizationRow = Database['public']['Tables']['optimizations']['Row']
type ContractRow = Database['public']['Tables']['contract_terms']['Row']

/**
 * Transform invoice database rows into records
 */
export function invoiceRowToRecord(row: InvoiceRow): InvoiceRecord {
  return {
    id: row.id,
    project_id: row.project_id,
    source_file_id: row.source_file_id ?? undefined,
    invoice_number: row.invoice_number ?? undefined,
    invoice_date: row.invoice_date,
    vendor_name: row.vendor_name,
    service_type: row.service_type ?? undefined,
    total_amount: row.total_amount,
    tonnage: row.tonnage ?? undefined,
    hauls: row.hauls ?? undefined,
    charges: (row.charges as any) ?? undefined,
    notes: row.notes ?? undefined,
  }
}

/**
 * Transform haul log database rows into records
 */
export function haulLogRowToRecord(row: HaulLogRow): HaulLogRecord {
  return {
    id: row.id,
    project_id: row.project_id,
    invoice_id: row.invoice_id ?? undefined,
    haul_date: row.haul_date,
    tonnage: row.tonnage,
    days_since_last: row.days_since_last ?? undefined,
    status: (row.status as 'normal' | 'low_utilization' | 'high_utilization') ?? undefined,
  }
}

/**
 * Calculate invoice summary statistics
 */
export interface InvoiceSummary {
  totalInvoices: number
  totalAmount: number
  totalTonnage: number
  totalHauls: number
  averageInvoiceAmount: number
  averageTonnagePerHaul: number
  dateRange: {
    start: string
    end: string
  }
  vendorBreakdown: Array<{
    vendor: string
    count: number
    totalAmount: number
  }>
}

export function calculateInvoiceSummary(invoices: InvoiceRow[]): InvoiceSummary {
  if (invoices.length === 0) {
    return {
      totalInvoices: 0,
      totalAmount: 0,
      totalTonnage: 0,
      totalHauls: 0,
      averageInvoiceAmount: 0,
      averageTonnagePerHaul: 0,
      dateRange: { start: '', end: '' },
      vendorBreakdown: [],
    }
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0)
  const totalTonnage = invoices.reduce((sum, inv) => sum + (inv.tonnage || 0), 0)
  const totalHauls = invoices.reduce((sum, inv) => sum + (inv.hauls || 0), 0)

  // Sort by date to get range
  const sorted = [...invoices].sort((a, b) => a.invoice_date.localeCompare(b.invoice_date))
  const dateRange = {
    start: sorted[0].invoice_date,
    end: sorted[sorted.length - 1].invoice_date,
  }

  // Vendor breakdown
  const vendorMap = new Map<string, { count: number; totalAmount: number }>()
  invoices.forEach((inv) => {
    const existing = vendorMap.get(inv.vendor_name) || { count: 0, totalAmount: 0 }
    vendorMap.set(inv.vendor_name, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + inv.total_amount,
    })
  })

  const vendorBreakdown = Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({
      vendor,
      count: data.count,
      totalAmount: data.totalAmount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)

  return {
    totalInvoices: invoices.length,
    totalAmount,
    totalTonnage,
    totalHauls,
    averageInvoiceAmount: totalAmount / invoices.length,
    averageTonnagePerHaul: totalHauls > 0 ? totalTonnage / totalHauls : 0,
    dateRange,
    vendorBreakdown,
  }
}

/**
 * Calculate haul log statistics
 */
export interface HaulLogStats {
  totalHauls: number
  totalTonnage: number
  averageTonnage: number
  averageDaysBetweenHauls: number
  utilizationStats: {
    normal: number
    lowUtilization: number
    highUtilization: number
  }
  dateRange: {
    start: string
    end: string
  }
}

export function calculateHaulLogStats(hauls: HaulLogRow[]): HaulLogStats {
  if (hauls.length === 0) {
    return {
      totalHauls: 0,
      totalTonnage: 0,
      averageTonnage: 0,
      averageDaysBetweenHauls: 0,
      utilizationStats: { normal: 0, lowUtilization: 0, highUtilization: 0 },
      dateRange: { start: '', end: '' },
    }
  }

  const totalTonnage = hauls.reduce((sum, haul) => sum + haul.tonnage, 0)

  // Calculate average days between hauls
  const haulsWithDays = hauls.filter((h) => h.days_since_last !== null)
  const avgDays =
    haulsWithDays.length > 0
      ? haulsWithDays.reduce((sum, h) => sum + (h.days_since_last || 0), 0) / haulsWithDays.length
      : 0

  // Utilization stats
  const utilizationStats = {
    normal: hauls.filter((h) => h.status === 'normal').length,
    lowUtilization: hauls.filter((h) => h.status === 'low_utilization').length,
    highUtilization: hauls.filter((h) => h.status === 'high_utilization').length,
  }

  // Date range
  const sorted = [...hauls].sort((a, b) => a.haul_date.localeCompare(b.haul_date))
  const dateRange = {
    start: sorted[0].haul_date,
    end: sorted[sorted.length - 1].haul_date,
  }

  return {
    totalHauls: hauls.length,
    totalTonnage,
    averageTonnage: totalTonnage / hauls.length,
    averageDaysBetweenHauls: avgDays,
    utilizationStats,
    dateRange,
  }
}

/**
 * Calculate total savings from optimizations
 */
export interface SavingsSummary {
  totalRecommendations: number
  totalPotentialSavings: number
  year1Savings: number
  ongoingSavings: number
  recommendationsByType: Record<string, number>
  topOpportunities: Array<{
    title: string
    type: string
    savings: number
    priority: number
  }>
}

export function calculateSavingsSummary(optimizations: OptimizationRow[]): SavingsSummary {
  const recommended = optimizations.filter((opt) => opt.recommend)

  let year1Total = 0
  let ongoingTotal = 0

  recommended.forEach((opt) => {
    const breakdown = opt.calculation_breakdown as any
    if (breakdown) {
      year1Total += breakdown.net_year1_savings || breakdown.gross_annual_savings || 0
      ongoingTotal += breakdown.net_annual_savings_year2plus || breakdown.annual_savings || 0
    }
  })

  // Count by type
  const byType: Record<string, number> = {}
  recommended.forEach((opt) => {
    byType[opt.opportunity_type] = (byType[opt.opportunity_type] || 0) + 1
  })

  // Top opportunities
  const topOpportunities = recommended
    .map((opt) => {
      const breakdown = opt.calculation_breakdown as any
      const savings =
        breakdown?.net_annual_savings_year2plus ||
        breakdown?.net_year1_savings ||
        breakdown?.gross_annual_savings ||
        0

      return {
        title: opt.title,
        type: opt.opportunity_type,
        savings,
        priority: opt.priority || 99,
      }
    })
    .sort((a, b) => a.priority - b.priority || b.savings - a.savings)
    .slice(0, 5)

  return {
    totalRecommendations: recommended.length,
    totalPotentialSavings: Math.max(year1Total, ongoingTotal),
    year1Savings: year1Total,
    ongoingSavings: ongoingTotal,
    recommendationsByType: byType,
    topOpportunities,
  }
}

/**
 * Transform project row for API response
 */
export interface ProjectSummary {
  id: string
  propertyName: string
  location: string
  units: number
  equipmentType: string | null
  status: string
  progress: number
  totalSavings: number
  createdAt: string
  updatedAt: string
}

export function projectRowToSummary(row: ProjectRow): ProjectSummary {
  return {
    id: row.id,
    propertyName: row.property_name,
    location: `${row.city}, ${row.state}`,
    units: row.units,
    equipmentType: row.equipment_type,
    status: row.status || 'draft',
    progress: row.progress || 0,
    totalSavings: row.total_savings || 0,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format tonnage for display
 */
export function formatTonnage(tonnage: number, decimals: number = 2): string {
  return `${tonnage.toFixed(decimals)} tons`
}
