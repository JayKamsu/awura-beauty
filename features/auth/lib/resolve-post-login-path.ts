import { getSession } from "@/lib/infrastructure/supabase/auth";

/**
 * Après login : les comptes admin vont vers /admin, les clients vers /compte (ou next).
 */
export async function resolvePostLoginPath(
  preferredPath = "/compte",
): Promise<string> {
  if (preferredPath.startsWith("/admin")) {
    return preferredPath;
  }

  const session = await getSession();
  const token = session?.access_token;
  if (!token) return preferredPath;

  try {
    const res = await fetch("/api/admin/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return "/admin";
  } catch {
    // ignore — fallback client
  }

  return preferredPath;
}
