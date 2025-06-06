import { Product, Sale, User, CartItem } from "@/types";
import { supabase } from './supabaseClient';
import { config } from "./config";

// --- Helper Functions ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Authentication API (Using Supabase Auth) ---

export const apiLogin = async (email: string, password: string): Promise<User | null> => {
  console.log("API: Attempting real login with Supabase for user:", email);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Login failed, no user returned.");
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (userError) throw userError;
  
  return userData;
};

export const apiLogout = async () => {
  console.log("API: Signing out with Supabase.");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
    if (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
    return userData;
};

// --- Products API (Using Supabase DB) ---

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  return data || [];
};

export const addProduct = async (productData: Omit<Product, "id" | "created_at">): Promise<Product> => {
  const { data, error } = await supabase.from('products').insert([productData]).select().single();
  if (error) throw error;
  return data;
};

export const updateProduct = async (productData: Omit<Product, "created_at">): Promise<Product> => {
  const { id, ...updateData } = productData;
  const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteProduct = async (productId: string): Promise<{ id: string }> => {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
  return { id: productId };
};

// --- Users API (Using Supabase DB) ---

export const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
};

export const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    // NOTE: A real-world addUser would use `supabase.auth.signUp()` and then
    // create a corresponding entry in the `users` table, likely via a database trigger.
    // This simplified version allows the UI to function for the demo.
    console.warn("Using simplified addUser. This should be replaced with a proper Supabase Auth flow.");
    const { data, error } = await supabase.from('users').insert([userData]).select().single();
    if (error) throw error;
    return data;
}

export const updateUser = async (userData: User): Promise<User> => {
    const { id, ...updateData } = userData;
    const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

// --- Sales API (Using Supabase DB) ---

export const fetchSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*, products(*))');

  if (error) throw error;
  // NOTE: The data structure from this join might need further mapping if your UI expects a different shape.
  return (data as any[]) || [];
};

export const createSale = async (items: CartItem[]): Promise<Sale> => {
    // NOTE: In a high-traffic production app, this entire operation should be a single database
    // transaction using an RPC function in Supabase to ensure all steps succeed or fail together.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be logged in to create a sale.");
    
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const profit = items.reduce((sum, item) => sum + (item.product.price - item.product.cost) * item.quantity, 0);

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({ user_id: user.id, total, profit })
      .select()
      .single();

    if (saleError) throw saleError;
    if (!saleData) throw new Error("Failed to create sale record.");

    const saleItemsData = items.map(item => ({
      sale_id: saleData.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price_at_sale: item.product.price,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsData);

    if (itemsError) {
        await supabase.from('sales').delete().eq('id', saleData.id);
        throw itemsError;
    }

    return saleData;
};

// --- AI API (This remains a mock for demonstration) ---
export const fetchAiResponse = async (userMessage: string): Promise<string> => {
    console.warn("Using mock AI response.");
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