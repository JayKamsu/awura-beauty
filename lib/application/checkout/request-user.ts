import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";

/** Extrait l’user id depuis Authorization Bearer (optionnel). */
export async function userIdFromRequest(
  request: Request,
): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const accessToken = header.slice("Bearer ".length).trim();
  if (!accessToken) return null;

  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user.id;
}
