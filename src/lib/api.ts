import { Product, Sale, User, CartItem } from "@/types";
import { supabase } from './supabaseClient'; // Import our Supabase client
import { config } from "./config";

// --- Authentication API (Now using Supabase Auth) ---

/**
 * Logs a user in using their email and password.
 * Note: For this to work, you must create a user in the Supabase Auth section.
 */
export const apiLogin = async (email: string, password: string): Promise<User | null> => {
  console.log("API: Attempting real login with Supabase for user:", email);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Login failed, no user returned.");
  
  // After login, fetch the user's profile from our 'users' table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (userError) throw userError;
  return userData;
};

/**
 * Signs the current user out.
 */
export const apiLogout = async () => {
  console.log("API: Signing out with Supabase.");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Gets the current user's session and profile data. Returns null if not logged in.
 */
export const getCurrentUser = async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    const { data: userData, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
    if (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
    return userData;
};

// --- Products API ---

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

// --- Users API ---

export const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
};

export const updateUser = async (userData: User): Promise<User> => {
    const { id, ...updateData } = userData;
    const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

// NOTE: A proper addUser function would require elevated permissions (a `service_role` key)
// to bypass Row Level Security. For a real app, this should be handled in a secure
// backend environment, not on the client. This version is for demonstration.
export const addUser = async (userData: Omit<User, 'id'> & {password: string}): Promise<User> => {
    console.warn("Attempting to create user from client-side. This requires special setup in Supabase (e.g., an RPC function).");
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Sign up did not return a user.");

    const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            name: userData.name,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            is_active: true,
        })
        .select()
        .single();
    
    if (profileError) throw profileError;
    return profileData;
}


// --- Sales API ---

export const fetchSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase.from('sales').select('*, sale_items(*, products(*))');
  if (error) throw error;
  return (data as any[]) || [];
};

export const createSale = async (items: CartItem[]): Promise<Sale> => {
    // NOTE: This should be a single database transaction using an RPC function in Supabase for production.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be logged in to create a sale.");
    
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const profit = items.reduce((sum, item) => sum + (item.product.price - item.product.cost) * item.quantity, 0);

    const { data: saleData, error: saleError } = await supabase.from('sales').insert({ user_id: user.id, total, profit }).select().single();
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
        await supabase.from('sales').delete().eq('id', saleData.id); // Attempt to roll back
        throw itemsError;
    }
    return saleData;
};