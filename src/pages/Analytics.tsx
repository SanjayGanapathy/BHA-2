import React, { useState, useEffect } from "react";
import { POSLayout } from "@/components/layout/POSLayout";
import { MetricsCard } from "@/components/analytics/MetricsCard";
import { SalesChart } from "@/components/analytics/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Calendar,
  BarChart3,
  PieChart,
  Download,
} from "lucide-react";
import { AnalyticsEngine } from "@/lib/analytics";
import { POSStore } from "@/lib/store";
import { SalesAnalytics, Sale } from "@/types";

type TimeFrame = "day" | "week" | "month" | "year";

export default function Analytics() {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [timeframe, setTimeframe] = useState<TimeFrame>("month");
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = () => {
    setIsLoading(true);
    try {
      const salesData = POSStore.getSales();
      const analyticsData = AnalyticsEngine.calculateSalesAnalytics(
        salesData,
        timeframe,
      );

      setSales(salesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeframePeriod = () => {
    switch (timeframe) {
      case "day":
        return "today";
      case "week":
        return "this week";
      case "month":
        return "this month";
      case "year":
        return "this year";
      default:
        return "this month";
    }
  };

  const getProfitMargin = () => {
    if (!analytics || analytics.totalSales === 0) return 0;
    return (analytics.totalProfit / analytics.totalSales) * 100;
  };

  const getRecentSales = () => {
    return sales
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Detailed insights into your sales performance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={timeframe}
              onValueChange={(value: TimeFrame) => setTimeframe(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Revenue"
            value={`$${analytics?.totalSales.toFixed(2) || "0.00"}`}
            description={`Revenue ${getTimeframePeriod()}`}
            icon={<DollarSign className="h-4 w-4" />}
          />

          <MetricsCard
            title="Total Profit"
            value={`$${analytics?.totalProfit.toFixed(2) || "0.00"}`}
            description={`${getProfitMargin().toFixed(1)}% margin`}
            icon={<TrendingUp className="h-4 w-4" />}
          />

          <MetricsCard
            title="Transactions"
            value={analytics?.totalTransactions || 0}
            description={`Sales ${getTimeframePeriod()}`}
            icon={<ShoppingCart className="h-4 w-4" />}
          />

          <MetricsCard
            title="Average Ticket"
            value={`$${analytics?.averageTicket.toFixed(2) || "0.00"}`}
            description="Per transaction"
            icon={<Package className="h-4 w-4" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart
            data={analytics?.dailySales || []}
            title={`Sales Trend - ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`}
            type="line"
          />

          <SalesChart
            data={analytics?.dailySales || []}
            title="Daily Sales Volume"
            type="bar"
          />
        </div>

        {/* Top Products and Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Products {getTimeframePeriod()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topProducts.map((item, index) => (
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
                            {item.quantitySold} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${item.revenue.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${item.product.price}/unit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No sales data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {getRecentSales().map((sale) => (
                  <div key={sale.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">
                        Sale #{sale.id.slice(-6)}
                      </div>
                      <div className="text-sm font-semibold">
                        ${sale.total.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div>
                        {sale.items.length} items • Profit: $
                        {sale.profit.toFixed(2)}
                      </div>
                      <div>{new Date(sale.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {getRecentSales().length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No recent transactions
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Cashier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getRecentSales()
                  .slice(0, 20)
                  .map((sale) => {
                    const margin =
                      sale.total > 0 ? (sale.profit / sale.total) * 100 : 0;

                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">
                          #{sale.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(sale.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(sale.timestamp).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {sale.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0,
                            )}{" "}
                            items
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sale.items[0]?.product.name}
                            {sale.items.length > 1 &&
                              ` +${sale.items.length - 1} more`}
                          </div>
                        </TableCell>
                        <TableCell>${sale.total.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          ${sale.profit.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              margin > 30
                                ? "default"
                                : margin > 15
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {sale.userId.slice(-6)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>

            {sales.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No sales data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </POSLayout>
  );
}
