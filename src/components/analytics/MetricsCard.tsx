// src/components/analytics/MetricsCard.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Add 'testId' to the props interface
interface MetricsCardProps {
  title: string;
  value: string | number;
  testId: string; // Add this required prop
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
  testId, // Destructure the new prop
}: MetricsCardProps) {
  
  // All the helper functions can remain the same...
  const getTrendIcon = () => { /* ... */ };
  const getTrendColor = () => { /* ... */ };

  return (
    // Use the prop directly. No more string generation.
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
