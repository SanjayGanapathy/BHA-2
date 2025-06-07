import React from 'react';
import { Sale } from '@/types'; // Assuming types are in @/types
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

type ZReportProps = {
  reportData: Sale[];
  reportDateRange: DateRange;
};

export const ZReport = React.forwardRef<HTMLDivElement, ZReportProps>(({ reportData, reportDateRange }, ref) => {
  if (!reportData || reportData.length === 0) {
    return (
      <div ref={ref} className="p-8 font-mono bg-white text-black text-center">
        <h1 className="text-2xl font-bold">Z-Out Report</h1>
        <p>Bull Horn Analytics</p>
        <p className="mt-4">No data available for the selected period.</p>
      </div>
    );
  }

  // --- Calculations ---
  const totalRevenue = reportData.reduce((acc, sale) => acc + sale.total, 0);
  const totalProfit = reportData.reduce((acc, sale) => acc + sale.profit, 0);
  const totalTransactions = reportData.length;

  const itemsSold: { [key: string]: number } = {};
  const categorySales: { [key: string]: { quantity: number, total: number } } = {};

  reportData.forEach(sale => {
    sale.sale_items.forEach(item => {
      if (item.products) {
        const productName = item.products.name;
        const category = item.products.category || 'Uncategorized';
        const itemTotal = item.quantity * item.products.price;

        // Aggregate items sold
        itemsSold[productName] = (itemsSold[productName] || 0) + item.quantity;

        // Aggregate category sales
        if (!categorySales[category]) {
          categorySales[category] = { quantity: 0, total: 0 };
        }
        categorySales[category].quantity += item.quantity;
        categorySales[category].total += itemTotal;
      }
    });
  });

  return (
    <div ref={ref} className="p-8 font-mono bg-white text-black">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Z-Out Report</h1>
        <p>Bull Horn Analytics</p>
        {reportDateRange.from && (
          <p>
            {format(reportDateRange.from, 'MM/dd/yyyy')} - {reportDateRange.to ? format(reportDateRange.to, 'MM/dd/yyyy') : ''}
          </p>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold border-b-2 border-dashed border-black pb-2 mb-4">Sales Summary</h2>
        <div className="flex justify-between"><span>Total Revenue:</span> <span>${totalRevenue.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Total Profit:</span> <span>${totalProfit.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Total Transactions:</span> <span>{totalTransactions}</span></div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold border-b-2 border-dashed border-black pb-2 mb-4">Category Summary</h2>
        {Object.entries(categorySales).map(([category, data]) => (
            <div key={category} className="flex justify-between">
                <span>{category} ({data.quantity} items):</span> 
                <span>${data.total.toFixed(2)}</span>
            </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold border-b-2 border-dashed border-black pb-2 mb-4">Items Sold</h2>
        {Object.entries(itemsSold).map(([name, quantity]) => (
            <div key={name} className="flex justify-between">
                <span>{name}</span>
                <span>x{quantity}</span>
            </div>
        ))}
      </div>

      <div className="mt-12 text-center text-xs">
        <p>*** End of Report ***</p>
      </div>
    </div>
  );
});

ZReport.displayName = 'ZReport'; 