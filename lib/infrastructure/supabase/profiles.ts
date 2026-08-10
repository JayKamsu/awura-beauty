import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";
import { getCurrentUserId } from "@/lib/infrastructure/supabase/auth";
import type {
  ProfileRow,
  ProfileUpdateInput,
} from "@/lib/infrastructure/supabase/profile-types";

function mapProfile(row: Record<string, unknown>): ProfileRow {
  return {
    id: String(row.id),
    first_name: String(row.first_name ?? ""),
    last_name: String(row.last_name ?? ""),
    phone: String(row.phone ?? ""),
    address_line1: String(row.address_line1 ?? ""),
    city: String(row.city ?? ""),
    postal_code: String(row.postal_code ?? ""),
    country: String(row.country ?? "FR") || "FR",
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

/** Profil de l'utilisateur connecté ; le crée automatiquement (ligne vide) s'il n'existe pas encore. */
export async function getMyProfile(): Promise<ProfileRow | null> {
  const userId = await getCurrentUserId();
  const supabase = createSupabaseClient();
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  if (data) return mapProfile(data as Record<string, unknown>);

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("*")
    .maybeSingle();

  if (insertError || !created) return null;
  return mapProfile(created as Record<string, unknown>);
}

/** Met à jour (upsert) le profil de l'utilisateur connecté ; échoue si non authentifié. */
export async function updateMyProfile(
  input: ProfileUpdateInput,
): Promise<{ profile: ProfileRow | null; error: string | null }> {
  const userId = await getCurrentUserId();
  const supabase = createSupabaseClient();
  if (!supabase || !userId) {
    return { profile: null, error: "Not authenticated" };
  }

  const payload = {
    id: userId,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    phone: input.phone.trim(),
    address_line1: input.address_line1.trim(),
    city: input.city.trim(),
    postal_code: input.postal_code.trim(),
    country: (input.country.trim() || "FR").toUpperCase(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { profile: null, error: error?.message ?? "Unable to save profile" };
  }

  return { profile: mapProfile(data as Record<string, unknown>), error: null };
}
