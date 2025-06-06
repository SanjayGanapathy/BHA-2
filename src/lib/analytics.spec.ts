// src/lib/analytics.spec.ts
import { describe, it, expect } from 'vitest';
import { AnalyticsEngine } from './analytics';
import { DEMO_SALES, DEMO_PRODUCTS } from './demo-data'; // Use your mock data
import { Sale } from '../types';

describe('AnalyticsEngine', () => {

  describe('calculateSalesAnalytics', () => {
    it('should return zero for all metrics when given an empty sales array', () => {
      const result = AnalyticsEngine.calculateSalesAnalytics([]);
      expect(result.totalSales).toBe(0);
      expect(result.totalProfit).toBe(0);
      expect(result.totalTransactions).toBe(0);
      expect(result.averageTicket).toBe(0);
    });

    it('should correctly calculate total sales and profit from mock data', () => {
      // Using all sales across all time
      const result = AnalyticsEngine.calculateSalesAnalytics(DEMO_SALES, 'year');

      const expectedTotalSales = DEMO_SALES.reduce((sum, s) => sum + s.total, 0);
      const expectedTotalProfit = DEMO_SALES.reduce((sum, s) => sum + s.profit, 0);

      expect(result.totalSales).toBeCloseTo(expectedTotalSales);
      expect(result.totalProfit).toBeCloseTo(expectedTotalProfit);
      expect(result.totalTransactions).toBe(DEMO_SALES.length);
    });

    it('should filter sales correctly for the "day" timeframe', () => {
        const todaySale: Sale = {
            id: 'sale_today',
            items: [],
            total: 100,
            profit: 50,
            timestamp: new Date(), // Today
            userId: '1',
            paymentMethod: 'card'
        };

        const yesterdaySale: Sale = {
            id: 'sale_yesterday',
            items: [],
            total: 200,
            profit: 100,
            timestamp: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
            userId: '1',
            paymentMethod: 'card'
        };

        const sales = [todaySale, yesterdaySale];
        const result = AnalyticsEngine.calculateSalesAnalytics(sales, 'day');

        expect(result.totalSales).toBe(100);
        expect(result.totalTransactions).toBe(1);
    });
  });

  describe('calculateBusinessMetrics', () => {
    it('should correctly identify low stock items', () => {
        const metrics = AnalyticsEngine.calculateBusinessMetrics(DEMO_SALES, DEMO_PRODUCTS);
        // In demo-data, 'Croissant', 'Sandwich', 'Muffin', 'Salad' have stock < 10
        const lowStockItems = DEMO_PRODUCTS.filter(p => p.stock > 0 && p.stock < 10);
        expect(metrics.lowStockItems.length).toBe(lowStockItems.length);
    });
  });
});