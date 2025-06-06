import {
  Sale,
  Product,
  SalesAnalytics,
  BusinessMetrics,
  AIInsight,
} from "@/types";
import { config } from "./config";

/**
 * A class containing static methods for business analytics calculations.
 * These methods are pure functions that take data as input and return calculated results.
 */
export class AnalyticsEngine {
  /**
   * Calculates sales analytics for a given set of sales and a specific timeframe.
   * @param sales - An array of Sale objects.
   * @param timeframe - The time period to analyze ('day', 'week', 'month', 'year').
   * @returns A SalesAnalytics object with calculated metrics.
   */
  static calculateSalesAnalytics(
    sales: Sale[],
    timeframe: "day" | "week" | "month" | "year" = "day"
  ): SalesAnalytics {
    const now = new Date();
    const filteredSales = this.filterSalesByTimeframe(sales, timeframe, now);

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = filteredSales.reduce(
      (sum, sale) => sum + sale.profit,
      0
    );
    const totalTransactions = filteredSales.length;
    const averageTicket =
      totalTransactions > 0 ? totalSales / totalTransactions : 0;

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

  /**
   * Calculates high-level business metrics from sales and product data.
   * @param sales - An array of all Sale objects.
   * @param products - An array of all Product objects.
   * @returns A BusinessMetrics object.
   */
  static calculateBusinessMetrics(
    sales: Sale[],
    products: Product[]
  ): BusinessMetrics {
    const todaySales = this.filterSalesByTimeframe(sales, "day", new Date());
    const yesterdaySales = this.filterSalesByTimeframe(
      sales,
      "day",
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const currentRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const previousRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0);
    const growth = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0 ? 100 : 0; // Avoid division by zero, show 100% growth if yesterday was 0

    const profit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);

    const categorySales = new Map<string, number>();
    todaySales.forEach((sale) => {
      sale.items.forEach((item) => {
        const category = item.product.category;
        categorySales.set(category, (categorySales.get(category) || 0) + item.quantity);
      });
    });

    const topSellingCategory = Array.from(categorySales.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock < config.business.lowStockThreshold);
    const forecast = this.generateForecast(sales);

    return { revenue: currentRevenue, profit, growth, topSellingCategory, lowStockItems, forecast };
  }

  /**
   * Generates AI-driven insights from pre-calculated business metrics.
   * @param metrics - A BusinessMetrics object.
   * @returns An array of AIInsight objects.
   */
  static generateAIInsights(metrics: BusinessMetrics): AIInsight[] {
    const insights: AIInsight[] = [];

    if (metrics.lowStockItems.length > 0) {
      insights.push({
        id: `insight_low_stock_${Date.now()}`,
        type: "alert",
        title: "Low Stock Alert",
        description: `${metrics.lowStockItems.length} popular items are running low. Consider reordering soon to avoid missed sales.`,
        impact: "high",
        timestamp: new Date(),
        data: { items: metrics.lowStockItems.map(p => p.name) },
      });
    }

    if (metrics.growth > 20) {
      insights.push({
        id: `insight_growth_${Date.now()}`,
        type: "observation",
        title: "Strong Growth Detected",
        description: `Sales have grown by ${metrics.growth.toFixed(1)}% compared to yesterday. Keep up the great work!`,
        impact: "high",
        timestamp: new Date(),
      });
    }

    insights.push({
      id: `insight_forecast_${Date.now()}`,
      type: "forecast",
      title: "Sales Forecast",
      description: `Based on current trends, next week's revenue is projected to be around $${metrics.forecast.nextWeek.toFixed(0)}.`,
      impact: "medium",
      timestamp: new Date(),
      data: metrics.forecast,
    });

    return insights;
  }
  
  private static filterSalesByTimeframe(sales: Sale[], timeframe: string, referenceDate: Date): Sale[] {
    const startOfReferenceDay = new Date(referenceDate);
    startOfReferenceDay.setHours(0, 0, 0, 0);
  
    let startDate: Date;

    switch (timeframe) {
      case "day":
        startDate = startOfReferenceDay;
        break;
      case "week":
        startDate = new Date(startOfReferenceDay);
        startDate.setDate(startOfReferenceDay.getDate() - startOfReferenceDay.getDay());
        break;
      case "month":
        startDate = new Date(startOfReferenceDay.getFullYear(), startOfReferenceDay.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(startOfReferenceDay.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const endDate = new Date(referenceDate);
    endDate.setHours(23, 59, 59, 999);

    return sales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        if (timeframe === 'day') {
            return saleDate.toDateString() === referenceDate.toDateString();
        }
        return saleDate >= startDate && saleDate <= endDate;
    });
  }

  private static calculateDailySales(sales: Sale[], timeframe: string): { date: string; sales: number; transactions: number }[] {
    const salesMap = new Map<string, { sales: number; transactions: number }>();

    sales.forEach((sale) => {
      let dateKey: string;

      if (timeframe === "day") {
        const saleDate = new Date(sale.timestamp);
        const hour = saleDate.getHours();
        dateKey = `${hour.toString().padStart(2, "0")}:00`;
      } else {
        dateKey = new Date(sale.timestamp).toISOString().split("T")[0];
      }

      const existing = salesMap.get(dateKey) || { sales: 0, transactions: 0 };
      existing.sales += sale.total;
      existing.transactions += 1;
      salesMap.set(dateKey, existing);
    });

    return Array.from(salesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static generateForecast(sales: Sale[]) {
    const last7Days = this.filterSalesByTimeframe(sales, "week", new Date());
    const dailyAverage = last7Days.length > 0 ? last7Days.reduce((sum, sale) => sum + sale.total, 0) / 7 : 50;

    return {
      nextWeek: dailyAverage * 7,
      nextMonth: dailyAverage * 30,
      confidence: Math.min(90, Math.max(60, last7Days.length * 5)),
    };
  }
}