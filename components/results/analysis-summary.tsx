'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TrendingUp, DollarSign, Target, Percent } from 'lucide-react'
import type { WasteWiseAnalyticsCompleteResult } from '@/lib/skills/types'

interface AnalysisSummaryProps {
  summary: WasteWiseAnalyticsCompleteResult['summary']
}

export function AnalysisSummary({ summary }: AnalysisSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(2)}%`
  }

  const metrics = [
    {
      title: 'Total Savings Potential',
      value: formatCurrency(summary.totalSavingsPotential),
      description: 'Annual savings identified',
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Current Monthly Cost',
      value: formatCurrency(summary.currentMonthlyCost),
      description: `Based on ${summary.totalInvoices} invoices`,
      icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Optimized Monthly Cost',
      value: formatCurrency(summary.optimizedMonthlyCost),
      description: 'After implementing recommendations',
      icon: Target,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950',
    },
    {
      title: 'Savings Percentage',
      value: formatPercent(summary.savingsPercentage),
      description: 'Potential cost reduction',
      icon: Percent,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
    },
  ]

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Analysis Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <CardDescription className="text-xs">
                    {metric.description}
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Analysis Period:{' '}
          <span className="font-medium text-foreground">
            {new Date(summary.dateRange.start).toLocaleDateString()} -{' '}
            {new Date(summary.dateRange.end).toLocaleDateString()}
          </span>
          {summary.totalHauls != null && (
            <span className="ml-4">
              Total Haul{summary.totalHauls !== 1 ? 's' : ''}:{' '}
              <span className="font-medium text-foreground">
                {summary.totalHauls}
              </span>
            </span>
          )}
        </p>
      </div>
    </section>
  )
}
