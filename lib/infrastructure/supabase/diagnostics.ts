import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";
import { getCurrentUserId } from "@/lib/infrastructure/supabase/auth";
import type {
  DiagnosticAnswers,
  DiagnosticProfile,
  DiagnosticRecord,
} from "@/lib/infrastructure/supabase/diagnostic-types";

export type SaveDiagnosticInput = {
  answers: DiagnosticAnswers;
  profile: DiagnosticProfile;
  recommendedProductSlugs: string[];
};

export async function saveHairDiagnostic(
  input: SaveDiagnosticInput,
): Promise<{ id: string | null; saved: boolean; linkedToUser: boolean }> {
  const userId = await getCurrentUserId();
  const supabase = createSupabaseClient();

  if (!supabase) {
    return { id: null, saved: false, linkedToUser: false };
  }

  const payload = {
    user_id: userId,
    answers: input.answers,
    profile: input.profile,
    recommended_product_slugs: input.recommendedProductSlugs,
  };

  const { data, error } = await supabase
    .from("hair_diagnostics")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { id: null, saved: false, linkedToUser: Boolean(userId) };
  }

  return {
    id: String((data as { id: string }).id),
    saved: true,
    linkedToUser: Boolean(userId),
  };
}

export async function listMyDiagnostics(): Promise<DiagnosticRecord[]> {
  const userId = await getCurrentUserId();
  const supabase = createSupabaseClient();
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from("hair_diagnostics")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    answers: row.answers as DiagnosticAnswers,
    profile: row.profile as DiagnosticProfile,
    recommended_product_slugs: (row.recommended_product_slugs as string[]) ?? [],
    created_at: String(row.created_at),
  }));
}
