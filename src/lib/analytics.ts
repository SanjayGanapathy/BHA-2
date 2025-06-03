import {
  Sale,
  Product,
  SalesAnalytics,
  BusinessMetrics,
  AIInsight,
} from "@/types";
import { POSStore } from "./store";

export class AnalyticsEngine {
  static calculateSalesAnalytics(
    sales: Sale[],
    timeframe: "day" | "week" | "month" | "year" = "day",
  ): SalesAnalytics {
    const now = new Date();
    const filteredSales = this.filterSalesByTimeframe(sales, timeframe, now);

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = filteredSales.reduce(
      (sum, sale) => sum + sale.profit,
      0,
    );
    const totalTransactions = filteredSales.length;
    const averageTicket =
      totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Calculate top products
    const productSales = new Map<
      string,
      { product: Product; quantitySold: number; revenue: number }
    >();

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.product.id;
        const existing = productSales.get(key);
        if (existing) {
          existing.quantitySold += item.quantity;
          existing.revenue += item.quantity * item.product.price;
        } else {
          productSales.set(key, {
            product: item.product,
            quantitySold: item.quantity,
            revenue: item.quantity * item.product.price,
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate daily sales for chart
    const dailySales = this.calculateDailySales(filteredSales, timeframe);

    return {
      totalSales,
      totalProfit,
      totalTransactions,
      averageTicket,
      topProducts,
      dailySales,
    };
  }

  static calculateBusinessMetrics(): BusinessMetrics {
    const sales = POSStore.getSales();
    const products = POSStore.getProducts();

    const today = this.filterSalesByTimeframe(sales, "day", new Date());
    const yesterday = this.filterSalesByTimeframe(
      sales,
      "day",
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    const currentRevenue = today.reduce((sum, sale) => sum + sale.total, 0);
    const previousRevenue = yesterday.reduce(
      (sum, sale) => sum + sale.total,
      0,
    );
    const growth =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const profit = today.reduce((sum, sale) => sum + sale.profit, 0);

    // Find top selling category for today
    const categorySales = new Map<string, number>();
    today.forEach((sale) => {
      sale.items.forEach((item) => {
        const category = item.product.category;
        categorySales.set(
          category,
          (categorySales.get(category) || 0) + item.quantity,
        );
      });
    });

    const topSellingCategory =
      Array.from(categorySales.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "N/A";

    // Find low stock items
    const lowStockItems = products.filter((product) => product.stock < 10);

    // Simple forecast (in production, use ML models)
    const forecast = this.generateForecast(sales);

    return {
      revenue: currentRevenue,
      profit,
      growth,
      topSellingCategory,
      lowStockItems,
      forecast,
    };
  }

  static generateAIInsights(): AIInsight[] {
    const metrics = this.calculateBusinessMetrics();
    const insights: AIInsight[] = [];

    // Low stock alerts
    if (metrics.lowStockItems.length > 0) {
      insights.push({
        id: `low-stock-${Date.now()}`,
        type: "alert",
        title: "Low Stock Alert",
        description: `${metrics.lowStockItems.length} items are running low on stock. Consider restocking soon.`,
        impact: "high",
        timestamp: new Date(),
        data: { items: metrics.lowStockItems },
      });
    }

    // Growth insights
    if (metrics.growth > 10) {
      insights.push({
        id: `growth-${Date.now()}`,
        type: "observation",
        title: "Strong Growth Detected",
        description: `Sales have grown by ${metrics.growth.toFixed(1)}% compared to yesterday. Great job!`,
        impact: "high",
        timestamp: new Date(),
      });
    } else if (metrics.growth < -5) {
      insights.push({
        id: `decline-${Date.now()}`,
        type: "recommendation",
        title: "Sales Decline Noticed",
        description: `Sales have declined by ${Math.abs(metrics.growth).toFixed(1)}% compared to yesterday. Consider promotional campaigns or product mix adjustments.`,
        impact: "medium",
        timestamp: new Date(),
      });
    }

    // Daily performance insights
    if (metrics.revenue > 0) {
      insights.push({
        id: `daily-performance-${Date.now()}`,
        type: "observation",
        title: "Today's Performance",
        description: `Today's revenue is $${metrics.revenue.toFixed(2)} with ${metrics.topSellingCategory} being the top category.`,
        impact: "medium",
        timestamp: new Date(),
      });
    }

    // Forecast insights
    insights.push({
      id: `forecast-${Date.now()}`,
      type: "forecast",
      title: "Sales Forecast",
      description: `Based on current trends, tomorrow's revenue is projected to be $${metrics.forecast.nextWeek.toFixed(2)} with ${metrics.forecast.confidence}% confidence.`,
      impact: "medium",
      timestamp: new Date(),
      data: metrics.forecast,
    });

    return insights;
  }

  private static filterSalesByTimeframe(
    sales: Sale[],
    timeframe: string,
    referenceDate: Date,
  ): Sale[] {
    const cutoffDate = new Date(referenceDate);

    switch (timeframe) {
      case "day":
        // For today, filter sales from start of today
        cutoffDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(referenceDate);
        endOfDay.setHours(23, 59, 59, 999);
        return sales.filter((sale) => {
          const saleDate = new Date(sale.timestamp);
          return saleDate >= cutoffDate && saleDate <= endOfDay;
        });
      case "week":
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case "year":
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
    }

    return sales.filter((sale) => new Date(sale.timestamp) >= cutoffDate);
  }

  private static calculateDailySales(sales: Sale[], timeframe: string) {
    const dailySales = new Map<
      string,
      { sales: number; transactions: number }
    >();

    sales.forEach((sale) => {
      let dateKey: string;

      if (timeframe === "day") {
        // For day view, show hourly breakdown
        const saleDate = new Date(sale.timestamp);
        const hour = saleDate.getHours();
        dateKey = `${hour.toString().padStart(2, "0")}:00`;
      } else {
        // For other timeframes, show daily breakdown
        dateKey = new Date(sale.timestamp).toISOString().split("T")[0];
      }

      const existing = dailySales.get(dateKey);
      if (existing) {
        existing.sales += sale.total;
        existing.transactions += 1;
      } else {
        dailySales.set(dateKey, { sales: sale.total, transactions: 1 });
      }
    });

    return Array.from(dailySales.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => {
        if (timeframe === "day") {
          // Sort by hour for day view
          const hourA = parseInt(a.date.split(":")[0]);
          const hourB = parseInt(b.date.split(":")[0]);
          return hourA - hourB;
        }
        return a.date.localeCompare(b.date);
      });
  }

  private static generateForecast(sales: Sale[]) {
    const last7Days = this.filterSalesByTimeframe(sales, "week", new Date());
    const dailyAverage =
      last7Days.length > 0
        ? last7Days.reduce((sum, sale) => sum + sale.total, 0) / 7
        : 0;

    return {
      nextWeek: dailyAverage * 7,
      nextMonth: dailyAverage * 30,
      confidence: Math.min(90, Math.max(60, last7Days.length * 12)), // Simple confidence based on data points
    };
  }
}
