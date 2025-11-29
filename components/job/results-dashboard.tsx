'use client'

/**
 * Results Dashboard Component
 *
 * Displays analysis results with charts and recommendations
 * Uses Recharts for data visualization
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react'
import type { CompactorOptimizationResult } from '@/lib/skills/types'
import { DSQ_MONITOR_INSTALL, DSQ_MONITOR_MONTHLY } from '@/lib/constants/formulas'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ResultsDashboardProps {
  results: unknown
  jobType: string
}

function isCompactorOptimizationResult(
  results: unknown,
): results is CompactorOptimizationResult {
  if (!results || typeof results !== 'object') return false
  return (
    'avgTonsPerHaul' in results &&
    'targetTonsPerHaul' in results &&
    'netYear1Savings' in results
  )
}

export function ResultsDashboard({
  results,
  jobType,
}: ResultsDashboardProps) {
  // Handle different job types
  if (
    (jobType === 'complete_analysis' || jobType.includes('compactor')) &&
    isCompactorOptimizationResult(results)
  ) {
    return <CompactorOptimizationDashboard results={results} />
  }

  if (jobType === 'complete_analysis' || jobType.includes('compactor')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            Compactor optimization results are unavailable for this job.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We could not parse compactor optimization metrics from the job output.
            Please retry the analysis or contact support if the issue persists.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Default generic results display
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
        <CardDescription>
          Results for {jobType.replace(/_/g, ' ')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}

function CompactorOptimizationDashboard({
  results,
}: {
  results: CompactorOptimizationResult
}) {
  // Prepare chart data
  const performanceData = [
    {
      name: 'Current',
      tons: results.avgTonsPerHaul,
      fill: results.recommend ? '#f59e0b' : '#10b981',
    },
    {
      name: 'Target',
      tons: results.targetTonsPerHaul,
      fill: '#10b981',
    },
  ]

  const savingsBreakdown = [
    { name: 'Gross Annual Savings', value: results.grossAnnualSavings || 0 },
    {
      name: 'Installation Cost',
      value: DSQ_MONITOR_INSTALL,
    },
    {
      name: 'Annual Monitoring',
      value: DSQ_MONITOR_MONTHLY * 12,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Recommendation Banner */}
      {results.recommend ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-900">
                Optimization Recommended
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-green-800">
              Based on the analysis, we recommend implementing DSQ monitoring to
              optimize compactor utilization and reduce waste service costs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-blue-900">
                No Optimization Needed
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">
              Your compactor is already operating at optimal capacity. No
              changes recommended at this time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Tons/Haul
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.avgTonsPerHaul.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {results.targetTonsPerHaul} tons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net Year 1 Savings
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(results.netYear1Savings || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">After install costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.roiPercent?.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Return on investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payback</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.paybackMonths?.toFixed(1)} mo
            </div>
            <p className="text-xs text-muted-foreground">
              Time to break even
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Compactor Performance</CardTitle>
            <CardDescription>
              Current vs target capacity utilization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Tons per Haul', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="tons" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Savings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
            <CardDescription>
              Savings vs implementation costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={savingsBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>
            Action items to implement optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.recommend ? (
              <>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">1</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Install DSQ Monitoring System</p>
                    <p className="text-sm text-muted-foreground">
                      One-time installation cost: $
                      {DSQ_MONITOR_INSTALL.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">2</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Optimize Pickup Schedule</p>
                    <p className="text-sm text-muted-foreground">
                      Reduce pickups to achieve target capacity of{' '}
                      {results.targetTonsPerHaul} tons per haul
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">3</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Monitor Performance</p>
                    <p className="text-sm text-muted-foreground">
                      Review monthly savings (est. $
                      {((results.grossAnnualSavings || 0) / 12).toLocaleString()}/month)
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Continue Current Operations</p>
                  <p className="text-sm text-muted-foreground">
                    Your compactor is operating efficiently at{' '}
                    {results.avgTonsPerHaul.toFixed(2)} tons per haul. No
                    optimization needed at this time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
