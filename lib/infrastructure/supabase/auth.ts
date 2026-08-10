import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";
import { absoluteUrl } from "@/lib/site";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export type AuthResult = {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
  /** True si l'utilisateur doit confirmer son e-mail avant de se connecter. */
  needsEmailConfirmation?: boolean;
};

/** Id de l'utilisateur connecté côté client, ou null si non authentifié. */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/** Utilisateur Supabase courant, ou null si non authentifié / Supabase non configuré. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

/** Session Supabase courante, ou null si absente / Supabase non configuré. */
export async function getSession(): Promise<Session | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Inscription email/mot de passe. Si aucune session n'est renvoyée, l'utilisateur doit confirmer son e-mail. */
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: absoluteUrl("/auth/callback"),
    },
  });

  return {
    user: data.user,
    session: data.session,
    error,
    needsEmailConfirmation: Boolean(data.user) && !data.session && !error,
  };
}

/** Finalise le lien de confirmation / magic link (PKCE `?code=`). */
export async function exchangeAuthCode(
  code: string,
): Promise<{ error: AuthError | null }> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return {
      error: {
        name: "AuthError",
        message: "Supabase is not configured",
        status: 500,
      } as AuthError,
    };
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return { error };
}

/** Connexion par email/mot de passe. */
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

/** Connexion / inscription Google (OAuth via Supabase). */
export async function signInWithGoogle(
  nextPath = "/compte",
): Promise<{ error: AuthError | null }> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return {
      error: {
        name: "AuthError",
        message: "Supabase is not configured",
        status: 500,
      } as AuthError,
    };
  }

  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  return { error };
}

/** Déconnecte l'utilisateur courant. */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = createSupabaseClient();
  if (!supabase) return { error: null };

  const { error } = await supabase.auth.signOut();
  return { error };
}

/** Met à jour le mot de passe de l'utilisateur connecté. */
export async function updatePassword(
  password: string,
): Promise<{ error: AuthError | null }> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return {
      error: {
        name: "AuthError",
        message: "Supabase is not configured",
        status: 500,
      } as AuthError,
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  return { error };
}

/** Envoie un e-mail de réinitialisation de mot de passe. */
export async function requestPasswordReset(
  email: string,
): Promise<{ error: AuthError | null }> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    return {
      error: {
        name: "AuthError",
        message: "Supabase is not configured",
        status: 500,
      } as AuthError,
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: absoluteUrl("/auth/callback?next=/compte"),
  });
  return { error };
}

/** S'abonne aux changements de session Supabase ; retourne une fonction de désinscription. */
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
