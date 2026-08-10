import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";
import type {
  DiagnosticAppointment,
  DiagnosticAppointmentStatus,
  DiagnosticAvailabilityRule,
  DiagnosticChannel,
  DiagnosticLocale,
  DiagnosticOption,
  DiagnosticQuestion,
  DiagnosticQuestionChannel,
  DiagnosticRecord,
  DiagnosticRoutineStep,
  DiagnosticSettings,
  DiagnosticSlotOverride,
} from "@/lib/domain/diagnostic";
import { getFallbackQuestionnaire } from "@/lib/application/diagnostic/fallback-questionnaire";

const DEFAULT_SETTINGS: DiagnosticSettings = {
  onlinePriceCents: 0,
  onlineCompareCents: 9000,
  physicalPriceCents: 3980,
  physicalCompareCents: 15000,
  slotDurationMinutes: 45,
  physicalLocationText: "",
  currency: "EUR",
};

function pickLocale(
  locale: DiagnosticLocale,
  fr: string,
  en: string,
  es: string,
) {
  if (locale === "en") return en || fr;
  if (locale === "es") return es || fr;
  return fr;
}

function mapOption(
  row: Record<string, unknown>,
  locale: DiagnosticLocale,
): DiagnosticOption {
  const scoreRules =
    row.score_rules && typeof row.score_rules === "object"
      ? (row.score_rules as Record<string, number>)
      : {};
  return {
    id: String(row.id),
    questionId: String(row.question_id),
    valueKey: String(row.value_key),
    position: Number(row.position ?? 0),
    enabled: Boolean(row.enabled),
    labelFr: String(row.label_fr ?? ""),
    labelEn: String(row.label_en ?? ""),
    labelEs: String(row.label_es ?? ""),
    hintFr: String(row.hint_fr ?? ""),
    hintEn: String(row.hint_en ?? ""),
    hintEs: String(row.hint_es ?? ""),
    label: pickLocale(
      locale,
      String(row.label_fr ?? ""),
      String(row.label_en ?? ""),
      String(row.label_es ?? ""),
    ),
    hint: pickLocale(
      locale,
      String(row.hint_fr ?? ""),
      String(row.hint_en ?? ""),
      String(row.hint_es ?? ""),
    ),
    scoreRules,
  };
}

function mapQuestion(
  row: Record<string, unknown>,
  options: DiagnosticOption[],
  locale: DiagnosticLocale,
): DiagnosticQuestion {
  return {
    id: String(row.id),
    questionKey: String(row.question_key),
    channel: row.channel as DiagnosticQuestionChannel,
    position: Number(row.position ?? 0),
    enabled: Boolean(row.enabled),
    titleFr: String(row.title_fr ?? ""),
    titleEn: String(row.title_en ?? ""),
    titleEs: String(row.title_es ?? ""),
    subtitleFr: String(row.subtitle_fr ?? ""),
    subtitleEn: String(row.subtitle_en ?? ""),
    subtitleEs: String(row.subtitle_es ?? ""),
    title: pickLocale(
      locale,
      String(row.title_fr ?? ""),
      String(row.title_en ?? ""),
      String(row.title_es ?? ""),
    ),
    subtitle: pickLocale(
      locale,
      String(row.subtitle_fr ?? ""),
      String(row.subtitle_en ?? ""),
      String(row.subtitle_es ?? ""),
    ),
    options: options
      .filter((o) => o.questionId === String(row.id) && o.enabled)
      .sort((a, b) => a.position - b.position),
  };
}

/** Tarifs et réglages du diagnostic capillaire ; retombe sur les valeurs par défaut si Supabase est indisponible ou la ligne absente. */
export async function getDiagnosticSettings(): Promise<DiagnosticSettings> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return DEFAULT_SETTINGS;

  const { data, error } = await supabase
    .from("diagnostic_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;

  return {
    onlinePriceCents: Number(data.online_price_cents ?? 0),
    onlineCompareCents: Number(data.online_compare_cents ?? 9000),
    physicalPriceCents: Number(data.physical_price_cents ?? 3980),
    physicalCompareCents: Number(data.physical_compare_cents ?? 15000),
    slotDurationMinutes: Number(data.slot_duration_minutes ?? 45),
    physicalLocationText: String(data.physical_location_text ?? ""),
    currency: String(data.currency ?? "EUR"),
  };
}

/** Met à jour partiellement les réglages diagnostic (admin, service_role requis) et relit la valeur finale. */
export async function updateDiagnosticSettings(
  patch: Partial<DiagnosticSettings>,
): Promise<DiagnosticSettings | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.onlinePriceCents !== undefined)
    payload.online_price_cents = patch.onlinePriceCents;
  if (patch.onlineCompareCents !== undefined)
    payload.online_compare_cents = patch.onlineCompareCents;
  if (patch.physicalPriceCents !== undefined)
    payload.physical_price_cents = patch.physicalPriceCents;
  if (patch.physicalCompareCents !== undefined)
    payload.physical_compare_cents = patch.physicalCompareCents;
  if (patch.slotDurationMinutes !== undefined)
    payload.slot_duration_minutes = patch.slotDurationMinutes;
  if (patch.physicalLocationText !== undefined)
    payload.physical_location_text = patch.physicalLocationText;
  if (patch.currency !== undefined) payload.currency = patch.currency;

  const { data, error } = await supabase
    .from("diagnostic_settings")
    .upsert({ id: "default", ...payload })
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return getDiagnosticSettings();
}

/** Liste le questionnaire actif pour un canal/langue ; bascule sur le questionnaire de secours local si Supabase est indisponible ou vide. */
export async function listDiagnosticQuestions(input: {
  channel?: "online" | "physical_pre" | "all";
  locale?: DiagnosticLocale;
  includeDisabled?: boolean;
}): Promise<DiagnosticQuestion[]> {
  const locale = input.locale ?? "fr";
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) {
    if (input.channel === "physical_pre") {
      return getFallbackQuestionnaire("physical_pre", locale);
    }
    return getFallbackQuestionnaire("online", locale);
  }

  let q = supabase.from("diagnostic_questions").select("*").order("position");
  if (!input.includeDisabled) q = q.eq("enabled", true);
  if (input.channel === "online") {
    q = q.in("channel", ["online", "both"]);
  } else if (input.channel === "physical_pre") {
    q = q.in("channel", ["physical_pre", "both"]);
  }

  const { data: questions, error } = await q;
  if (error || !questions?.length) {
    if (input.channel === "physical_pre") {
      return getFallbackQuestionnaire("physical_pre", locale);
    }
    return getFallbackQuestionnaire("online", locale);
  }

  const { data: options } = await supabase
    .from("diagnostic_options")
    .select("*")
    .order("position");

  const mappedOptions = (options ?? []).map((row) =>
    mapOption(row as Record<string, unknown>, locale),
  );

  return questions
    .map((row) =>
      mapQuestion(row as Record<string, unknown>, mappedOptions, locale),
    )
    .filter((question) => input.includeDisabled || question.enabled);
}

/** Crée ou met à jour une question du diagnostic (admin, service_role requis). */
export async function upsertDiagnosticQuestion(input: {
  id?: string;
  questionKey: string;
  channel: DiagnosticQuestionChannel;
  position: number;
  enabled: boolean;
  titleFr: string;
  titleEn: string;
  titleEs: string;
  subtitleFr: string;
  subtitleEn: string;
  subtitleEs: string;
}): Promise<DiagnosticQuestion | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;

  const payload = {
    question_key: input.questionKey,
    channel: input.channel,
    position: input.position,
    enabled: input.enabled,
    title_fr: input.titleFr,
    title_en: input.titleEn,
    title_es: input.titleEs,
    subtitle_fr: input.subtitleFr,
    subtitle_en: input.subtitleEn,
    subtitle_es: input.subtitleEs,
  };

  const query = input.id
    ? supabase.from("diagnostic_questions").update(payload).eq("id", input.id)
    : supabase.from("diagnostic_questions").insert(payload);

  const { data, error } = await query.select("*").maybeSingle();
  if (error || !data) return null;
  return mapQuestion(data as Record<string, unknown>, [], "fr");
}

/** Supprime une question du diagnostic (admin, service_role requis). */
export async function deleteDiagnosticQuestion(id: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("diagnostic_questions")
    .delete()
    .eq("id", id);
  return !error;
}

/** Crée ou met à jour une option de réponse du diagnostic (admin, service_role requis). */
export async function upsertDiagnosticOption(input: {
  id?: string;
  questionId: string;
  valueKey: string;
  position: number;
  enabled: boolean;
  labelFr: string;
  labelEn: string;
  labelEs: string;
  hintFr: string;
  hintEn: string;
  hintEs: string;
  scoreRules: Record<string, number>;
}): Promise<DiagnosticOption | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;

  const payload = {
    question_id: input.questionId,
    value_key: input.valueKey,
    position: input.position,
    enabled: input.enabled,
    label_fr: input.labelFr,
    label_en: input.labelEn,
    label_es: input.labelEs,
    hint_fr: input.hintFr,
    hint_en: input.hintEn,
    hint_es: input.hintEs,
    score_rules: input.scoreRules,
  };

  const query = input.id
    ? supabase.from("diagnostic_options").update(payload).eq("id", input.id)
    : supabase.from("diagnostic_options").insert(payload);

  const { data, error } = await query.select("*").maybeSingle();
  if (error || !data) return null;
  return mapOption(data as Record<string, unknown>, "fr");
}

/** Supprime une option de réponse du diagnostic (admin, service_role requis). */
export async function deleteDiagnosticOption(id: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("diagnostic_options")
    .delete()
    .eq("id", id);
  return !error;
}

/** Règles hebdomadaires de disponibilité pour les créneaux diagnostic ; fallback sur des créneaux par défaut (mar-sam 10h-18h) si Supabase est indisponible. */
export async function listAvailabilityRules(): Promise<
  DiagnosticAvailabilityRule[]
> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) {
    return [2, 3, 4, 5, 6].map((weekday, i) => ({
      id: `fb-rule-${i}`,
      weekday,
      startTime: "10:00",
      endTime: "18:00",
      enabled: true,
    }));
  }
  const { data } = await supabase
    .from("diagnostic_availability_rules")
    .select("*")
    .order("weekday")
    .order("start_time");
  return (data ?? []).map((row) => ({
    id: String(row.id),
    weekday: Number(row.weekday),
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    enabled: Boolean(row.enabled),
  }));
}

/** Remplace intégralement les règles de disponibilité (admin, service_role requis) : supprime tout puis réinsère. */
export async function replaceAvailabilityRules(
  rules: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>,
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;
  await supabase
    .from("diagnostic_availability_rules")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (!rules.length) return true;
  const { error } = await supabase.from("diagnostic_availability_rules").insert(
    rules.map((r) => ({
      weekday: r.weekday,
      start_time: r.startTime,
      end_time: r.endTime,
      enabled: r.enabled,
    })),
  );
  return !error;
}

/** Liste les exceptions de créneaux (ouverts/bloqués) chevauchant la période donnée. */
export async function listSlotOverrides(fromIso: string, toIso: string) {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return [] as DiagnosticSlotOverride[];
  const { data } = await supabase
    .from("diagnostic_slot_overrides")
    .select("*")
    .lt("starts_at", toIso)
    .gt("ends_at", fromIso)
    .order("starts_at");
  return (data ?? []).map((row) => ({
    id: String(row.id),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    kind: row.kind as "open" | "blocked",
    note: String(row.note ?? ""),
  }));
}

/** Crée ou met à jour une exception de créneau (admin, service_role requis). */
export async function upsertSlotOverride(input: {
  id?: string;
  startsAt: string;
  endsAt: string;
  kind: "open" | "blocked";
  note?: string;
}): Promise<DiagnosticSlotOverride | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;
  const payload = {
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    kind: input.kind,
    note: input.note ?? "",
  };
  const query = input.id
    ? supabase.from("diagnostic_slot_overrides").update(payload).eq("id", input.id)
    : supabase.from("diagnostic_slot_overrides").insert(payload);
  const { data, error } = await query.select("*").maybeSingle();
  if (error || !data) return null;
  return {
    id: String(data.id),
    startsAt: String(data.starts_at),
    endsAt: String(data.ends_at),
    kind: data.kind as "open" | "blocked",
    note: String(data.note ?? ""),
  };
}

/** Supprime une exception de créneau (admin, service_role requis). */
export async function deleteSlotOverride(id: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("diagnostic_slot_overrides")
    .delete()
    .eq("id", id);
  return !error;
}

function mapAppointment(row: Record<string, unknown>): DiagnosticAppointment {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    email: String(row.email ?? ""),
    fullName: String(row.full_name ?? ""),
    phone: String(row.phone ?? ""),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    status: row.status as DiagnosticAppointmentStatus,
    answers: (row.answers as Record<string, string>) ?? {},
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? "EUR"),
    stripeSessionId: row.stripe_session_id
      ? String(row.stripe_session_id)
      : null,
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at),
  };
}

/** Rendez-vous chevauchant la période donnée, limité aux statuts actifs (en attente de paiement, confirmé, terminé) — utilisé pour le calcul des créneaux disponibles. */
export async function listAppointmentsInRange(
  fromIso: string,
  toIso: string,
): Promise<DiagnosticAppointment[]> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("diagnostic_appointments")
    .select("*")
    .lt("starts_at", toIso)
    .gt("ends_at", fromIso)
    .in("status", ["pending_payment", "confirmed", "completed"]);
  return (data ?? []).map((row) => mapAppointment(row as Record<string, unknown>));
}

/** Les 200 derniers rendez-vous, tous statuts confondus (admin, service_role requis). */
export async function listAllAppointments(): Promise<DiagnosticAppointment[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("diagnostic_appointments")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(200);
  return (data ?? []).map((row) => mapAppointment(row as Record<string, unknown>));
}

/** Récupère un rendez-vous par son id. */
export async function getAppointmentById(
  id: string,
): Promise<DiagnosticAppointment | null> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("diagnostic_appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return mapAppointment(data as Record<string, unknown>);
}

/** Crée un rendez-vous diagnostic, par défaut en attente de paiement. */
export async function createAppointment(input: {
  userId: string | null;
  email: string;
  fullName: string;
  phone: string;
  startsAt: string;
  endsAt: string;
  answers: Record<string, string>;
  amountCents: number;
  currency: string;
  status?: DiagnosticAppointmentStatus;
}): Promise<DiagnosticAppointment | null> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("diagnostic_appointments")
    .insert({
      user_id: input.userId,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: input.status ?? "pending_payment",
      answers: input.answers,
      amount_cents: input.amountCents,
      currency: input.currency,
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapAppointment(data as Record<string, unknown>);
}

/** Met à jour partiellement un rendez-vous (statut, session Stripe, notes, user lié) — admin, service_role requis. */
export async function updateAppointment(
  id: string,
  patch: {
    status?: DiagnosticAppointmentStatus;
    stripeSessionId?: string | null;
    notes?: string;
    userId?: string | null;
  },
): Promise<DiagnosticAppointment | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status) payload.status = patch.status;
  if (patch.stripeSessionId !== undefined)
    payload.stripe_session_id = patch.stripeSessionId;
  if (patch.notes !== undefined) payload.notes = patch.notes;
  if (patch.userId !== undefined) payload.user_id = patch.userId;
  const { data, error } = await supabase
    .from("diagnostic_appointments")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapAppointment(data as Record<string, unknown>);
}

/** Diagnostic enrichi des infos client (email/nom) pour l'affichage admin. */
export type AdminDiagnosticListItem = DiagnosticRecord & {
  customerEmail: string | null;
  customerName: string | null;
};

/** Les 200 derniers diagnostics capillaires, enrichis email/nom client via l'API admin auth (admin, service_role requis). */
export async function listAllHairDiagnostics(): Promise<AdminDiagnosticListItem[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hair_diagnostics")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []).map((row) =>
    mapDiagnosticRecord(row as Record<string, unknown>),
  );
  const userIds = [
    ...new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))),
  ];

  const emailByUser = new Map<string, string>();
  const nameByUser = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      const row = p as {
        id: string;
        first_name?: string;
        last_name?: string;
      };
      const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
      if (name) nameByUser.set(row.id, name);
    }

    await Promise.all(
      userIds.map(async (id) => {
        const { data: userData } = await supabase.auth.admin.getUserById(id);
        const email = userData.user?.email;
        if (email) emailByUser.set(id, email);
      }),
    );
  }

  return rows.map((row) => ({
    ...row,
    customerEmail: row.user_id ? emailByUser.get(row.user_id) ?? null : null,
    customerName: row.user_id ? nameByUser.get(row.user_id) ?? null : null,
  }));
}

/** Convertit une ligne brute Supabase en DiagnosticRecord typé ; exporté pour être réutilisé par diagnostics.ts. */
export function mapDiagnosticRecord(
  row: Record<string, unknown>,
): DiagnosticRecord {
  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    answers: row.answers as DiagnosticRecord["answers"],
    profile: row.profile as DiagnosticRecord["profile"],
    recommended_product_slugs: (row.recommended_product_slugs as string[]) ?? [],
    channel: (row.channel as DiagnosticChannel) || "online",
    appointment_id: row.appointment_id ? String(row.appointment_id) : null,
    routine: (row.routine as DiagnosticRoutineStep[]) ?? [],
    created_at: String(row.created_at),
  };
}
