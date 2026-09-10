import {
  buildWithdrawalAckHtml,
  buildWithdrawalInternalHtml,
  withdrawalAckSubject,
  withdrawalInternalSubject,
} from "@/lib/application/withdrawal/ack-email";
import { sendEmail, isSmtpConfigured } from "@/lib/infrastructure/email/smtp";
import { insertWithdrawalRequest } from "@/lib/infrastructure/supabase/withdrawals";
import { CONTACT_EMAIL } from "@/lib/site";
import type { WithdrawalDeclaration } from "@/lib/domain/withdrawal";

/** Enregistre la déclaration, envoie l'accusé au consommateur et prévient le service client. */
export async function submitWithdrawal(
  declaration: WithdrawalDeclaration,
): Promise<{ ok: true; submittedAt: string } | { ok: false; error: string }> {
  if (!isSmtpConfigured()) {
    return { ok: false, error: "ack_failed" };
  }

  const submittedAt = new Date();

  await insertWithdrawalRequest(declaration, submittedAt);

  const ack = await sendEmail({
    to: declaration.ackEmail,
    subject: withdrawalAckSubject(),
    html: buildWithdrawalAckHtml(declaration, submittedAt),
    replyTo: CONTACT_EMAIL,
  });

  if (!ack.ok) {
    console.error("[withdrawal] ack email", ack.error);
    return { ok: false, error: "ack_failed" };
  }

  await sendEmail({
    to: CONTACT_EMAIL,
    subject: withdrawalInternalSubject(declaration.orderRef),
    html: buildWithdrawalInternalHtml(declaration, submittedAt),
    replyTo: declaration.ackEmail,
  });

  return { ok: true, submittedAt: submittedAt.toISOString() };
}
