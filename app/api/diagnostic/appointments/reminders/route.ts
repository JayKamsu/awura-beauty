import { NextResponse } from "next/server";
import { notifyAppointmentReminder } from "@/lib/application/notifications/appointment-notify";
import { VIDEO_JOIN_WINDOW_MINUTES } from "@/lib/application/diagnostic/video";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  listAppointmentsDueForReminder,
  markAppointmentReminderSent,
} from "@/lib/infrastructure/supabase/diagnostic-admin";

/**
 * Rappel "la visio démarre dans 5 minutes" (push + e-mail, client + admin).
 * - Admin Bearer, ou header Authorization: Bearer ${CRON_SECRET} / x-cron-secret
 * - GET : appelé par le cron Vercel (vercel.json, toutes les 5 min).
 */
export async function GET(request: Request) {
  return handleReminders(request);
}

export async function POST(request: Request) {
  return handleReminders(request);
}

async function handleReminders(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const headerSecret =
    request.headers.get("x-cron-secret")?.trim() ||
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")!.slice(7).trim()
      : "");

  const isCron = Boolean(cronSecret && headerSecret && headerSecret === cronSecret);

  if (!isCron) {
    const auth = await requireAdminFromRequest(request);
    if ("error" in auth) return auth.error;
  }

  const now = Date.now();
  // Fenêtre de 2 minutes centrée sur "now + 5 min" pour absorber la latence du cron.
  const from = new Date(
    now + VIDEO_JOIN_WINDOW_MINUTES * 60_000 - 60_000,
  ).toISOString();
  const to = new Date(
    now + VIDEO_JOIN_WINDOW_MINUTES * 60_000 + 60_000,
  ).toISOString();

  const due = await listAppointmentsDueForReminder(from, to);

  let sent = 0;
  for (const appointment of due) {
    await notifyAppointmentReminder(appointment);
    await markAppointmentReminderSent(appointment.id);
    sent += 1;
  }

  return NextResponse.json({ checked: due.length, sent });
}
