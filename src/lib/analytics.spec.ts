// Example test in src/lib/analytics.spec.ts
import { describe, it, expect } from 'vitest';
import { AnalyticsEngine } from './analytics';
import { DEMO_SALES } from './demo-data'; // Use your mock data

describe('AnalyticsEngine.calculateSalesAnalytics', () => {
  it('should correctly calculate total sales for a given period', () => {
    const result = AnalyticsEngine.calculateSalesAnalytics(DEMO_SALES, 'year');
    expect(result.totalSales).toBeCloseTo(14.25);
    expect(result.totalTransactions).toBe(2);
  });
});