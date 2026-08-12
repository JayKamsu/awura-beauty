/**
 * Notifications RDV diagnostic (push + e-mail) : replanification et rappel J-5min.
 */
import { notifyAdminUsers, notifyOrderUser } from "@/lib/connectors/firebase";
import { sendEmail } from "@/lib/infrastructure/email/smtp";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import { absoluteUrl } from "@/lib/site";
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

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  for (const to of adminEmails) {
    await sendEmail({
      to,
      subject: "RDV diagnostic dans 5 minutes",
      html: `<p>Le RDV de ${appointment.fullName || appointment.email} commence dans 5 minutes (${date}).</p>
        <p>Rejoindre depuis l'admin : ${appointmentAdminLink()}</p>`,
    });
  }
}
