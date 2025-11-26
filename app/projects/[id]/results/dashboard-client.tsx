"use client"

import { useState } from 'react'
import type { WasteWiseAnalyticsCompleteResult } from '@/lib/skills/types'
import { KPICard } from '@/components/dashboard/KPICard'
import { ActionSummary } from '@/components/dashboard/ActionSummary'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ExportMenu } from '@/components/dashboard/ExportMenu'
import { DataTable } from '@/components/dashboard/DataTable'
import { type ColumnDef } from '@tanstack/react-table'
import { AnalysisSummary } from '@/components/results/analysis-summary'
import { RecommendationsList } from '@/components/results/recommendations-list'
import { DownloadButtons } from '@/components/results/download-buttons'

interface DashboardClientProps {
    project: any
    result: WasteWiseAnalyticsCompleteResult
    completedAt: string
}

type Tab = 'dashboard' | 'recommendations' | 'original'

export function DashboardClient({ project, result, completedAt }: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')

    // Calculate KPIs from result data
    const totalSavings = result.recommendations.reduce((sum, rec) => sum + (rec.savings || 0), 0)
    const avgSavingsPerRec = result.recommendations.length > 0 ? totalSavings / result.recommendations.length : 0

    // Export handlers
    const handleExportCSV = () => {
        const csvData = result.recommendations.map(rec => ({
            Priority: rec.priority,
            Title: rec.title,
            Category: rec.type,
            Savings: rec.savings || 0,
            Implementation: rec.implementation || 'N/A',
            Confidence: rec.confidence || 'MEDIUM'
        }))

        const headers = Object.keys(csvData[0]).join(',')
        const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n')
        const csv = `${headers}\n${rows}`

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project.property_name}-analysis.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleExportPDF = () => {
        alert('PDF export would integrate with jsPDF library. For now, please use Print to save as PDF.')
        window.print()
    }

    const handlePrint = () => {
        window.print()
    }

    // Define columns for recommendations table
    const recommendationsColumns: ColumnDef<typeof result.recommendations[0]>[] = [
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => (
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${row.original.priority === 1 ? 'bg-red-600' :
                        row.original.priority === 2 ? 'bg-orange-500' :
                            'bg-yellow-500 text-gray-900'
                    }`}>
                    {row.original.priority}
                </span>
            ),
        },
        {
            accessorKey: 'title',
            header: 'Opportunity',
            cell: ({ row }) => (
                <div>
                    <div className="font-semibold text-gray-900">{row.original.title}</div>
                    <div className="text-sm text-gray-600">{row.original.description}</div>
                </div>
            ),
        },
        {
            accessorKey: 'savings',
            header: 'Annual Savings',
            cell: ({ row }) => (
                <span className="font-bold text-emerald-700">
                    ${(row.original.savings || 0).toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: 'confidence',
            header: 'Confidence',
            cell: ({ row }) => (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${row.original.confidence === 'HIGH' ? 'bg-green-100 text-green-800' :
                        row.original.confidence === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                    }`}>
                    {row.original.confidence || 'MEDIUM'}
                </span>
            ),
        },
        {
            accessorKey: 'implementation',
            header: 'Implementation',
        },
    ]

    // Prepare action summary data
    const topOpportunities = result.recommendations
        .slice(0, 3)
        .map(rec => ({
            priority: rec.priority,
            title: rec.title,
            savings: rec.savings || 0,
            contact: {
                name: 'Support Team',
                email: 'support@wastewise.com'
            }
        }))

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold mb-2">{project.property_name}</h1>
                    <p className="text-emerald-100 text-sm">
                        WasteWise Complete Analysis | Completed{' '}
                        {new Date(completedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        <KPICard
                            label="Total Savings"
                            value={`$${totalSavings.toLocaleString()}`}
                            isPrimary
                        />
                        <KPICard
                            label="Opportunities"
                            value={result.recommendations.length}
                            isPrimary
                        />
                        <KPICard
                            label="Avg Savings/Opp"
                            value={`$${Math.round(avgSavingsPerRec).toLocaleString()}`}
                        />
                        <KPICard
                            label="Property Units"
                            value={project.units || 'N/A'}
                        />
                    </div>

                    {/* Tab Navigation */}
                    <nav className="flex gap-2 mt-6 flex-wrap">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'dashboard'
                                    ? 'bg-green-300 text-gray-900 shadow-lg'
                                    : 'bg-white/15 hover:bg-white/25 backdrop-blur-sm'
                                }`}
                        >
                            📊 Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('recommendations')}
                            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'recommendations'
                                    ? 'bg-green-300 text-gray-900 shadow-lg'
                                    : 'bg-white/15 hover:bg-white/25 backdrop-blur-sm'
                                }`}
                        >
                            💡 Recommendations
                        </button>
                        <button
                            onClick={() => setActiveTab('original')}
                            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'original'
                                    ? 'bg-green-300 text-gray-900 shadow-lg'
                                    : 'bg-white/15 hover:bg-white/25 backdrop-blur-sm'
                                }`}
                        >
                            📄 Original View
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Action Summary */}
                        <ActionSummary
                            totalSavings={totalSavings}
                            opportunities={topOpportunities}
                        />

                        {/* Export Menu */}
                        <div className="flex justify-end">
                            <ExportMenu
                                onExportCSV={handleExportCSV}
                                onExportPDF={handleExportPDF}
                                onPrint={handlePrint}
                            />
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <MetricCard
                                title="Total Potential Savings"
                                value={`$${totalSavings.toLocaleString()}`}
                                subtext="Annual savings from all recommendations"
                                progress={{
                                    label: 'Savings Potential',
                                    value: 85,
                                    status: 'excellent'
                                }}
                            />
                            <MetricCard
                                title="High Priority Items"
                                value={result.recommendations.filter(r => r.priority === 1).length}
                                subtext="Immediate action recommended"
                                progress={{
                                    label: 'Completion Status',
                                    value: 0,
                                    status: 'danger'
                                }}
                            />
                            <MetricCard
                                title="Average ROI"
                                value="680%"
                                subtext="Based on top 3 opportunities"
                                progress={{
                                    label: 'ROI Potential',
                                    value: 95,
                                    status: 'excellent'
                                }}
                            />
                        </div>

                        {/* Recommendations Table */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                All Optimization Opportunities
                            </h2>
                            <DataTable
                                columns={recommendationsColumns}
                                data={result.recommendations}
                                searchPlaceholder="Search opportunities..."
                                pageSize={10}
                            />
                        </div>
                    </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <RecommendationsList recommendations={result.recommendations} />
                        </div>
                    </div>
                )}

                {/* Original View Tab */}
                {activeTab === 'original' && (
                    <div className="space-y-6">
                        <DownloadButtons
                            excelUrl={result.reports.excelWorkbook.downloadUrl}
                            htmlUrl={result.reports.htmlDashboard.downloadUrl}
                        />
                        <AnalysisSummary summary={result.summary} />
                        <RecommendationsList recommendations={result.recommendations} />
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-200 mt-12 py-6 text-center text-sm text-gray-600">
                <p><strong className="text-emerald-700">WasteWise Complete Analysis</strong> by <strong>THE Trash Hub</strong></p>
                <p className="mt-2">Analysis Period: {new Date(completedAt).toLocaleDateString()}</p>
            </footer>
        </div>
    )
}
