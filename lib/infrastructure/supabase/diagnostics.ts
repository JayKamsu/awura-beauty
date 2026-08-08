import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";
import { getCurrentUserId } from "@/lib/infrastructure/supabase/auth";
import { mapDiagnosticRecord } from "@/lib/infrastructure/supabase/diagnostic-admin";
import type {
  DiagnosticAnswerMap,
  DiagnosticAnswers,
  DiagnosticChannel,
  DiagnosticProfile,
  DiagnosticRecord,
  DiagnosticRoutineStep,
} from "@/lib/domain/diagnostic";

export type SaveDiagnosticInput = {
  answers: DiagnosticAnswers | DiagnosticAnswerMap;
  profile: DiagnosticProfile;
  recommendedProductSlugs: string[];
  channel?: DiagnosticChannel;
  appointmentId?: string | null;
  routine?: DiagnosticRoutineStep[];
  userId?: string | null;
};

export async function saveHairDiagnostic(
  input: SaveDiagnosticInput,
): Promise<{ id: string | null; saved: boolean; linkedToUser: boolean }> {
  const userId =
    input.userId !== undefined ? input.userId : await getCurrentUserId();
  const supabase = createSupabaseClient();

  if (!supabase) {
    return { id: null, saved: false, linkedToUser: Boolean(userId) };
  }

  const payload = {
    user_id: userId,
    answers: input.answers,
    profile: input.profile,
    recommended_product_slugs: input.recommendedProductSlugs,
    channel: input.channel ?? "online",
    appointment_id: input.appointmentId ?? null,
    routine: input.routine ?? [],
  };

  const { data, error } = await supabase
    .from("hair_diagnostics")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    // Colonnes v2 absentes : fallback insert legacy
    const legacy = await supabase
      .from("hair_diagnostics")
      .insert({
        user_id: userId,
        answers: input.answers,
        profile: input.profile,
        recommended_product_slugs: input.recommendedProductSlugs,
      })
      .select("id")
      .maybeSingle();
    if (legacy.error || !legacy.data) {
      return { id: null, saved: false, linkedToUser: Boolean(userId) };
    }
    return {
      id: String((legacy.data as { id: string }).id),
      saved: true,
      linkedToUser: Boolean(userId),
    };
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

  return data.map((row) => mapDiagnosticRecord(row as Record<string, unknown>));
}
