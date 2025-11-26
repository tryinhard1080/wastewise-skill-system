import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, DollarSign } from "lucide-react"

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics Overview</h1>
                <p className="text-slate-500">Portfolio-wide performance metrics and trends.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Portfolio Spend</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$142,384</div>
                        <p className="text-xs text-muted-foreground">+2.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Identified Savings</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">$24,592</div>
                        <p className="text-xs text-muted-foreground">Across 8 properties</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Cost Per Door</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$14.20</div>
                        <p className="text-xs text-muted-foreground">-0.5% from last month</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="h-[400px] flex items-center justify-center bg-slate-50 border-dashed">
                <div className="text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">Portfolio Trends Chart</h3>
                    <p className="mt-1 text-sm text-slate-500">Chart visualization coming soon</p>
                </div>
            </Card>
        </div>
    )
}
