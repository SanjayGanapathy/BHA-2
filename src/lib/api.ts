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

// Add other functions for sales, users, etc., as you build a real backend.