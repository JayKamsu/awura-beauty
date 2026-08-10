import type { User } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";

/** Allowlist serveur uniquement (jamais exposée au client). */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Active un faux admin en dev local (hors production) pour tester les routes sans JWT. */
export function isAdminDevBypassEnabled(): boolean {
  return (
    process.env.ADMIN_DEV_BYPASS === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

/**
 * Droits admin.
 * - `app_metadata.role` uniquement (écrit côté service_role) — jamais `user_metadata`.
 * - Allowlist `ADMIN_EMAILS` côté serveur uniquement.
 */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;

  if (user.app_metadata?.role === "admin") return true;

  if (typeof window === "undefined") {
    const email = user.email?.toLowerCase();
    if (email && getAdminEmails().includes(email)) return true;
  }

  return false;
}

/** Résout l'utilisateur Supabase à partir d'un access token brut (ex. header Authorization). */
export async function getUserFromAccessToken(
  accessToken: string | null,
): Promise<User | null> {
  if (!accessToken) return null;
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

/** Vérifie que l'appelant est admin (JWT Bearer) avant d'autoriser une route API admin ; sinon renvoie une Response 401/403 prête à l'emploi. */
export async function requireAdminFromRequest(
  request: Request,
): Promise<{ user: User } | { error: Response }> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : null;

  if (token) {
    const user = await getUserFromAccessToken(token);
    if (!user || !isAdminUser(user)) {
      return {
        error: Response.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
    return { user };
  }

  // Sans JWT : faux admin uniquement hors prod, pour tests API locaux.
  if (isAdminDevBypassEnabled()) {
    return {
      user: {
        id: "dev-admin",
        aud: "authenticated",
        created_at: new Date(0).toISOString(),
        email: "admin@awura.local",
        app_metadata: { role: "admin" },
        user_metadata: {},
      } as User,
    };
  }

  return {
    error: Response.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
