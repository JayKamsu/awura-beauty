import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";

/** Liste les ids produit favoris d'un utilisateur, triés du plus récent au plus ancien. */
export async function listFavoriteProductIds(userId: string): Promise<string[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => String(row.product_id));
}

/** Ajoute un produit aux favoris (idempotent). */
export async function addFavorite(
  userId: string,
  productId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return { ok: false, error: "Supabase admin client unavailable" };

  const { error } = await supabase
    .from("favorites")
    .upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Retire un produit des favoris. */
export async function removeFavorite(
  userId: string,
  productId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return { ok: false, error: "Supabase admin client unavailable" };

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Fusionne une liste de favoris locaux (guest) dans le compte : ajoute ceux qui
 * manquent, sans jamais supprimer un favori déjà présent côté serveur.
 */
export async function mergeFavorites(
  userId: string,
  productIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return { ok: false, error: "Supabase admin client unavailable" };
  if (productIds.length === 0) return { ok: true };

  const payload = productIds.map((productId) => ({ user_id: userId, product_id: productId }));
  const { error } = await supabase
    .from("favorites")
    .upsert(payload, { onConflict: "user_id,product_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
