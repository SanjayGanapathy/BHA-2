import { Product, Sale, User, CartItem } from "@/types";
import { supabase } from './supabaseClient'; // Import our Supabase client

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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error getting session:", sessionError);
      throw sessionError;
    }

    if (!session) {
      return null;
    }
    
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // If there's an error fetching the profile (e.g., RLS error, user not in table),
    // we must throw it so the AuthProvider can catch it and handle logout.
    if (profileError) {
        console.error("Error fetching user profile:", profileError);
        throw profileError;
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
    
    if (profileError) {
      console.error("Error creating user profile:", profileError);
      // We should also delete the user from auth if the profile creation fails
      // This is complex client-side, another reason to use a serverless function.
      throw new Error(`Database error saving new user: ${profileError.message}`);
    }
    return profileData;
}

export const deleteUser = async (userId: string): Promise<{ id: string }> => {
  // Note: This only deletes the user from the 'users' table, not from Supabase Auth.
  // A secure implementation would use a server-side function with admin privileges.
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
  return { id: userId };
};

// --- Sales API ---

export const fetchSales = async (dateRange?: { from: string | Date; to: string | Date }): Promise<Sale[]> => {
  let query = supabase.from('sales').select('*, sale_items(*, products(*))');

  if (dateRange?.from) {
    // Set time to the beginning of the day
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    query = query.gte('created_at', fromDate.toISOString());
  }
  if (dateRange?.to) {
    // Set time to the end of the day
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte('created_at', toDate.toISOString());
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Sale[]) || [];
};

export const createSale = async (items: CartItem[]): Promise<Sale> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in to create a sale.");

  const saleItems = items.map(item => ({
    product_id: item.product.id,
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc('create_new_sale', {
    sale_items: saleItems
  });

  if (error) {
    console.error("Error calling create_new_sale RPC:", error);
    throw error;
  }
  
  // The RPC returns the new sale's ID. We need to fetch the full sale data.
  const { data: newSale, error: fetchError } = await supabase
    .from('sales')
    .select('*, sale_items(*, products(*))')
    .eq('id', data)
    .single();

  if (fetchError) {
    console.error("Error fetching new sale after creation:", fetchError);
    throw fetchError;
  }

  return newSale as Sale;
};