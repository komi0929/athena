'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// ═══ Provider Token Persistence ═══
// Supabase only exposes provider_token during SIGNED_IN event.
// We must capture and persist it for later use (e.g., bookmark sync).
const PROVIDER_TOKEN_KEY = 'athena_x_provider_token';

export function getStoredProviderToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(PROVIDER_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeProviderToken(token: string) {
  try {
    localStorage.setItem(PROVIDER_TOKEN_KEY, token);
  } catch { /* ignore */ }
}

function clearProviderToken() {
  try {
    localStorage.removeItem(PROVIDER_TOKEN_KEY);
  } catch { /* ignore */ }
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithX: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes — capture provider_token on sign-in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // provider_token is ONLY available during SIGNED_IN / TOKEN_REFRESHED
        if (session?.provider_token) {
          console.log('[Auth] Captured provider_token from', event);
          storeProviderToken(session.provider_token);

          // Notify CosmosProvider to auto-sync on first login
          if (event === 'SIGNED_IN') {
            window.dispatchEvent(new CustomEvent('athena-user-signed-in'));
          }
        }

        if (event === 'SIGNED_OUT') {
          clearProviderToken();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithX = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'x',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'bookmark.read tweet.read users.read',
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    clearProviderToken();
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signInWithX, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
