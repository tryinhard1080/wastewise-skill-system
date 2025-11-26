"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface OptimizationOpportunity {
    id: string
    title: string
    description: string
    priority: "High" | "Medium" | "Low"
    annualSavings: number
    implementationCost: string
    paybackPeriod: string
    actionItems: string[]
}

interface OptimizationOpportunitiesProps {
    opportunities: OptimizationOpportunity[]
    totalSavings: number
    roi: string
}

export function OptimizationOpportunities({
    opportunities,
    totalSavings,
    roi,
}: OptimizationOpportunitiesProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">
                Optimization Opportunities
            </h2>

            {opportunities.map((opp, index) => (
                <Card key={opp.id} className="overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {index + 1}. {opp.title}
                                </h3>
                                <p className="text-sm text-slate-600 mt-2">{opp.description}</p>
                            </div>
                            <Badge
                                className={`${opp.priority === "High"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                    } px-3 py-1 rounded-full text-sm font-semibold border-none`}
                            >
                                Priority {index + 1}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="bg-green-50 p-4 rounded">
                                <p className="text-sm text-slate-600">
                                    Annual Savings (Year 1)
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${opp.annualSavings.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded">
                                <p className="text-sm text-slate-600">Implementation Cost</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {opp.implementationCost}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded">
                                <p className="text-sm text-slate-600">Payback Period</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {opp.paybackPeriod}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-slate-50 rounded">
                            <p className="text-sm font-semibold text-slate-700">
                                Action Items:
                            </p>
                            <ul className="mt-2 space-y-1 text-sm text-slate-600">
                                {opp.actionItems.map((item, i) => (
                                    <li key={i}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Total Impact */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg shadow border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                    Combined Impact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-slate-600">Total Year 1 Savings</p>
                        <p className="text-3xl font-bold text-green-600">
                            ${totalSavings.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600">Impact on Cost/Door</p>
                        <p className="text-3xl font-bold text-blue-600">
                            -${(totalSavings / 453).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">Annual reduction</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600">ROI</p>
                        <p className="text-3xl font-bold text-purple-600">{roi}</p>
                        <p className="text-xs text-slate-500">Based on minimal investment</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
