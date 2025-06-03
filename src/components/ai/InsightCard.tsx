import React from "react";
import { AIInsight } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Eye,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: AIInsight;
  className?: string;
}

export function InsightCard({ insight, className }: InsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case "recommendation":
        return <Lightbulb className="h-4 w-4" />;
      case "forecast":
        return <TrendingUp className="h-4 w-4" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "observation":
        return <Eye className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getImpactColor = () => {
    switch (insight.impact) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTypeColor = () => {
    switch (insight.type) {
      case "recommendation":
        return "bg-blue-100 text-blue-800";
      case "forecast":
        return "bg-green-100 text-green-800";
      case "alert":
        return "bg-red-100 text-red-800";
      case "observation":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", getTypeColor())}>
              {getIcon()}
            </div>
            <CardTitle className="text-base">{insight.title}</CardTitle>
          </div>

          <Badge
            variant="outline"
            className={cn("text-xs capitalize", getImpactColor())}
          >
            {insight.impact} impact
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {insight.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {insight.timestamp.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        {insight.data && insight.type === "alert" && insight.data.items && (
          <div className="mt-3 p-2 bg-muted rounded-md">
            <p className="text-xs font-medium mb-1">Low Stock Items:</p>
            <div className="space-y-1">
              {insight.data.items
                .slice(0, 3)
                .map((item: any, index: number) => (
                  <div key={index} className="text-xs flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-red-600">{item.stock} left</span>
                  </div>
                ))}
              {insight.data.items.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{insight.data.items.length - 3} more items
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
