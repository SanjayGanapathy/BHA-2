import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { POSLayout } from "@/components/layout/POSLayout";
import { MetricsCard } from "@/components/analytics/MetricsCard";
import { SalesChart } from "@/components/analytics/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightCard } from "@/components/ai/InsightCard";
import { DollarSign, TrendingUp, ShoppingCart, Users, Package } from "lucide-react";
import { AnalyticsEngine } from "@/lib/analytics";
import { fetchSales, fetchProducts } from "@/lib/api";
import { LoadingScreen } from "@/components/ui/loading";
import { Sale, Product } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "react-router-dom";

export default function Dashboard() {
  // --- HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP ---
  const { data: sales = [], isLoading: isLoadingSales, isError: isErrorSales, error: salesError } = useQuery<Sale[], Error>({
    queryKey: ["sales"],
    queryFn: fetchSales,
  });
  
  const { data: products = [], isLoading: isLoadingProducts, isError: isErrorProducts, error: productsError } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { salesAnalytics, businessMetrics, aiInsights } = useMemo(() => {
    // This calculation now runs on every render, but that's okay.
    // It will only do real work if the inputs (sales, products) have changed.
    if (!sales || !products) {
      return { salesAnalytics: null, businessMetrics: null, aiInsights: [] };
    }
    const metrics = AnalyticsEngine.calculateBusinessMetrics(sales, products);
    return {
      salesAnalytics: AnalyticsEngine.calculateSalesAnalytics(sales, "day"),
      businessMetrics: metrics,
      aiInsights: AnalyticsEngine.generateAIInsights(metrics),
    };
  }, [sales, products]);


  // --- CONDITIONAL RENDERING HAPPENS AFTER ALL HOOKS ---
  if (isLoadingSales || isLoadingProducts) {
    return <LoadingScreen message="Loading dashboard data..." />;
  }

  if (isErrorSales || isErrorProducts) {
    const error = salesError || productsError;
    return (
      <POSLayout>
        <div className="p-4 text-center text-red-500">
          <h2 className="text-xl font-bold">Error Loading Dashboard</h2>
          <p>{error?.message || "An unknown error occurred."}</p>
        </div>
      </POSLayout>
    );
  }
  
  if (sales.length === 0) {
      return (
        <POSLayout>
          <EmptyState
            Icon={ShoppingCart}
            title="No Sales Data Yet"
            description="Complete a transaction on the Sales Terminal page to see your dashboard."
            actionText="Go to Sales Terminal"
            actionLink="/pos"
          />
        </POSLayout>
      );
  }

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">
                Dashboard
            </h1>
            <p className="text-muted-foreground">
                Welcome back! Here's what's happening with your business today.
            </p>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard title="Today's Revenue" value={`$${salesAnalytics?.totalSales.toFixed(2) || "0.00"}`} trend={{ value: businessMetrics?.growth || 0, direction: (businessMetrics?.growth || 0) >= 0 ? "up" : "down", period: "vs yesterday" }} icon={<DollarSign />} />
          <MetricsCard title="Today's Profit" value={`$${salesAnalytics?.totalProfit.toFixed(2) || "0.00"}`} icon={<TrendingUp />} />
          <MetricsCard title="Transactions" value={salesAnalytics?.totalTransactions || 0} icon={<ShoppingCart />} />
          <MetricsCard title="Average Ticket" value={`$${salesAnalytics?.averageTicket.toFixed(2) || "0.00"}`} icon={<Users />} />
        </div>

        {/* Charts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {salesAnalytics && <SalesChart data={salesAnalytics.dailySales} title="Today's Sales Trend" type="line" />}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5"/>Top Products Today</CardTitle></CardHeader>
            <CardContent>
              {salesAnalytics?.topProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No sales data for today.</p>}
              <div className="space-y-3">
                {salesAnalytics?.topProducts.map((item, index) => (
                  <div key={item.product.id} className="flex items-center justify-between">
                    <div><p className="font-medium text-sm">{index + 1}. {item.product.name}</p><p className="text-xs text-muted-foreground">{item.quantitySold} sold</p></div>
                    <div className="font-medium text-sm">${item.revenue.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div>
          <h2 className="text-xl font-semibold mb-4">AI Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiInsights.map(insight => <InsightCard key={insight.id} insight={insight} />)}
          </div>
        </div>
      </div>
    </POSLayout>
  );
}