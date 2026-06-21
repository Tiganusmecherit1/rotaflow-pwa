'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Angajat } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  angajat: Angajat | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  angajat: null,
  loading: true,
  signIn: async () => null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [angajat, setAngajat] = useState<Angajat | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAngajat = async (userId: string) => {
    const { data, error } = await supabase
      .from('angajati')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('Eroare la incarcarea angajatului:', error);
    }
    setAngajat((data as Angajat) ?? null);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user?.id) {
        loadAngajat(session.user.id).finally(() => { if (mounted) setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (!mounted) return;
      setSession(session);
      if (session?.user?.id) {
        loadAngajat(session.user.id).finally(() => { if (mounted) setLoading(false); });
      } else {
        setAngajat(null);
        setLoading(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    console.log('Incerc login cu:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Rezultat login:', { data, error });
    if (error) return error.message;
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, angajat, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
