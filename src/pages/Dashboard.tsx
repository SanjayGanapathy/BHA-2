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
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: sales = [], isLoading: isLoadingSales } = useQuery<Sale[], Error>({
    queryKey: ["sales"],
    queryFn: fetchSales,
  });
  
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  if (isLoadingSales || isLoadingProducts) {
  return <LoadingScreen message="Loading dashboard data..." />;
}

// ADD THIS NEW LOGIC BLOCK
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
  const { salesAnalytics, businessMetrics, aiInsights } = useMemo(() => {
    if (!sales.length || !products.length) {
      return { salesAnalytics: null, businessMetrics: null, aiInsights: [] };
    }
    const businessMetrics = AnalyticsEngine.calculateBusinessMetrics(sales, products);
    return {
      salesAnalytics: AnalyticsEngine.calculateSalesAnalytics(sales, "day"),
      businessMetrics: businessMetrics,
      aiInsights: AnalyticsEngine.generateAIInsights(businessMetrics),
    };
  }, [sales, products]);

  if (isLoadingSales || isLoadingProducts) {
    return <LoadingScreen message="Loading dashboard data..." />;
  }

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-blue-900">Dashboard</h1>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard title="Today's Revenue" value={`$${salesAnalytics?.totalSales.toFixed(2) || "0.00"}`} trend={{ value: businessMetrics?.growth || 0, direction: (businessMetrics?.growth || 0) > 0 ? "up" : "down", period: "vs yesterday" }} icon={<DollarSign />} />
          <MetricsCard title="Today's Profit" value={`$${salesAnalytics?.totalProfit.toFixed(2) || "0.00"}`} icon={<TrendingUp />} />
          <MetricsCard title="Transactions" value={salesAnalytics?.totalTransactions || 0} icon={<ShoppingCart />} />
          <MetricsCard title="Average Ticket" value={`$${salesAnalytics?.averageTicket.toFixed(2) || "0.00"}`} icon={<Users />} />
        </div>

        {/* Charts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {salesAnalytics && <SalesChart data={salesAnalytics.dailySales} title="Today's Sales Trend" type="line" />}
          <Card>
            <CardHeader><CardTitle>Top Products Today</CardTitle></CardHeader>
            <CardContent>{/* UI for top products */}</CardContent>
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