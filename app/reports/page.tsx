import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Filter } from "lucide-react"

export default function ReportsPage() {
    const reports = [
        { name: "Q3 2025 Portfolio Summary", date: "Oct 15, 2025", type: "PDF", size: "2.4 MB" },
        { name: "September 2025 Expense Detail", date: "Oct 01, 2025", type: "Excel", size: "1.1 MB" },
        { name: "Orion McKinney Optimization Plan", date: "Sep 28, 2025", type: "PDF", size: "3.2 MB" },
        { name: "Q2 2025 Portfolio Summary", date: "Jul 15, 2025", type: "PDF", size: "2.3 MB" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
                    <p className="text-slate-500">Download and manage your waste analysis reports.</p>
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>Documents generated in the last 90 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {reports.map((report, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{report.name}</p>
                                        <p className="text-sm text-slate-500">{report.date} • {report.type} • {report.size}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
