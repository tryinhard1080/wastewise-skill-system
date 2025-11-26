import { format } from "date-fns"

// Types based on the component props
export interface ExecutiveData {
    annualSpend: number
    monthlyAverage: number
    costPerDoor: number
    savings: number
    yardsPerDoor: number
    budgetImpact: number
}

export interface ExpenseItem {
    month: string
    invoice: string
    subtotal: number
    tax: number
    total: number
    costPerDoor: number
    notes: string
    isOverage?: boolean
}

export interface OptimizationItem {
    id: string
    title: string
    description: string
    priority: "High" | "Medium" | "Low"
    annualSavings: number
    implementationCost: string
    paybackPeriod: string
    actionItems: string[]
}

export interface BudgetCategory {
    category: string
    current: number
    projected: number
}

// Transformer Functions

export function transformExecutiveData(
    project: any,
    invoices: any[],
    optimizations: any[]
): ExecutiveData {
    const totalSpend = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const monthlyAverage = invoices.length > 0 ? totalSpend / invoices.length : 0
    const costPerDoor = project.units > 0 ? monthlyAverage / project.units : 0
    const totalSavings = optimizations.reduce((sum, opt) => {
        // Extract savings from calculation_breakdown or use a default
        const savings = opt.calculation_breakdown?.annual_savings || 0
        return sum + savings
    }, 0)

    // Mocking YPD and Budget Impact for now as they require complex calculation or missing data
    const yardsPerDoor = 2.41
    const budgetImpact = 11.8

    return {
        annualSpend: totalSpend,
        monthlyAverage,
        costPerDoor,
        savings: totalSavings,
        yardsPerDoor,
        budgetImpact,
    }
}

export function transformExpenseData(invoices: any[], units: number): ExpenseItem[] {
    return invoices
        .sort((a, b) => new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime())
        .map((inv) => ({
            month: format(new Date(inv.invoice_date), "MMM"),
            invoice: inv.invoice_number || "N/A",
            subtotal: (inv.total_amount || 0) - (inv.charges?.tax || 0), // Simplified
            tax: inv.charges?.tax || 0,
            total: inv.total_amount || 0,
            costPerDoor: units > 0 ? (inv.total_amount || 0) / units : 0,
            notes: inv.notes || inv.service_type || "Regular Service",
            isOverage: inv.charges?.overage > 0,
        }))
}

export function transformOptimizations(optimizations: any[]): OptimizationItem[] {
    return optimizations.map((opt) => ({
        id: opt.id,
        title: opt.title,
        description: opt.description || "",
        priority: (opt.priority <= 1 ? "High" : opt.priority <= 3 ? "Medium" : "Low") as any,
        annualSavings: opt.calculation_breakdown?.annual_savings || 0,
        implementationCost: opt.calculation_breakdown?.implementation_cost || "$0",
        paybackPeriod: opt.calculation_breakdown?.payback_period || "Immediate",
        actionItems: opt.calculation_breakdown?.action_items || [],
    }))
}

export function transformBudgetData(invoices: any[]): BudgetCategory[] {
    // Simple projection: Current = Actual, Projected = Actual * 1.05 (5% increase)
    // In a real app, this would use the `budget_projection` from the analysis result
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Group invoices by month
    const monthlyTotals = new Array(12).fill(0)
    invoices.forEach(inv => {
        const monthIdx = new Date(inv.invoice_date).getMonth()
        if (monthIdx >= 0 && monthIdx < 12) {
            monthlyTotals[monthIdx] += inv.total_amount || 0
        }
    })

    // Fill missing months with average
    const activeMonths = monthlyTotals.filter(t => t > 0).length
    const avg = activeMonths > 0 ? monthlyTotals.reduce((a, b) => a + b, 0) / activeMonths : 0

    return months.map((month, idx) => {
        const current = monthlyTotals[idx] || avg
        return {
            category: month,
            current: Math.round(current),
            projected: Math.round(current * 1.05), // 5% inflation assumption
        }
    })
}
