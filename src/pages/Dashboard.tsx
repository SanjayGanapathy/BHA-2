import React, { useState, useEffect } from "react";
import { POSLayout } from "@/components/layout/POSLayout";
import { MetricsCard } from "@/components/analytics/MetricsCard";
import { SalesChart } from "@/components/analytics/SalesChart";
import { InsightCard } from "@/components/ai/InsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
} from "lucide-react";
import { AnalyticsEngine } from "@/lib/analytics";
import { POSStore } from "@/lib/store";
import { SalesAnalytics, BusinessMetrics, AIInsight } from "@/types";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = () => {
      try {
        const sales = POSStore.getSales();
        const products = POSStore.getProducts();

        const analyticsData = AnalyticsEngine.calculateSalesAnalytics(
          sales,
          "day",
        );
        const metricsData = AnalyticsEngine.calculateBusinessMetrics();
        const insightsData = AnalyticsEngine.generateAIInsights();

        setAnalytics(analyticsData);
        setMetrics(metricsData);
        setInsights(insightsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <POSLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-md w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </POSLayout>
    );
  }

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Revenue"
            value={`$${analytics?.totalSales.toFixed(2) || "0.00"}`}
            description="Today"
            trend={{
              value: metrics?.growth || 0,
              direction:
                (metrics?.growth || 0) > 0
                  ? "up"
                  : (metrics?.growth || 0) < 0
                    ? "down"
                    : "neutral",
              period: "vs yesterday",
            }}
            icon={<DollarSign className="h-4 w-4" />}
          />

          <MetricsCard
            title="Total Profit"
            value={`$${analytics?.totalProfit.toFixed(2) || "0.00"}`}
            description="Today"
            icon={<TrendingUp className="h-4 w-4" />}
          />

          <MetricsCard
            title="Transactions"
            value={analytics?.totalTransactions || 0}
            description="Today"
            icon={<ShoppingCart className="h-4 w-4" />}
          />

          <MetricsCard
            title="Average Ticket"
            value={`$${analytics?.averageTicket.toFixed(2) || "0.00"}`}
            description="Per transaction"
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        {/* Charts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <SalesChart
            data={analytics?.dailySales || []}
            title="Today's Sales Trend"
            type="line"
          />

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Products Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topProducts.slice(0, 5).map((item, index) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="w-6 h-6 p-0 flex items-center justify-center text-xs"
                      >
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantitySold} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        ${item.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                {!analytics?.topProducts.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sales data available for today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">AI Insights</h2>
            <Badge variant="secondary" className="text-xs">
              AI Powered
            </Badge>
          </div>

          {insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No insights available yet. Complete some sales to generate AI
                  insights.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {metrics?.lowStockItems.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {metrics?.topSellingCategory || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Top Category Today
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  ${metrics?.forecast.nextWeek.toFixed(0) || "0"}
                </p>
                <p className="text-sm text-muted-foreground">Forecast (Week)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  ${metrics?.forecast.nextMonth.toFixed(0) || "0"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Forecast (Month)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}
