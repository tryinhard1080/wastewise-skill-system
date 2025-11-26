"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ComplianceItem {
    category: string
    requirement: string
    status: "Compliant" | "Review" | "Optional"
    reference: string
}

const complianceData: ComplianceItem[] = [
    {
        category: "Hauler Licensing",
        requirement:
            "Private haulers must hold license agreement with City of McKinney or obtain collection permit",
        status: "Compliant",
        reference: "McKinney Commercial Waste Services Ordinance",
    },
    {
        category: "Solid Waste Standards",
        requirement:
            "Commercial properties must comply with solid waste ordinances (Chapter 86)",
        status: "Compliant",
        reference: "McKinney Code of Ordinances Chapter 86",
    },
    {
        category: "Enclosure Requirements",
        requirement: "Dumpster enclosures must meet screening standards per ordinance",
        status: "Review",
        reference: "McKinney Building Code Art. 2, Sec. 206",
    },
    {
        category: "Multifamily Classification",
        requirement: "Apartment complexes classified as commercial waste generators",
        status: "Compliant",
        reference: "McKinney Residential Trash Services Policy",
    },
    {
        category: "Recycling Programs",
        requirement: "Commercial recycling available but not mandated for multifamily",
        status: "Optional",
        reference: "McKinney Waste & Recycling Policy",
    },
]

export function RegulatoryCompliance() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">
                Local Ordinance Compliance
            </h2>

            {/* Compliance Score */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-800">
                        Compliance Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-slate-600">Overall Score</p>
                            <p className="text-3xl font-bold text-green-600">95%</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Risk Level</p>
                            <p className="text-3xl font-bold text-green-600">LOW</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Research Confidence</p>
                            <p className="text-3xl font-bold text-green-600">HIGH</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Ordinances Reviewed</p>
                            <p className="text-3xl font-bold text-slate-900">5</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Compliance Checklist */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-800">
                        Ordinance Compliance Checklist
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-700 font-medium">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Category</th>
                                    <th className="px-4 py-3">Requirement</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {complianceData.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium">{item.category}</td>
                                        <td className="px-4 py-3">{item.requirement}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                className={`${item.status === "Compliant"
                                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                        : item.status === "Review"
                                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                                    } px-3 py-1 rounded-full text-xs font-semibold border-none`}
                                            >
                                                {item.status === "Compliant" && "✓ "}
                                                {item.status === "Review" && "⚠ "}
                                                {item.status === "Optional" && "ℹ "}
                                                {item.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {item.reference}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Licensed Haulers */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-800">
                        Licensed Haulers in McKinney, TX
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        Frontier Waste Solutions
                                    </p>
                                    <p className="text-sm text-slate-600 mt-1">Current Vendor</p>
                                    <p className="text-sm text-slate-600">
                                        Commercial waste, recycling, bulk removal
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-600">Phone</p>
                                    <p className="font-semibold">469-444-1555</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Compliance Recommendations */}
            <div className="bg-blue-50 p-6 rounded-lg shadow border-l-4 border-blue-500">
                <h3 className="text-lg font-bold text-blue-900 mb-3">
                    Compliance Recommendations
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li>✓ Continue using licensed hauler (Frontier Waste Solutions)</li>
                    <li>⚠ Verify dumpster enclosure compliance with building code</li>
                    <li>ℹ Consider adding recycling program for sustainability goals</li>
                    <li>ℹ Monitor for any updates to McKinney solid waste ordinances</li>
                </ul>
            </div>
        </div>
    )
}
