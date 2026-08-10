import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import type { LoyaltyReason } from "@/lib/domain/loyalty";

/** Ligne d'historique de points fidélité (crédit ou débit), tracée pour audit et idempotence. */
export type LoyaltyLedgerEntry = {
  id: string;
  user_id: string;
  delta: number;
  balance_after: number;
  reason: LoyaltyReason;
  order_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

/** Solde de points et infos de parrainage d'un utilisateur. */
export type LoyaltyProfile = {
  id: string;
  loyalty_points: number;
  referral_code: string | null;
  referred_by: string | null;
  referral_rewarded_at: string | null;
};

function mapLedger(row: Record<string, unknown>): LoyaltyLedgerEntry {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    delta: Number(row.delta ?? 0),
    balance_after: Number(row.balance_after ?? 0),
    reason: row.reason as LoyaltyReason,
    order_id: row.order_id ? String(row.order_id) : null,
    meta: (row.meta as Record<string, unknown>) ?? {},
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapLoyaltyProfile(row: Record<string, unknown>): LoyaltyProfile {
  return {
    id: String(row.id),
    loyalty_points: Number(row.loyalty_points ?? 0),
    referral_code: row.referral_code ? String(row.referral_code) : null,
    referred_by: row.referred_by ? String(row.referred_by) : null,
    referral_rewarded_at: row.referral_rewarded_at
      ? String(row.referral_rewarded_at)
      : null,
  };
}

/** Profil fidélité d'un utilisateur (service_role). */
export async function getLoyaltyProfile(
  userId: string,
): Promise<LoyaltyProfile | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, loyalty_points, referral_code, referred_by, referral_rewarded_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapLoyaltyProfile(data as Record<string, unknown>);
}

/** Retourne le code de parrainage existant ou en génère un (retries en cas de collision). */
export async function ensureReferralCode(
  userId: string,
): Promise<string | null> {
  const existing = await getLoyaltyProfile(userId);
  if (existing?.referral_code) return existing.referral_code;

  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;

  // Génération côté app si trigger absent
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 8; attempt++) {
    let code = "AW";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const { data, error } = await supabase
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", userId)
      .is("referral_code", null)
      .select("referral_code")
      .maybeSingle();
    if (!error && data?.referral_code) return String(data.referral_code);
  }

  const again = await getLoyaltyProfile(userId);
  return again?.referral_code ?? null;
}

/** Retrouve le profil propriétaire d'un code de parrainage donné. */
export async function findProfileByReferralCode(
  code: string,
): Promise<LoyaltyProfile | null> {
  const supabase = createAdminSupabaseClient();
  const normalized = code.trim().toUpperCase();
  if (!supabase || !normalized) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, loyalty_points, referral_code, referred_by, referral_rewarded_at")
    .eq("referral_code", normalized)
    .maybeSingle();

  if (error || !data) return null;
  return mapLoyaltyProfile(data as Record<string, unknown>);
}

/** Lie un filleul à son parrain. Refuse l'auto-parrainage et n'écrase jamais un parrain déjà attaché (idempotent). */
export async function attachReferrer(input: {
  userId: string;
  referrerId: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (input.userId === input.referrerId) {
    return { ok: false, error: "self_referral" };
  }
  const supabase = createAdminSupabaseClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  const profile = await getLoyaltyProfile(input.userId);
  if (!profile) return { ok: false, error: "profile_missing" };
  if (profile.referred_by) return { ok: false, error: "already_referred" };

  const { error } = await supabase
    .from("profiles")
    .update({ referred_by: input.referrerId })
    .eq("id", input.userId)
    .is("referred_by", null);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Vérifie si l'utilisateur a au moins une commande payée, en excluant éventuellement la commande en cours (utile pour valider une récompense de parrainage). */
export async function userHasPaidOrder(
  userId: string,
  options?: { excludeOrderId?: string },
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase || !userId) return false;

  const query = supabase
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .or("payment_status.eq.paid,status.eq.paid")
    .limit(5);

  const { data, error } = await query;
  if (error || !data) return false;
  const others = options?.excludeOrderId
    ? data.filter((row) => String(row.id) !== options.excludeOrderId)
    : data;
  return others.length > 0;
}

/** Historique des mouvements de points fidélité d'un utilisateur, du plus récent au plus ancien. */
export async function listLoyaltyLedger(
  userId: string,
  limit = 30,
): Promise<LoyaltyLedgerEntry[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from("loyalty_ledger")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row) => mapLedger(row as Record<string, unknown>));
}

/**
 * Applique un delta de points (service_role). Idempotent si orderId+reason déjà présent.
 */
export async function applyLoyaltyDelta(input: {
  userId: string;
  delta: number;
  reason: LoyaltyReason;
  orderId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<{ ok: boolean; balance?: number; skipped?: boolean; error?: string }> {
  if (!input.delta) return { ok: true, skipped: true };

  const supabase = createAdminSupabaseClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  if (input.orderId) {
    const { data: existing } = await supabase
      .from("loyalty_ledger")
      .select("id, balance_after")
      .eq("order_id", input.orderId)
      .eq("reason", input.reason)
      .maybeSingle();
    if (existing) {
      return {
        ok: true,
        skipped: true,
        balance: Number(existing.balance_after ?? 0),
      };
    }
  }

  const profile = await getLoyaltyProfile(input.userId);
  if (!profile) return { ok: false, error: "profile_missing" };

  const next = profile.loyalty_points + input.delta;
  if (next < 0) return { ok: false, error: "insufficient_points" };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ loyalty_points: next })
    .eq("id", input.userId);

  if (updateError) return { ok: false, error: updateError.message };

  const { error: ledgerError } = await supabase.from("loyalty_ledger").insert({
    user_id: input.userId,
    delta: input.delta,
    balance_after: next,
    reason: input.reason,
    order_id: input.orderId ?? null,
    meta: input.meta ?? {},
  });

  if (ledgerError) {
    // Unique violation = concurrent idempotent write
    if (ledgerError.code === "23505" && input.orderId) {
      return { ok: true, skipped: true, balance: next };
    }
    return { ok: false, error: ledgerError.message };
  }

  return { ok: true, balance: next };
}

/** Marque le parrainage comme récompensé. Idempotent : n'écrit que si le champ était encore null, évite un double crédit. */
export async function markReferralRewarded(
  userId: string,
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ referral_rewarded_at: new Date().toISOString() })
    .eq("id", userId)
    .is("referral_rewarded_at", null);

  return !error;
}

/** Non implémenté : les profils n'ont pas d'email directement lié (nécessiterait une jointure auth indisponible côté client) — retourne toujours une map vide. */
export async function listLoyaltyProfilesByEmails(
  emails: string[],
): Promise<Map<string, LoyaltyProfile & { email?: string }>> {
  const supabase = createAdminSupabaseClient();
  const map = new Map<string, LoyaltyProfile & { email?: string }>();
  if (!supabase || emails.length === 0) return map;

  // profiles n'ont pas d'email — jointure via auth n'est pas dispo en client.
  // On mappe via user_id des commandes côté admin-dashboard.
  return map;
}

/** Récupère plusieurs profils fidélité en une requête, indexés par id (admin, service_role requis). */
export async function getLoyaltyProfilesByIds(
  ids: string[],
): Promise<Map<string, LoyaltyProfile>> {
  const supabase = createAdminSupabaseClient();
  const map = new Map<string, LoyaltyProfile>();
  if (!supabase || ids.length === 0) return map;

  const unique = [...new Set(ids.filter(Boolean))];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, loyalty_points, referral_code, referred_by, referral_rewarded_at")
    .in("id", unique);

  if (error || !data) return map;
  for (const row of data) {
    const profile = mapLoyaltyProfile(row as Record<string, unknown>);
    map.set(profile.id, profile);
  }
  return map;
}
