import nodemailer from "nodemailer";

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

/**
 * Transport SMTP (Hostinger `Care@awurabeauty.com`, ou tout autre compte SMTP
 * standard) — même boîte que celle configurée côté Supabase Auth. Absent en
 * dev tant que les variables SMTP_* ne sont pas renseignées.
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

/** true si les variables SMTP_* sont configurées (l'envoi est possible). */
export function isSmtpConfigured(): boolean {
  return Boolean(getTransporter());
}

/** Envoie un e-mail via le SMTP configuré ; no-op silencieux si SMTP absent (dev/démo). */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, error: "SMTP not configured" };
  }

  const fromEmail = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? "";
  const fromName = process.env.SMTP_FROM_NAME ?? "Awura Beauty";

  try {
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown SMTP error",
    };
  }
}
