'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Shield,
} from 'lucide-react'
import type { WasteWiseAnalyticsCompleteResult } from '@/lib/skills/types'

interface RecommendationsListProps {
  recommendations: WasteWiseAnalyticsCompleteResult['recommendations']
}

export function RecommendationsList({
  recommendations,
}: RecommendationsListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPriorityConfig = (priority: number) => {
    switch (priority) {
      case 1:
        return {
          label: 'Critical',
          variant: 'destructive' as const,
          icon: AlertCircle,
        }
      case 2:
        return {
          label: 'High',
          variant: 'default' as const,
          icon: TrendingUp,
        }
      case 3:
        return {
          label: 'Medium',
          variant: 'secondary' as const,
          icon: Clock,
        }
      case 4:
      case 5:
        return {
          label: 'Low',
          variant: 'outline' as const,
          icon: CheckCircle2,
        }
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          icon: Shield,
        }
    }
  }

  const getConfidenceConfig = (confidence?: string) => {
    switch (confidence) {
      case 'HIGH':
        return {
          label: 'High Confidence',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        }
      case 'MEDIUM':
        return {
          label: 'Medium Confidence',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        }
      case 'LOW':
        return {
          label: 'Low Confidence',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        }
      default:
        return null
    }
  }

  // Sort recommendations by priority (lower number = higher priority)
  const sortedRecommendations = [...recommendations].sort(
    (a, b) => a.priority - b.priority
  )

  // Filter only recommended actions
  const recommendedActions = sortedRecommendations.filter((rec) => rec.recommend)

  if (recommendedActions.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recommendations</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Optimizations Needed
              </h3>
              <p className="text-muted-foreground max-w-md">
                Your waste management program is already optimized. Continue
                monitoring your costs and service levels.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">
        Recommendations ({recommendedActions.length})
      </h2>
      <Accordion type="multiple" className="space-y-4">
        {recommendedActions.map((recommendation, index) => {
          const priorityConfig = getPriorityConfig(recommendation.priority)
          const confidenceConfig = getConfidenceConfig(recommendation.confidence)
          const PriorityIcon = priorityConfig.icon

          return (
            <AccordionItem
              key={`${recommendation.type}-${index}`}
              value={`recommendation-${index}`}
              className="border rounded-lg bg-card"
            >
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-col items-start gap-3 w-full pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={priorityConfig.variant}>
                          <PriorityIcon className="h-3 w-3" />
                          {priorityConfig.label}
                        </Badge>
                        {confidenceConfig && (
                          <Badge className={confidenceConfig.className}>
                            <Shield className="h-3 w-3" />
                            {confidenceConfig.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                        <CardTitle className="text-left">
                          {recommendation.title}
                        </CardTitle>
                        {recommendation.savings && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-semibold">
                              {formatCurrency(recommendation.savings)}/year
                            </span>
                          </div>
                        )}
                      </div>
                      <CardDescription className="text-left">
                        {recommendation.description}
                      </CardDescription>
                    </div>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="pt-0 space-y-4">
                    {recommendation.implementation && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Implementation Timeline
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.implementation}
                        </p>
                      </div>
                    )}
                    {recommendation.savings && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Annual Savings:
                          </span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(recommendation.savings)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )
        })}
      </Accordion>
    </section>
  )
}
