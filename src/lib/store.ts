import { Product, Sale, User, CartItem } from "@/types";

const STORAGE_KEYS = {
  PRODUCTS: "pos_products",
  SALES: "pos_sales",
  USERS: "pos_users",
  CURRENT_USER: "pos_current_user",
  CART: "pos_cart",
};

// Mock data for demo purposes
const DEMO_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Coffee - Espresso",
    price: 3.5,
    cost: 0.8,
    category: "Beverages",
    stock: 100,
    description: "Rich and bold espresso shot",
  },
  {
    id: "2",
    name: "Coffee - Latte",
    price: 4.5,
    cost: 1.2,
    category: "Beverages",
    stock: 85,
    description: "Smooth espresso with steamed milk",
  },
  {
    id: "3",
    name: "Croissant",
    price: 2.75,
    cost: 0.9,
    category: "Pastries",
    stock: 25,
    description: "Buttery, flaky pastry",
  },
  {
    id: "4",
    name: "Sandwich - Turkey",
    price: 8.99,
    cost: 3.5,
    category: "Food",
    stock: 15,
    description: "Fresh turkey sandwich with lettuce and tomato",
  },
  {
    id: "5",
    name: "Muffin - Blueberry",
    price: 3.25,
    cost: 1.1,
    category: "Pastries",
    stock: 20,
    description: "Fresh baked blueberry muffin",
  },
  {
    id: "6",
    name: "Juice - Orange",
    price: 3.99,
    cost: 1.5,
    category: "Beverages",
    stock: 30,
    description: "Fresh squeezed orange juice",
  },
  {
    id: "7",
    name: "Salad - Caesar",
    price: 9.5,
    cost: 3.8,
    category: "Food",
    stock: 12,
    description: "Classic Caesar salad with croutons",
  },
  {
    id: "8",
    name: "Tea - Green",
    price: 2.99,
    cost: 0.6,
    category: "Beverages",
    stock: 50,
    description: "Organic green tea",
  },
];

const DEMO_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    role: "admin",
    name: "John Admin",
    email: "admin@store.com",
    isActive: true,
  },
  {
    id: "2",
    username: "cashier1",
    role: "cashier",
    name: "Sarah Johnson",
    email: "sarah@store.com",
    isActive: true,
  },
  {
    id: "3",
    username: "manager1",
    role: "manager",
    name: "Mike Manager",
    email: "mike@store.com",
    isActive: true,
  },
];

export class POSStore {
  static initializeStore() {
    // Initialize with demo data if no data exists
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setProducts(DEMO_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setUsers(DEMO_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    }
  }

  // Products
  static getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  }

  static setProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  static updateProduct(product: Product) {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      this.setProducts(products);
    }
  }

  static addProduct(product: Product) {
    const products = this.getProducts();
    products.push(product);
    this.setProducts(products);
  }

  static deleteProduct(productId: string) {
    const products = this.getProducts();
    const updatedProducts = products.filter((p) => p.id !== productId);
    this.setProducts(updatedProducts);
  }

  // Sales
  static getSales(): Sale[] {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!data) return [];

    const sales = JSON.parse(data);
    return sales.map((sale: any) => ({
      ...sale,
      timestamp: new Date(sale.timestamp),
    }));
  }

  static addSale(sale: Sale) {
    const sales = this.getSales();
    sales.push(sale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

    // Update product stock
    sale.items.forEach((item) => {
      const products = this.getProducts();
      const product = products.find((p) => p.id === item.product.id);
      if (product) {
        product.stock -= item.quantity;
        this.updateProduct(product);
      }
    });
  }

  // Users
  static getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  static setUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  static setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // Cart
  static getCart(): CartItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.CART);
    return data ? JSON.parse(data) : [];
  }

  static setCart(cart: CartItem[]) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }

  static clearCart() {
    localStorage.removeItem(STORAGE_KEYS.CART);
  }

  // Authentication
  static authenticate(username: string, password: string): User | null {
    // Simple demo authentication (in production, use proper authentication)
    const users = this.getUsers();
    const user = users.find((u) => u.username === username);

    // For demo purposes, accept any password
    if (user && user.isActive) {
      this.setCurrentUser(user);
      return user;
    }

    return null;
  }

  static logout() {
    this.setCurrentUser(null);
    this.clearCart();
  }
}
