// src/lib/api.ts
import { Product, User } from "@/types";
import { DEMO_PRODUCTS, DEMO_USERS } from "./demo-data";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Authentication ---
export const apiLogin = async (username: string): Promise<User | null> => {
  await delay(500);
  const user = DEMO_USERS.find(u => u.username === username && u.isActive);
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  }
  return null;
};

export const apiLogout = async () => {
  await delay(200);
  localStorage.removeItem("currentUser");
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem("currentUser");
  return data ? JSON.parse(data) : null;
};

// --- Products ---
export const fetchProducts = async (): Promise<Product[]> => {
  await delay(500);
  return Promise.resolve(DEMO_PRODUCTS);
};

// Add these functions to the end of src/lib/api.ts

import { DEMO_PRODUCTS } from "./demo-data";
import { Product } from "@/types";

// --- Products API ---

export const fetchProducts = async (): Promise<Product[]> => {
  console.log("API: Fetching products...");
  await delay(500);
  // In a real app, this would be an API call. We'll use our demo data.
  // We return a copy to prevent direct mutation.
  return Promise.resolve([...DEMO_PRODUCTS]);
};

export const addProduct = async (productData: Omit<Product, "id">): Promise<Product> => {
  console.log("API: Adding product...", productData);
  await delay(700);
  const newProduct: Product = {
    ...productData,
    id: `product_${Date.now()}`,
  };
  // In a real app, you would get the updated list from the server.
  // Here we simulate it by pushing to our in-memory array.
  DEMO_PRODUCTS.push(newProduct);
  return newProduct;
};

export const updateProduct = async (productData: Product): Promise<Product> => {
  console.log("API: Updating product...", productData);
  await delay(700);
  const index = DEMO_PRODUCTS.findIndex((p) => p.id === productData.id);
  if (index !== -1) {
    DEMO_PRODUCTS[index] = productData;
    return productData;
  }
  throw new Error("Product not found");
};

export const deleteProduct = async (productId: string): Promise<{ id: string }> => {
  console.log("API: Deleting product...", productId);
  await delay(700);
  const index = DEMO_PRODUCTS.findIndex((p) => p.id === productId);
  if (index !== -1) {
    DEMO_PRODUCTS.splice(index, 1);
    return { id: productId };
  }
  throw new Error("Product not found");
};

// Add these functions to the end of src/lib/api.ts
import { DEMO_SALES, DEMO_USERS } from "./demo-data";
import { Sale, User } from "@/types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Users API ---
export const fetchUsers = async (): Promise<User[]> => {
  console.log("API: Fetching users...");
  await delay(500);
  return Promise.resolve([...DEMO_USERS]);
};

export const updateUser = async (userData: User): Promise<User> => {
    console.log("API: Updating user...", userData);
    await delay(700);
    const index = DEMO_USERS.findIndex((u) => u.id === userData.id);
    if (index !== -1) {
        DEMO_USERS[index] = userData;
        return userData;
    }
    throw new Error("User not found");
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    console.log("API: Adding user...", userData);
    await delay(700);
    const newUser: User = { ...userData, id: `user_${Date.now()}`};
    DEMO_USERS.push(newUser);
    return newUser;
}


// --- Sales & Analytics API ---
export const fetchSales = async (): Promise<Sale[]> => {
  console.log("API: Fetching sales...");
  await delay(800);
  return Promise.resolve([...DEMO_SALES]);
};

// Add these functions to the end of src/lib/api.ts

import { CartItem, Product, Sale, User } from "@/types";
import { DEMO_PRODUCTS, DEMO_SALES, DEMO_USERS } from "./demo-data";
import { config } from "./config";

// --- Products API ---

export const addProduct = async (productData: Omit<Product, "id">): Promise<Product> => {
  console.log("API: Adding product...", productData);
  await new Promise(res => setTimeout(res, 700)); // Simulate delay
  const newProduct: Product = {
    ...productData,
    id: `product_${Date.now()}`,
  };
  DEMO_PRODUCTS.push(newProduct);
  return newProduct;
};

export const updateProduct = async (productData: Product): Promise<Product> => {
  console.log("API: Updating product...", productData);
  await new Promise(res => setTimeout(res, 700));
  const index = DEMO_PRODUCTS.findIndex((p) => p.id === productData.id);
  if (index !== -1) {
    DEMO_PRODUCTS[index] = productData;
    return productData;
  }
  throw new Error("Product not found");
};

export const deleteProduct = async (productId: string): Promise<{ id: string }> => {
  console.log("API: Deleting product...", productId);
  await new Promise(res => setTimeout(res, 700));
  const index = DEMO_PRODUCTS.findIndex((p) => p.id === productId);
  if (index !== -1) {
    DEMO_PRODUCTS.splice(index, 1);
    return { id: productId };
  }
  throw new Error("Product not found");
};

// --- Users API ---
export const fetchUsers = async (): Promise<User[]> => {
  console.log("API: Fetching users...");
  await new Promise(res => setTimeout(res, 500));
  return Promise.resolve([...DEMO_USERS]);
};

export const updateUser = async (userData: User): Promise<User> => {
    console.log("API: Updating user...", userData);
    await new Promise(res => setTimeout(res, 700));
    const index = DEMO_USERS.findIndex((u) => u.id === userData.id);
    if (index !== -1) {
        DEMO_USERS[index] = userData;
        return userData;
    }
    throw new Error("User not found");
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    console.log("API: Adding user...", userData);
    await new Promise(res => setTimeout(res, 700));
    const newUser: User = { ...userData, id: `user_${Date.now()}`};
    DEMO_USERS.push(newUser);
    return newUser;
}


// --- Sales & Analytics API ---
export const fetchSales = async (): Promise<Sale[]> => {
  console.log("API: Fetching sales...");
  await new Promise(res => setTimeout(res, 800));
  return Promise.resolve([...DEMO_SALES]);
};

export const createSale = async (items: CartItem[]): Promise<Sale> => {
    console.log("API: Processing sale...");
    await new Promise(res => setTimeout(res, 1500));
  
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error("No authenticated user to process sale.");
  
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const tax = subtotal * config.business.defaultTaxRate;
    const total = subtotal + tax;
    const profit = items.reduce((sum, item) => sum + (item.product.price - item.product.cost) * item.quantity, 0);
  
    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      items,
      total,
      profit,
      timestamp: new Date(),
      userId: currentUser.id,
      paymentMethod: "card",
    };
  
    DEMO_SALES.push(newSale);
    return newSale;
};