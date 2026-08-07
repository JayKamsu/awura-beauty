"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  getSession,
  onAuthStateChange,
  requestPasswordReset,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updatePassword,
} from "@/lib/infrastructure/supabase/auth";
import { getSupabaseEnv } from "@/lib/infrastructure/supabase/client";

export type SignUpResult = {
  error: string | null;
  needsEmailConfirmation: boolean;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  logout: () => Promise<void>;
  changePassword: (password: string) => Promise<string | null>;
  requestPasswordReset: (email: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = getSupabaseEnv().configured;

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const current = await getSession();
      if (!mounted) return;
      setSession(current);
      setUser(current?.user ?? null);
      setLoading(false);
    })();

    const unsubscribe = onAuthStateChange((next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInWithEmail(email, password);
    if (result.error?.message) return result.error.message;
    if (result.session) {
      setSession(result.session);
      setUser(result.session.user);
    } else {
      const current = await getSession();
      setSession(current);
      setUser(current?.user ?? null);
    }
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await signUpWithEmail(email, password);
    if (result.error?.message) {
      return { error: result.error.message, needsEmailConfirmation: false };
    }
    if (result.session) {
      setSession(result.session);
      setUser(result.session.user);
    }
    return {
      error: null,
      needsEmailConfirmation: Boolean(result.needsEmailConfirmation),
    };
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    setSession(null);
  }, []);

  const changePassword = useCallback(async (password: string) => {
    const result = await updatePassword(password);
    return result.error?.message ?? null;
  }, []);

  const requestReset = useCallback(async (email: string) => {
    const result = await requestPasswordReset(email);
    return result.error?.message ?? null;
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      configured,
      signIn,
      signUp,
      logout,
      changePassword,
      requestPasswordReset: requestReset,
    }),
    [
      user,
      session,
      loading,
      configured,
      signIn,
      signUp,
      logout,
      changePassword,
      requestReset,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
