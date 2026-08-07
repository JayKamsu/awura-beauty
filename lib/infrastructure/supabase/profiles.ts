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
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

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
