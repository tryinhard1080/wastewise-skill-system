/**
 * Dashboard Home Page
 *
 * Main dashboard view with project overview and quick actions
 */

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, FileText, TrendingUp, DollarSign, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user's projects count
  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your waste management overview.
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active waste analyses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Savings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              Across all properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Optimization Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Properties optimized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Properties Analyzed
            </CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Total properties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects / Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            {projectsCount && projectsCount > 0
              ? 'Your recent projects'
              : 'Start your first waste analysis'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!projectsCount || projectsCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No projects yet
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Create your first waste analysis project to start identifying
                optimization opportunities and cost savings.
              </p>
              <Link href="/projects/new">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>Your projects will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/projects/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Upload Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload waste service invoices for AI-powered extraction and
                analysis.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/analytics">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                View Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explore cost trends, optimization opportunities, and performance
                metrics.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Generate Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Download comprehensive Excel and HTML reports for stakeholders.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
