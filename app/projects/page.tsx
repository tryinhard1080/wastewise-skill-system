/**
 * Projects List Page
 *
 * Displays all user projects with filtering and search capabilities
 */

// Force dynamic rendering - this page uses cookies for auth
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Calendar, TrendingDown, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all projects for the user
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      analysis_jobs(
        id,
        status,
        created_at,
        result_data
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your waste management analysis projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects Grid */}
      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Create your first waste analysis project to start identifying
              optimization opportunities.
            </p>
            <Link href="/projects/new">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const latestAnalysis = project.analysis_jobs?.[0]
            const completedAnalyses = project.analysis_jobs?.filter(
              (job) => job.status === 'completed'
            ).length || 0

            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">
                        {project.property_name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.city && project.state ? `${project.city}, ${project.state}` : 'No location provided'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {completedAnalyses} {completedAnalyses === 1 ? 'analysis' : 'analyses'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Property Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Units</p>
                      <p className="font-medium">
                        {project.units || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Equipment Type</p>
                      <p className="font-medium capitalize">
                        {project.equipment_type || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Latest Analysis Status */}
                  {latestAnalysis && (
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted-foreground">
                          Latest Analysis
                        </span>
                        <Badge
                          variant={
                            latestAnalysis.status === 'completed'
                              ? 'default'
                              : latestAnalysis.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {latestAnalysis.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {latestAnalysis.created_at && format(
                          new Date(latestAnalysis.created_at),
                          'MMM d, yyyy'
                        )}
                      </div>
                    </div>
                  )}

                  {/* Savings Indicator (if available) */}
                  {latestAnalysis?.result_data &&
                    typeof latestAnalysis.result_data === 'object' &&
                    'netYear1Savings' in latestAnalysis.result_data &&
                    typeof latestAnalysis.result_data.netYear1Savings === 'number' && (
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <TrendingDown className="h-4 w-4" />
                        $
                        {latestAnalysis.result_data.netYear1Savings.toLocaleString()}{' '}
                        potential savings
                      </div>
                    )}
                </CardContent>

                <CardFooter>
                  <Link href={`/projects/${project.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Project
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
