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

  // This effect hook handles listening for auth changes (login/logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // If the user logs out, ensure their profile data is cleared.
        if (!session) {
          setUser(null);
        }
        // This is the critical part: we stop the initial loading screen
        // as soon as we know whether a session exists or not.
        setInitialLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // This second, separate effect hook is responsible for fetching the detailed
  // user profile from the database *after* we know a session exists.
  useEffect(() => {
    // We only run this if a session exists and we don't already have the user profile.
    if (session && !user) {
      api.getCurrentUser()
        .then((userProfile) => {
          setUser(userProfile);
        })
        .catch(async (error) => {
          console.error("Failed to fetch user profile for a valid session. Logging out.", error);
          // If the profile fetch fails, the session is corrupt/invalid. Force a logout.
          await api.apiLogout();
          setSession(null);
          setUser(null);
        });
    }
  }, [session, user]);

  const login = async (email: string, password: string) => {
    await api.apiLogin(email, password);
  };

  const logout = async () => {
    await api.apiLogout();
  };
  
  const value = { user, session, isLoading: initialLoading, login, logout };

  // The app's children are only blocked by the `initialLoading` state.
  // The `ProtectedRoute` will handle the secondary loading state for the user profile.
  return (
    <AuthContext.Provider value={value}>
      {initialLoading ? <LoadingScreen message="Initializing..." /> : children}
    </AuthContext.Provider>
  );
}