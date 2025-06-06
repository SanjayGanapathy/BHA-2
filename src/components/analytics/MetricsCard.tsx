// src/components/analytics/MetricsCard.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    period: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricsCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
}: MetricsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "";
    switch (trend.direction) {
      case "up":
        return "text-green-600 bg-green-50 border-green-200";
      case "down":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // THIS IS THE LINE THAT WAS MISSING
  const testId = `metrics-card-${title.toLowerCase().replace(/'/g, "").replace(/\s+/g, '-')}`;

  return (
    <Card className={className} data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className={cn("text-xs", getTrendColor())}>
              {getTrendIcon()}
              {Math.abs(trend.value).toFixed(1)}%
            </Badge>
            <span className="text-xs text-muted-foreground">
              {trend.period}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}