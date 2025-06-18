import React, { useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { LoadingScreen } from '@/components/ui/loading';
import { Session } from '@supabase/supabase-js';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    console.log("AuthProvider: Starting initialization...");
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Got initial session:", session ? "Session exists" : "No session");
      setSession(session);
      setInitialLoading(false);
    }).catch(error => {
      console.error("AuthProvider: Error getting session:", error);
      setInitialLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("AuthProvider: Auth state changed:", _event);
        setSession(session);
        
        if (!session) {
          console.log("AuthProvider: No session, clearing user");
          setUser(null);
          setInitialLoading(false);
          return;
        }

        try {
          console.log("AuthProvider: Fetching user profile...");
          const userProfile = await api.getCurrentUser();
          console.log("AuthProvider: Got user profile:", userProfile ? "Profile exists" : "No profile");
          setUser(userProfile);
        } catch (error) {
          console.error("AuthProvider: Failed to fetch user profile:", error);
          setUser(null);
        } finally {
          setInitialLoading(false);
        }
      }
    );

    return () => {
      console.log("AuthProvider: Cleaning up...");
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("AuthProvider: Attempting login for:", email);
    try {
      const userProfile = await api.apiLogin(email, password);
      console.log("AuthProvider: Login successful");
      setUser(userProfile);
    } catch (error) {
      console.error("AuthProvider: Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    console.log("AuthProvider: Attempting logout");
    try {
      await api.apiLogout();
      setUser(null);
      setSession(null);
      console.log("AuthProvider: Logout successful");
    } catch (error) {
      console.error("AuthProvider: Logout error:", error);
      throw error;
    }
  };
  
  const value = { user, session, isLoading: initialLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {initialLoading ? <LoadingScreen message="Initializing..." /> : children}
    </AuthContext.Provider>
  );
}