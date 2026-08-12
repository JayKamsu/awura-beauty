import {
  buildPaymentReceiptEmailHtml,
  paymentReceiptEmailSubject,
} from "@/lib/application/checkout/payment-receipt";
import { sendEmail } from "@/lib/infrastructure/email/smtp";
import { CONTACT_EMAIL } from "@/lib/site";
import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";

/**
 * Envoie le reçu de paiement par e-mail au client. No-op silencieux si SMTP
 * n'est pas configuré (dev/démo) — ne doit jamais faire échouer le paiement.
 */
export async function sendPaymentReceiptEmail(order: OrderRow): Promise<void> {
  if (!order.email) return;

  await sendEmail({
    to: order.email,
    subject: paymentReceiptEmailSubject(order),
    html: buildPaymentReceiptEmailHtml(order),
    replyTo: CONTACT_EMAIL,
  });
}
