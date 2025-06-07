export type Product = {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  category: string | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  image_url: string | null;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price_at_sale: number;
  products: Product; // For nested queries
};

export type Sale = {
  id: string;
  created_at: string;
  user_id: string | null;
  total: number;
  profit: number;
  payment_method: string | null;
  sale_items: SaleItem[];
};

export type AIInsight = {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  type: 'recommendation' | 'observation' | 'alert';
  timestamp: Date;
};

export interface User {
  id: string;
  username: string;
  role: "admin" | "cashier" | "manager";
  name: string;
  email: string;
  is_active: boolean;
}

export interface SalesAnalytics {
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  averageTicket: number;
  topProducts: Array<{
    product: Product;
    quantitySold: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    transactions: number;
  }>;
}

export interface BusinessMetrics {
  revenue: number;
  profit: number;
  growth: number;
  topSellingCategory: string;
  lowStockItems: Product[];
  forecast: {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  };
}
