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
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  updatePassword,
} from "@/lib/infrastructure/supabase/auth";
import { getSupabaseEnv } from "@/lib/infrastructure/supabase/client";

/** Résultat d'une tentative d'inscription : erreur éventuelle, besoin de confirmation email, token d'accès. */
export type SignUpResult = {
  error: string | null;
  needsEmailConfirmation: boolean;
  accessToken?: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signInWithGoogle: (redirectTo?: string) => Promise<string | null>;
  logout: () => Promise<void>;
  changePassword: (password: string) => Promise<string | null>;
  requestPasswordReset: (email: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Fournit l'état d'authentification Supabase (session, utilisateur) et les actions associées à toute l'app. */
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
      return {
        error: result.error.message,
        needsEmailConfirmation: false,
        accessToken: null,
      };
    }
    if (result.session) {
      setSession(result.session);
      setUser(result.session.user);
    }
    return {
      error: null,
      needsEmailConfirmation: Boolean(result.needsEmailConfirmation),
      accessToken: result.session?.access_token ?? null,
    };
  }, []);

  const signInGoogle = useCallback(async (redirectTo = "/compte") => {
    const result = await signInWithGoogle(redirectTo);
    return result.error?.message ?? null;
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
      signInWithGoogle: signInGoogle,
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
      signInGoogle,
      logout,
      changePassword,
      requestReset,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Accès à l'état et aux actions d'authentification ; doit être utilisé sous `AuthProvider`. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
