// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase Client: Initializing with URL:", supabaseUrl ? "URL present" : "URL missing");
console.log("Supabase Client: Anon key:", supabaseAnonKey ? "Key present" : "Key missing");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or anonymous key is missing from environment variables. Please add them to your .env file.");
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error("Invalid Supabase URL format. URL should be in the format: https://[project-id].supabase.co");
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Add debug logging for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Supabase Client: Auth state changed:", event, session ? "Session exists" : "No session");
});
