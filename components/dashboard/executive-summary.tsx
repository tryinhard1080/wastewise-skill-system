"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface ExecutiveSummaryProps {
    data: {
        annualSpend: number
        monthlyAverage: number
        costPerDoor: number
        savings: number
        yardsPerDoor: number
        budgetImpact: number
    }
}

export function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
    // Gauge Data
    const ypdData = [
        { name: "Value", value: data.yardsPerDoor },
        { name: "Remaining", value: 3.0 - data.yardsPerDoor }, // Assuming max 3.0 for visual
    ]
    const budgetData = [
        { name: "Increase", value: data.budgetImpact },
        { name: "Remaining", value: 100 - data.budgetImpact },
    ]

    const COLORS = {
        success: "#22c55e",
        warning: "#f59e0b",
        neutral: "#e5e7eb",
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-sm font-medium text-slate-600 mb-2">
                            2025 Annual Spend
                        </h3>
                        <p className="text-3xl font-bold text-slate-900">
                            ${data.annualSpend.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">9 months of data</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-sm font-medium text-slate-600 mb-2">
                            Monthly Average
                        </h3>
                        <p className="text-3xl font-bold text-slate-900">
                            ${data.monthlyAverage.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Includes all fees</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-sm font-medium text-slate-600 mb-2">
                            Cost Per Door
                        </h3>
                        <p className="text-3xl font-bold text-slate-900">
                            ${data.costPerDoor.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Monthly average</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-sm font-medium text-slate-600 mb-2">
                            2026 Savings
                        </h3>
                        <p className="text-3xl font-bold text-green-600">
                            ${data.savings.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Annual opportunity</p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                            Yards Per Door Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={ypdData}
                                        cx="50%"
                                        cy="70%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={0}
                                        dataKey="value"
                                    >
                                        <Cell fill={COLORS.success} />
                                        <Cell fill={COLORS.neutral} />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <div className="text-4xl font-bold text-slate-800">
                                    {data.yardsPerDoor}
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                    Target: 2.0-2.5 YPD
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-50 rounded border border-green-100">
                            <p className="text-sm font-semibold text-green-800">
                                ✓ WITHIN TARGET
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                                Property is generating waste at industry benchmark levels for
                                garden-style multifamily.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                            2026 Budget Impact
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={budgetData}
                                        cx="50%"
                                        cy="70%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={0}
                                        dataKey="value"
                                    >
                                        <Cell fill={COLORS.warning} />
                                        <Cell fill={COLORS.neutral} />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <div className="text-4xl font-bold text-slate-800">
                                    {data.budgetImpact}%
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                    Projected increase
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-100">
                            <p className="text-sm font-semibold text-yellow-800">
                                ⚠ CPI INCREASE
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                                5% CPI increase + new enclosure fees ($520/month since July
                                2025).
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Property Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        Property Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-slate-600">Vendor</p>
                            <p className="font-semibold text-slate-900">
                                Frontier Waste Solutions
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Account #</p>
                            <p className="font-semibold text-slate-900">239522</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Property Type</p>
                            <p className="font-semibold text-slate-900">Garden-Style</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Units</p>
                            <p className="font-semibold text-slate-900">453</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
