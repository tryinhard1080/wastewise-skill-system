"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"

interface BudgetData {
    category: string
    current: number
    projected: number
}

interface BudgetProjectionProps {
    data: BudgetData[]
    baselineTotal: number
    projectedTotal: number
    savings: number
}

export function BudgetProjection({
    data,
    baselineTotal,
    projectedTotal,
    savings,
}: BudgetProjectionProps) {
    const optimizedTotal = projectedTotal - savings
    const netIncreasePercent =
        ((optimizedTotal - baselineTotal) / baselineTotal) * 100

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">
                2026 Budget Projection
            </h2>

            {/* Budget Comparison Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        2025 vs 2026 Budget Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="current"
                                    name="2025 Baseline"
                                    fill="#94a3b8"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="projected"
                                    name="2026 Projected"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Budget Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                            2025 Baseline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Monthly Average:</span>
                            <span className="font-semibold">
                                ${(baselineTotal / 12).toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Annual Projected:</span>
                            <span className="font-semibold">
                                ${baselineTotal.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Cost Per Door:</span>
                            <span className="font-semibold">
                                ${(baselineTotal / 12 / 453).toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                            2026 Projection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Monthly Projected:</span>
                            <span className="font-semibold text-red-600">
                                ${(projectedTotal / 12).toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Annual Projected:</span>
                            <span className="font-semibold text-red-600">
                                ${projectedTotal.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Cost Per Door:</span>
                            <span className="font-semibold text-red-600">
                                ${(projectedTotal / 12 / 453).toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Impact Analysis */}
            <div className="bg-yellow-50 p-6 rounded-lg shadow border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                    Budget Impact Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-yellow-700 font-medium">CPI Increase (5%)</p>
                        <p className="text-2xl font-bold text-yellow-900">$303</p>
                        <p className="text-xs text-yellow-600">Per month</p>
                    </div>
                    <div>
                        <p className="text-yellow-700 font-medium">Enclosure Fees</p>
                        <p className="text-2xl font-bold text-yellow-900">$520</p>
                        <p className="text-xs text-yellow-600">Per month (added July)</p>
                    </div>
                    <div>
                        <p className="text-yellow-700 font-medium">Total Increase</p>
                        <p className="text-2xl font-bold text-yellow-900">11.8%</p>
                        <p className="text-xs text-yellow-600">Vs 2025 baseline</p>
                    </div>
                </div>
            </div>

            {/* Optimization Impact */}
            <div className="bg-green-50 p-6 rounded-lg shadow border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                    With Optimization Opportunities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-green-700 font-medium">Potential Savings</p>
                        <p className="text-2xl font-bold text-green-900">
                            ${savings.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">Annual reduction</p>
                    </div>
                    <div>
                        <p className="text-green-700 font-medium">Optimized 2026 Budget</p>
                        <p className="text-2xl font-bold text-green-900">
                            ${optimizedTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">Annual projected</p>
                    </div>
                    <div>
                        <p className="text-green-700 font-medium">Net Increase</p>
                        <p className="text-2xl font-bold text-green-900">
                            {netIncreasePercent.toFixed(1)}%
                        </p>
                        <p className="text-xs text-green-600">
                            Vs 2025 (down from 11.8%)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
