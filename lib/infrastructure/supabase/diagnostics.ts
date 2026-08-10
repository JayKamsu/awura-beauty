import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";
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
import type { SupabaseClient } from "@supabase/supabase-js";

/** Données d'un diagnostic capillaire à persister, avec routine et lien optionnel vers un rendez-vous. */
export type SaveDiagnosticInput = {
  answers: DiagnosticAnswers | DiagnosticAnswerMap;
  profile: DiagnosticProfile;
  recommendedProductSlugs: string[];
  channel?: DiagnosticChannel;
  appointmentId?: string | null;
  routine?: DiagnosticRoutineStep[];
  userId?: string | null;
};

async function insertDiagnostic(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("hair_diagnostics")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (!error && data) {
    return String((data as { id: string }).id);
  }

  // Colonnes v2 absentes : fallback insert legacy
  const legacy = await supabase
    .from("hair_diagnostics")
    .insert({
      user_id: payload.user_id ?? null,
      answers: payload.answers,
      profile: payload.profile,
      recommended_product_slugs: payload.recommended_product_slugs,
    })
    .select("id")
    .maybeSingle();

  if (legacy.error || !legacy.data) return null;
  return String((legacy.data as { id: string }).id);
}

/**
 * Persiste un diagnostic.
 * Côté API serveur : service_role (RLS : insert lié à un user_id échoue sans JWT).
 * Côté navigateur : client session utilisateur.
 */
export async function saveHairDiagnostic(
  input: SaveDiagnosticInput,
): Promise<{ id: string | null; saved: boolean; linkedToUser: boolean }> {
  const userId =
    input.userId !== undefined ? input.userId : await getCurrentUserId();

  const onServer = typeof window === "undefined";
  const supabase = onServer
    ? createAdminSupabaseClient() ?? createSupabaseClient()
    : createSupabaseClient();

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

  const id = await insertDiagnostic(supabase, payload);
  return {
    id,
    saved: Boolean(id),
    linkedToUser: Boolean(userId),
  };
}

/** Diagnostics de l'utilisateur connecté (session navigateur, RLS filtre déjà par user_id). */
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

/** Liste diagnostics du compte via Bearer (API route). */
export async function listDiagnosticsForUserId(
  userId: string,
): Promise<DiagnosticRecord[]> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("hair_diagnostics")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapDiagnosticRecord(row as Record<string, unknown>));
}
