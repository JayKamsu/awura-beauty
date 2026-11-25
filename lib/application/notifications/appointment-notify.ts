/**
 * Notifications RDV diagnostic (push + e-mail) : confirmation, replanification et rappel J-5min.
 */
import { notifyAdminUsers, notifyOrderUser } from "@/lib/connectors/firebase";
import {
  buildAppointmentIcs,
  calendarOrganizerEmail,
  calendarSyncEmail,
} from "@/lib/application/diagnostic/ics";
import { diagnosticVideoAbsoluteUrl } from "@/lib/application/diagnostic/video";
import { sendEmail } from "@/lib/infrastructure/email/smtp";
import { getDiagnosticSettings } from "@/lib/infrastructure/supabase/diagnostic-admin";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import { absoluteUrl, CONTACT_EMAIL } from "@/lib/site";
import type { DiagnosticAppointment } from "@/lib/domain/diagnostic";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(toIntlLocale("fr"), {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(iso));
}

function appointmentAccountLink(): string {
  return absoluteUrl("/compte#diagnostics");
}

function appointmentAdminLink(): string {
  return absoluteUrl("/admin/diagnostic");
}

function channelLabel(appointment: DiagnosticAppointment): string {
  return appointment.channel === "online" ? "en visio" : "en présentiel";
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

/** Envoie l'invitation Google Agenda au client et à l'agenda fusionné. */
async function sendAgendaInvite(
  appointment: DiagnosticAppointment,
  method: "REQUEST" | "CANCEL",
): Promise<void> {
  try {
  const settings = await getDiagnosticSettings();
  const online = appointment.channel === "online";
  const videoUrl = online
    ? diagnosticVideoAbsoluteUrl(appointment.id, appointment.email)
    : "";
  const place = channelLabel(appointment);
  const date = formatDate(appointment.startsAt);
  const sync = calendarSyncEmail();
  const attendees = [
    { email: appointment.email, name: appointment.fullName, accepted: false },
    { email: sync, name: "Mariama", accepted: true },
  ];
  const seen = new Set<string>();
  const uniqueAttendees = attendees.filter((attendee) => {
    const key = attendee.email.trim().toLowerCase();
    if (!key.includes("@") || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const ics = buildAppointmentIcs({
    uid: `diagnostic-${appointment.id}@awurabeauty.com`,
    title: online
      ? "Diagnostic capillaire Awura Beauty (visio)"
      : "Diagnostic capillaire Awura Beauty",
    description: [
      `${appointment.fullName} — ${appointment.email}`,
      appointment.phone,
      `Rendez-vous ${place} le ${date}.`,
      online
        ? "Le lien de visio est dans le lieu de l'événement."
        : "Merci de ne pas te laver les cheveux dans les 48 heures précédant le rendez-vous.",
      appointment.notes,
    ]
      .filter(Boolean)
      .join("\n"),
    location: online ? videoUrl : settings.physicalLocationText || undefined,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    method,
    sequence: appointment.rescheduledCount ?? 0,
    status: method === "CANCEL" ? "CANCELLED" : "CONFIRMED",
    attendees: uniqueAttendees,
  });

  await sendEmail({
    to: uniqueAttendees.map((attendee) => attendee.email),
    replyTo: calendarOrganizerEmail(),
    subject:
      method === "CANCEL"
        ? "Diagnostic Awura Beauty annulé"
        : `Diagnostic Awura Beauty — ${date}`,
    html: `<p>Rendez-vous de diagnostic capillaire ${place}.</p>
      <p><strong>${escapeHtml(appointment.fullName || appointment.email)}</strong><br/>
      ${escapeHtml(date)}</p>
      <p>Organisé par ${escapeHtml(calendarOrganizerEmail())}.</p>`,
    icalEvent: { method, content: ics },
  });
  } catch (error) {
    console.error("[diagnostic] agenda invite failed", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Notifie le client et l'équipe qu'un RDV diagnostic vient d'être confirmé. N'interrompt pas la réservation si l'envoi échoue. */
export async function notifyAppointmentBooked(
  appointment: DiagnosticAppointment,
): Promise<void> {
  try {
    const date = formatDate(appointment.startsAt);
    const place = channelLabel(appointment);
    const videoUrl =
      appointment.channel === "online"
        ? diagnosticVideoAbsoluteUrl(appointment.id, appointment.email)
        : null;
    const washHint =
      appointment.channel === "physical"
        ? "<p>💡 Pense à ne pas te laver les cheveux dans les 48 heures précédant ton rendez-vous 😊</p>"
        : "";

    await notifyOrderUser({
      userId: appointment.userId,
      title: "Diagnostic réservé",
      body: `Ton rendez-vous ${place} est confirmé le ${date}.`,
      link: appointmentAccountLink(),
    });

    const name = escapeHtml(appointment.fullName || "");
    const email = escapeHtml(appointment.email);
    const phone = escapeHtml(appointment.phone || "—");

    await sendEmail({
      to: appointment.email,
      replyTo: CONTACT_EMAIL,
      subject: "Ton diagnostic capillaire Awura Beauty est confirmé",
      html: `<p>Bonjour ${name},</p>
        <p>Ton rendez-vous de diagnostic capillaire ${place} est confirmé.</p>
        <p><strong>Date :</strong> ${escapeHtml(date)}</p>
        ${videoUrl ? `<p>Le jour J, rejoins la visio depuis ce lien : ${escapeHtml(videoUrl)}</p>` : ""}
        ${washHint}
        <p>Tu peux consulter ton rendez-vous depuis ton compte : ${escapeHtml(appointmentAccountLink())}</p>
        <p>À bientôt,<br/>L'équipe Awura Beauty</p>`,
    });

    await notifyAdminUsers({
      title: "Nouveau RDV diagnostic",
      body: `${appointment.fullName || appointment.email} — ${place} le ${date}.`,
      link: appointmentAdminLink(),
    });

    await sendAgendaInvite(appointment, "REQUEST");

    for (const to of adminEmails()) {
      await sendEmail({
        to,
        subject: "Nouveau rendez-vous diagnostic",
        html: `<p>${name || email} a réservé un diagnostic ${place}.</p>
          <p><strong>Date :</strong> ${escapeHtml(date)}<br/>
          <strong>E-mail :</strong> ${email}<br/>
          <strong>Téléphone :</strong> ${phone}</p>
          <p>Voir dans l'admin : ${escapeHtml(appointmentAdminLink())}</p>`,
      });
    }
  } catch (error) {
    console.error("[diagnostic] booking notification failed", error);
  }
}

/** Notifie le client et l'admin qu'un RDV diagnostic a été replanifié. */
export async function notifyAppointmentRescheduled(input: {
  appointment: DiagnosticAppointment;
  previousStartsAt: string;
  changedBy: "client" | "admin";
}): Promise<void> {
  const { appointment, previousStartsAt, changedBy } = input;
  const newDate = formatDate(appointment.startsAt);
  const oldDate = formatDate(previousStartsAt);

  await notifyOrderUser({
    userId: appointment.userId,
    title: "Rendez-vous replanifié",
    body: `Ton diagnostic capillaire est maintenant prévu le ${newDate} (au lieu du ${oldDate}).`,
    link: appointmentAccountLink(),
  });

  await sendEmail({
    to: appointment.email,
    subject: "Ton rendez-vous Awura Beauty a été replanifié",
    html: `<p>Bonjour ${appointment.fullName || ""},</p>
      <p>Ton rendez-vous de diagnostic capillaire a été replanifié.</p>
      <p><strong>Nouvelle date :</strong> ${newDate}<br/>
      <strong>Ancienne date :</strong> ${oldDate}</p>
      <p>💡 Pense à ne pas te laver les cheveux dans les 48 heures précédant ton rendez-vous 😊</p>
      <p>Tu peux consulter et gérer ton rendez-vous depuis ton compte : ${appointmentAccountLink()}</p>
      <p>À bientôt,<br/>L'équipe Awura Beauty</p>`,
  });

  await sendAgendaInvite(appointment, "REQUEST");

  if (changedBy === "client") {
    await notifyAdminUsers({
      title: "RDV diagnostic replanifié par le client",
      body: `${appointment.fullName || appointment.email} a déplacé son RDV au ${newDate}.`,
      link: appointmentAdminLink(),
    });
  }
}

/** Rappel "la visio démarre bientôt" — envoyé une seule fois par RDV (idempotence gérée par l'appelant). */
export async function notifyAppointmentReminder(
  appointment: DiagnosticAppointment,
): Promise<void> {
  const date = formatDate(appointment.startsAt);

  await notifyOrderUser({
    userId: appointment.userId,
    title: "Ton diagnostic commence dans 5 minutes",
    body: `Rejoins la visio Awura Beauty (${date}).`,
    link: appointmentAccountLink(),
  });

  await sendEmail({
    to: appointment.email,
    subject: "Ton diagnostic Awura Beauty commence dans 5 minutes",
    html: `<p>Bonjour ${appointment.fullName || ""},</p>
      <p>Ton rendez-vous de diagnostic capillaire commence dans 5 minutes (${date}).</p>
      <p>Rejoins la visio depuis ton compte : ${appointmentAccountLink()}</p>
      <p>À tout de suite,<br/>L'équipe Awura Beauty</p>`,
  });

  await notifyAdminUsers({
    title: "RDV diagnostic dans 5 minutes",
    body: `${appointment.fullName || appointment.email} — ${date}.`,
    link: appointmentAdminLink(),
  });

  for (const to of adminEmails()) {
    await sendEmail({
      to,
      subject: "RDV diagnostic dans 5 minutes",
      html: `<p>Le RDV de ${appointment.fullName || appointment.email} commence dans 5 minutes (${date}).</p>
        <p>Rejoindre depuis l'admin : ${appointmentAdminLink()}</p>`,
    });
  }
}
