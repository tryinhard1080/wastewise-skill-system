/**
 * Stats Card Component
 *
 * Displays a metric with optional change indicator and icon
 * Color-coded: green=good, red=bad, gray=neutral
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  change?: {
    value: number;
    isPositive: boolean;
    period?: string;
  };
  variant?: "default" | "success" | "danger" | "warning";
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  change,
  variant = "default",
}: StatsCardProps) {
  const variantStyles = {
    default: "bg-gray-100 text-gray-600",
    success: "bg-green-100 text-green-600",
    danger: "bg-red-100 text-red-600",
    warning: "bg-yellow-100 text-yellow-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", variantStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {change && (
          <div className="flex items-center gap-1 mt-2">
            {change.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                change.isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {change.value > 0 ? "+" : ""}
              {change.value}%
            </span>
            {change.period && (
              <span className="text-xs text-gray-500">{change.period}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
