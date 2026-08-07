import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export type AuthResult = {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
};

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getSession(): Promise<Session | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: {
        name: "AuthError",
        message: "Supabase is not configured",
        status: 500,
      } as AuthError,
    };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data.user, session: data.session, error };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: {
        name: "AuthError",
        message: "Supabase is not configured",
        status: 500,
      } as AuthError,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data.user, session: data.session, error };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = createSupabaseClient();
  if (!supabase) return { error: null };

  const { error } = await supabase.auth.signOut();
  return { error };
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const supabase = createSupabaseClient();
  if (!supabase) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}
