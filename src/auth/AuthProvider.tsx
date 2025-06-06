import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { LoadingScreen } from '@/components/ui/loading';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        const currentUser = session ? await api.getCurrentUser() : null;
        setUser(currentUser);
        setIsLoading(false);
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await api.apiLogin(email, password);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    await api.apiLogout();
    setUser(null);
  }, []);

  const value = { user, isLoading, login, logout };

  if (isLoading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}