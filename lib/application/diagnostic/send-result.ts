/**
 * Envoi / partage d’un résultat diagnostic vers le compte client (+ push).
 */
import { buildRoutineSteps } from "@/lib/application/diagnostic/recommend";
import { notifyOrderUser } from "@/lib/connectors/firebase";
import { absoluteUrl } from "@/lib/site";
import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import {
  getAppointmentById,
  mapDiagnosticRecord,
  updateAppointment,
} from "@/lib/infrastructure/supabase/diagnostic-admin";
import type {
  DiagnosticChannel,
  DiagnosticProfile,
  DiagnosticRecord,
  DiagnosticRoutineStep,
} from "@/lib/domain/diagnostic";

/** Paramètres d'envoi d'un résultat de diagnostic (admin ou automatique) vers un client. */
export type SendDiagnosticResultInput = {
  channel: DiagnosticChannel;
  userId?: string | null;
  email?: string | null;
  appointmentId?: string | null;
  title: string;
  summary: string;
  /** Analyse cuir chevelu / trichogramme (présentiel). */
  scalpAnalysis?: string;
  /** Processus / suivi routine rédigé par l’admin. */
  detailedFeedback?: string;
  tags?: string[];
  recommendedProductSlugs: string[];
  routine?: DiagnosticRoutineStep[];
  answers?: Record<string, string>;
  notifyClient?: boolean;
  locale?: string;
  markAppointmentCompleted?: boolean;
};

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;
  const target = email.trim().toLowerCase();
  if (!target) return null;
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error || !data?.users) return null;
  const match = data.users.find(
    (u) => (u.email || "").toLowerCase() === target,
  );
  return match?.id ?? null;
}

/** Enregistre le résultat diagnostic, relie le compte client par email si besoin, marque le RDV terminé et notifie. */
export async function sendDiagnosticResultToClient(
  input: SendDiagnosticResultInput,
): Promise<{
  record: DiagnosticRecord | null;
  error: string | null;
  linkedToUser: boolean;
}> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { record: null, error: "Supabase admin unavailable", linkedToUser: false };
  }

  let userId = input.userId ?? null;
  let answers = input.answers ?? {};
  const appointmentId = input.appointmentId ?? null;
  let email = input.email ?? null;

  if (appointmentId) {
    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      return { record: null, error: "Appointment not found", linkedToUser: false };
    }
    userId = userId ?? appointment.userId;
    email = email ?? appointment.email;
    answers = Object.keys(answers).length ? answers : appointment.answers;
  }

  if (!userId && email) {
    userId = await findAuthUserIdByEmail(email);
    if (userId && appointmentId) {
      await updateAppointment(appointmentId, { userId });
    }
  }

  const notify = input.notifyClient !== false;

  const routine =
    input.routine?.length
      ? input.routine
      : buildRoutineSteps(input.recommendedProductSlugs, input.locale ?? "fr");

  const scalpAnalysis = input.scalpAnalysis?.trim() || undefined;
  const detailedFeedback =
    input.detailedFeedback?.trim() || input.summary.trim();

  const profile: DiagnosticProfile = {
    key: `admin-${Date.now()}`,
    titleKey: "diagnostic.profiles.balance.title",
    summaryKey: "diagnostic.profiles.balance.summary",
    title: input.title.trim(),
    summary: input.summary.trim(),
    detailedFeedback,
    scalpAnalysis,
    tags: input.tags?.length
      ? input.tags
      : [input.channel, ...(scalpAnalysis ? ["trichogramme"] : [])],
  };

  const { data, error } = await supabase
    .from("hair_diagnostics")
    .insert({
      user_id: userId,
      answers,
      profile,
      recommended_product_slugs: input.recommendedProductSlugs,
      channel: input.channel,
      appointment_id: appointmentId,
      routine,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return {
      record: null,
      error: error?.message ?? "Unable to save diagnostic result",
      linkedToUser: false,
    };
  }

  if (appointmentId && input.markAppointmentCompleted !== false) {
    await updateAppointment(appointmentId, { status: "completed" });
  }

  if (notify && userId) {
    await notifyOrderUser({
      userId,
      title: "Ton résultat diagnostic Awura",
      body: input.title.trim() || "Ton diagnostic est disponible dans ton compte.",
      link: absoluteUrl("/compte#diagnostics"),
    });
  }

  return {
    record: mapDiagnosticRecord(data as Record<string, unknown>),
    error: null,
    linkedToUser: Boolean(userId),
  };
}

/** Push auto après diagnostic online (si user connecté). */
export async function notifyOnlineDiagnosticSaved(input: {
  userId: string | null | undefined;
  title?: string;
}): Promise<void> {
  if (!input.userId) return;
  await notifyOrderUser({
    userId: input.userId,
    title: "Diagnostic enregistré",
    body:
      input.title ||
      "Ton résultat Awura est disponible dans Mon compte → Diagnostics.",
    link: absoluteUrl("/compte#diagnostics"),
  });
}
