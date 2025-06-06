import { Product, Sale, User, CartItem } from "@/types";
import { DEMO_PRODUCTS, DEMO_SALES, DEMO_USERS } from "./demo-data";
import { config } from "./config";

/**
 * A helper function to simulate network latency.
 * @param ms - The number of milliseconds to wait.
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Authentication API ---

/**
 * Simulates a user login.
 * @param username - The username to authenticate.
 * @returns A User object if successful, otherwise null.
 */
export const apiLogin = async (username: string): Promise<User | null> => {
  console.log("API: Attempting login for user:", username);
  await delay(500);
  const user = DEMO_USERS.find(u => u.username === username && u.isActive);
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  }
  return null;
};

/**
 * Simulates a user logout.
 */
export const apiLogout = async () => {
  console.log("API: Logging out user.");
  await delay(200);
  localStorage.removeItem("currentUser");
};

/**
 * Retrieves the current user from local storage.
 * @returns The currently logged-in User object, or null.
 */
export const getCurrentUser = (): User | null => {
  try {
    const data = localStorage.getItem("currentUser");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    localStorage.removeItem("currentUser");
    return null;
  }
};


// --- Products API ---

/**
 * Simulates fetching all products.
 */
export const fetchProducts = async (): Promise<Product[]> => {
  console.log("API: Fetching products...");
  await delay(500);
  return Promise.resolve([...DEMO_PRODUCTS]);
};

/**
 * Simulates adding a new product.
 */
export const addProduct = async (productData: Omit<Product, "id">): Promise<Product> => {
  console.log("API: Adding product...", productData);
  await delay(700);
  const newProduct: Product = {
    ...productData,
    id: `product_${Date.now()}`,
  };
  DEMO_PRODUCTS.push(newProduct);
  return newProduct;
};

/**
 * Simulates updating an existing product.
 */
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

/**
 * Simulates deleting a product.
 */
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


// --- Users API ---

/**
 * Simulates fetching all users.
 */
export const fetchUsers = async (): Promise<User[]> => {
  console.log("API: Fetching users...");
  await delay(500);
  return Promise.resolve([...DEMO_USERS]);
};

/**
 * Simulates updating an existing user.
 */
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

/**
 * Simulates adding a new user.
 */
export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    console.log("API: Adding user...", userData);
    await delay(700);
    const newUser: User = { ...userData, id: `user_${Date.now()}`};
    DEMO_USERS.push(newUser);
    return newUser;
}


// --- Sales & AI API ---

/**
 * Simulates fetching all sales records.
 */
export const fetchSales = async (): Promise<Sale[]> => {
  console.log("API: Fetching sales...");
  await delay(800);
  return Promise.resolve([...DEMO_SALES]);
};

/**
 * Simulates creating a new sale from a cart.
 */
export const createSale = async (items: CartItem[]): Promise<Sale> => {
    console.log("API: Processing sale...");
    await delay(1500);
  
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

/**
 * Simulates getting a response from an AI assistant.
 */
export const fetchAiResponse = async (userMessage: string): Promise<string> => {
    console.log("API: Generating AI Response for:", userMessage);
    await delay(1500);
    const message = userMessage.toLowerCase();

    if (message.includes("sales") && message.includes("trend")) {
      return "Based on your recent sales data, I notice a positive trend with revenue increasing by 12% compared to last month. Your beverage category is performing particularly well.";
    }
    if (message.includes("restock") || message.includes("inventory")) {
      return "Looking at your current inventory levels, I recommend restocking Coffee Beans (7 units left) and Croissants (3 units left).";
    }
    if (message.includes("profit")) {
        return "Your overall profit margin is healthy at 32.5%. Beverages show the strongest margins (45%).";
    }
    return `That's an interesting question about "${userMessage}". I am a demo AI and have limited responses, but in a real application I could provide deep insights into your business.`;
};