// ====================================================
// VozZap - Contexto de Autenticação
// ====================================================

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    // Obtém sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setIsLoading(false);
    });

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(
    async (email: string, password: string, username: string, fullName: string) => {
      try {
        console.log('[SignUp] Criando usuário:', email);
        
        // Criar usuário no Supabase Auth
        // O trigger handle_new_user() criará o profile automaticamente
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, full_name: fullName },
          },
        });

        if (error) {
          console.error('[SignUp] Erro ao criar usuário:', error);
          return { error: error.message };
        }

        console.log('[SignUp] Usuário criado com sucesso:', data?.user?.id);
        console.log('[SignUp] Profile será criado automaticamente pelo trigger');

        return { error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('[SignUp] Erro inesperado:', err);
        return { error: message };
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('[SignIn] Fazendo login com:', email);
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[SignIn] Erro ao fazer login:', error);
        return { error: error.message };
      }
      
      console.log('[SignIn] Login bem-sucedido');
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[SignIn] Erro inesperado:', err);
      return { error: message };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signUp, signIn, signOut, resetPassword, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
