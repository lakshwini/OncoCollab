import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { authService, User as AppUser } from '../services/auth.service';

interface AuthContextType {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurer la session au chargement (gère custom ET supabase)
    authService.restoreSession().then((restored) => {
      if (restored) {
        setAppUser(restored.user);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Récupérer la session Supabase initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
    });

    // Écouter les changements d'auth Supabase (TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        // Supabase a auto-refresh le token → mettre à jour localStorage
        const source = authService.getAuthSource();
        if (source === 'supabase') {
          localStorage.setItem('onco_collab_token', session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        setAppUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, token } = await authService.loginWithSupabase({ email, password });
    setAppUser(user);
  };

  const signUp = async (email: string, password: string) => {
    const { user, token } = await authService.signUpWithSupabase({ email, password });
    setAppUser(user);
  };

  const signOut = async () => {
    await authService.logoutSupabase();
    setAppUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  const sendOTP = async (email: string) => {
    await authService.sendOTPWithSupabase(email);
  };

  const verifyOTP = async (email: string, token: string) => {
    const { user } = await authService.verifyOTPWithSupabase(email, token);
    setAppUser(user);
  };

  const value = {
    session,
    supabaseUser,
    appUser,
    loading,
    signIn,
    signUp,
    signOut,
    sendOTP,
    verifyOTP,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
