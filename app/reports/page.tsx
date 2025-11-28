import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Filter } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export default async function ReportsPage() {
    const supabase = await createClient()

    const { data: projects } = await supabase
        .from('projects')
        .select('id, property_name, updated_at, status')
        .order('updated_at', { ascending: false })

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
                    <CardTitle>Available Reports</CardTitle>
                    <CardDescription>
                        {projects?.length || 0} reports generated based on property analysis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {projects?.map((project) => (
                            <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <Link href={`/projects/${project.id}`} className="hover:underline">
                                            <p className="font-medium text-slate-900">{project.property_name} Analysis Report</p>
                                        </Link>
                                        <p className="text-sm text-slate-500">
                                            Generated {format(new Date(project.updated_at || new Date()), "MMM d, yyyy")} • PDF • 2.4 MB
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/projects/${project.id}`}>
                                        <Button variant="outline" size="sm">View</Button>
                                    </Link>
                                    <Button variant="ghost" size="icon">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {(!projects || projects.length === 0) && (
                            <p className="text-center text-slate-500 py-8">No reports found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
