import type { WithdrawalDeclaration } from "@/lib/domain/withdrawal";
import { SITE_NAME, CONTACT_EMAIL, getSiteUrl } from "@/lib/site";
import { WITHDRAWAL_PATH } from "@/lib/legal/pages";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatSubmittedAt(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

/** Sujet de l'accusé de réception envoyé au consommateur. */
export function withdrawalAckSubject(): string {
  return `Accusé de réception de ta rétractation — ${SITE_NAME}`;
}

/** Sujet de l'alerte interne (service client). */
export function withdrawalInternalSubject(orderRef: string): string {
  return `[Rétractation] Commande ${orderRef} — ${SITE_NAME}`;
}

/**
 * Accusé de réception sur support durable (e-mail) : contenu de la déclaration,
 * date et heure d'envoi (art. D221-5).
 */
export function buildWithdrawalAckHtml(
  declaration: WithdrawalDeclaration,
  submittedAt: Date,
): string {
  const when = formatSubmittedAt(submittedAt);
  const iso = submittedAt.toISOString();
  const site = getSiteUrl();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(withdrawalAckSubject())}</title>
</head>
<body style="margin:0;padding:32px;background:#f7f4ef;color:#1a2e24;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:40px;border-radius:16px;">
    <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#b08d57;margin:0 0 12px;">${escapeHtml(SITE_NAME)}</p>
    <h1 style="font-size:26px;margin:0 0 16px;">Accusé de réception de rétractation</h1>
    <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#5c6b63;">
      Nous confirmons avoir reçu ta déclaration de rétractation le <strong>${escapeHtml(when)}</strong>
      (${escapeHtml(iso)}).
    </p>
    <table style="width:100%;border-collapse:collapse;margin-top:24px;font-family:system-ui,sans-serif;font-size:14px;">
      <tr><td style="padding:8px 0;color:#5c6b63;">Prénom</td><td style="padding:8px 0;">${escapeHtml(declaration.firstName)}</td></tr>
      <tr><td style="padding:8px 0;color:#5c6b63;">Nom</td><td style="padding:8px 0;">${escapeHtml(declaration.lastName)}</td></tr>
      <tr><td style="padding:8px 0;color:#5c6b63;">Contrat / commande</td><td style="padding:8px 0;">${escapeHtml(declaration.orderRef)}</td></tr>
      <tr><td style="padding:8px 0;color:#5c6b63;">Date indiquée</td><td style="padding:8px 0;">${escapeHtml(declaration.orderDate || "—")}</td></tr>
      <tr><td style="padding:8px 0;color:#5c6b63;vertical-align:top;">Détail</td><td style="padding:8px 0;white-space:pre-wrap;">${escapeHtml(declaration.contractDetails)}</td></tr>
      <tr><td style="padding:8px 0;color:#5c6b63;">Accusé à</td><td style="padding:8px 0;">${escapeHtml(declaration.ackEmail)}</td></tr>
    </table>
    <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#5c6b63;margin-top:24px;">
      Conserve cet e-mail : il constitue l’accusé de réception de ta rétractation.
      Les modalités de retour (produits non descellés, délai d’expédition) sont décrites sur
      <a href="${site}/politique-de-retour">la politique de retour</a>.
    </p>
    <p style="font-family:system-ui,sans-serif;font-size:13px;color:#5c6b63;">
      ${escapeHtml(SITE_NAME)} — ${escapeHtml(CONTACT_EMAIL)}
    </p>
  </div>
</body>
</html>`;
}

/** Copie interne pour le service client. */
export function buildWithdrawalInternalHtml(
  declaration: WithdrawalDeclaration,
  submittedAt: Date,
): string {
  const ack = buildWithdrawalAckHtml(declaration, submittedAt);
  const site = getSiteUrl();
  return ack.replace(
    "</div>\n</body>",
    `<p style="font-family:system-ui,sans-serif;font-size:13px;color:#5c6b63;margin-top:16px;">
      Formulaire : ${site}${WITHDRAWAL_PATH}
    </p></div>\n</body>`,
  );
}
