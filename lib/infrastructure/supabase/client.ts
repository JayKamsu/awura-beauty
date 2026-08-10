import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let adminBrowserClient: SupabaseClient | null = null;

/**
 * Clé de stockage dédiée à la session admin — évite que la connexion
 * /admin/connexion partage la session (localStorage) du site public.
 */
const ADMIN_AUTH_STORAGE_KEY = "sb-admin-auth-token";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

/** Client Supabase (navigateur ou serveur). Ne jamais appeler depuis un composant UI. */
export function createSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured || !url || !anonKey) return null;

  if (typeof window === "undefined") {
    return createClient(url, anonKey);
  }

  if (window.location.pathname.startsWith("/admin")) {
    return createAdminBrowserClient(url, anonKey);
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return browserClient;
}

/**
 * Client dédié à l'espace admin : session stockée sous une clé distincte,
 * pour que se connecter sur /admin ne connecte pas aussi le visiteur côté
 * boutique (panier, compte client) et inversement.
 */
function createAdminBrowserClient(url: string, anonKey: string): SupabaseClient {
  if (!adminBrowserClient) {
    adminBrowserClient = createClient(url, anonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: ADMIN_AUTH_STORAGE_KEY,
      },
    });
  }
  return adminBrowserClient;
}

/** Client service_role (serveur uniquement) — bypass RLS pour l'admin. */
export function createSupabaseServiceClient(): SupabaseClient | null {
  if (typeof window !== "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Client admin (serveur uniquement).
 * Prod : service_role obligatoire.
 * Dev : fallback anon si la clé service n'est pas encore configurée.
 */
export function createAdminSupabaseClient(): SupabaseClient | null {
  if (typeof window !== "undefined") return null;
  const service = createSupabaseServiceClient();
  if (service) return service;
  if (process.env.NODE_ENV === "production") return null;
  return createSupabaseClient();
}
