"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface ExpenseData {
    month: string
    invoice: string
    subtotal: number
    tax: number
    total: number
    costPerDoor: number
    notes: string
    isOverage?: boolean
}

interface ExpenseAnalysisProps {
    data: ExpenseData[]
}

export function ExpenseAnalysis({ data }: ExpenseAnalysisProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">
                Monthly Expense Trends
            </h2>

            {/* Cost Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        Cost Per Door Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.filter((d) => !d.isOverage)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis domain={[10, 16]} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="costPerDoor"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Breakdown Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        Monthly Total Costs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.filter((d) => !d.isOverage)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Expense Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                        2025 Expense Detail
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-700 font-medium">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Month</th>
                                    <th className="px-4 py-3">Invoice #</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                    <th className="px-4 py-3 text-right">Tax</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-right">$/Door</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className={`hover:bg-slate-50 ${row.isOverage
                                                ? "bg-red-50"
                                                : row.notes.includes("enclosures")
                                                    ? "bg-yellow-50"
                                                    : ""
                                            }`}
                                    >
                                        <td className="px-4 py-3">{row.month}</td>
                                        <td className="px-4 py-3">{row.invoice}</td>
                                        <td className="px-4 py-3 text-right">
                                            ${row.subtotal.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            ${row.tax.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold">
                                            ${row.total.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            ${row.costPerDoor.toFixed(2)}
                                        </td>
                                        <td
                                            className={`px-4 py-3 ${row.isOverage ? "text-red-600" : "text-slate-600"
                                                }`}
                                        >
                                            {row.notes}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
