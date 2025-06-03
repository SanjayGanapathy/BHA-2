export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  description?: string;
  cost: number; // For profit calculation
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  profit: number;
  timestamp: Date;
  userId: string;
  paymentMethod: string;
}

export interface User {
  id: string;
  username: string;
  role: "admin" | "cashier" | "manager";
  name: string;
  email: string;
  isActive: boolean;
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

export interface AIInsight {
  id: string;
  type: "recommendation" | "observation" | "forecast" | "alert";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  timestamp: Date;
  data?: any;
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
