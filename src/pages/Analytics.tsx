import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { POSLayout } from "@/components/layout/POSLayout";
import { MetricsCard } from "@/components/analytics/MetricsCard";
import { SalesChart } from "@/components/analytics/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, ShoppingCart, Package, Download } from "lucide-react";
import { AnalyticsEngine } from "@/lib/analytics";
import { fetchSales } from "@/lib/api";
import { LoadingScreen } from "@/components/ui/loading";
import { Sale } from "@/types";

type TimeFrame = "day" | "week" | "month" | "year";

export default function Analytics() {
  const [timeframe, setTimeframe] = useState<TimeFrame>("day");
  const { data: sales = [], isLoading, isError, error } = useQuery<Sale[], Error>({
    queryKey: ["sales"],
    queryFn: fetchSales,
  });

  const analyticsData = useMemo(() => {
    if (!sales.length) return null;
    return AnalyticsEngine.calculateSalesAnalytics(sales, timeframe);
  }, [sales, timeframe]);

  if (isLoading) return <LoadingScreen message="Loading analytics..." />;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <POSLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">Business Analytics</h1>
            <p className="text-muted-foreground">Detailed insights into your business performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={(value: TimeFrame) => setTimeframe(value)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export</Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard title="Total Revenue" value={`$${analyticsData?.totalSales.toFixed(2) || "0.00"}`} icon={<DollarSign />} />
          <MetricsCard title="Total Profit" value={`$${analyticsData?.totalProfit.toFixed(2) || "0.00"}`} icon={<TrendingUp />} />
          <MetricsCard title="Transactions" value={analyticsData?.totalTransactions || 0} icon={<ShoppingCart />} />
          <MetricsCard title="Average Ticket" value={`$${analyticsData?.averageTicket.toFixed(2) || "0.00"}`} icon={<Package />} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyticsData && <SalesChart data={analyticsData.dailySales} title={`Sales Trend - ${timeframe}`} type="line" />}
          {analyticsData && <SalesChart data={analyticsData.dailySales} title="Daily Sales Volume" type="bar" />}
        </div>
        
        {/* You can add more detailed tables or charts here */}
        
      </div>
    </POSLayout>
  );
}