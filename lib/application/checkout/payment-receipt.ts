import {
  SITE_NAME,
  CONTACT_EMAIL,
  COMPANY_LEGAL_NAME,
  COMPANY_ADDRESS,
  COMPANY_SIRET,
  COMPANY_VAT,
  absoluteUrl,
} from "@/lib/site";
import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const PAYMENT_LABEL: Record<string, string> = {
  stripe: "Carte (Stripe)",
  paypal: "PayPal",
  manual: "Commande manuelle / test",
};

const CARRIER_LABEL: Record<string, string> = {
  laposte: "Colissimo",
  mondial_relay: "Mondial Relay",
  pickup: "Retrait sur place",
};

function receiptNumber(order: OrderRow) {
  const d = new Date(order.created_at);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `REC-${y}${m}${day}-${order.id.slice(0, 8).toUpperCase()}`;
}

function receiptBodyHtml(order: OrderRow, includePrintButton: boolean): string {
  const address = order.shipping_address;
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.created_at));
  const number = receiptNumber(order);

  const lines = order.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.name)} × ${item.quantity}</td>
        <td style="text-align:right">${money(item.unit_price * item.quantity, order.currency)}</td>
      </tr>`,
    )
    .join("");

  const legalBits = [
    escapeHtml(COMPANY_LEGAL_NAME),
    COMPANY_ADDRESS ? escapeHtml(COMPANY_ADDRESS) : null,
    COMPANY_SIRET ? `SIRET ${escapeHtml(COMPANY_SIRET)}` : null,
    COMPANY_VAT ? `TVA ${escapeHtml(COMPANY_VAT)}` : null,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Reçu ${escapeHtml(number)} — ${SITE_NAME}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #1a2e24; margin: 0; padding: 32px; background: #f7f4ef; }
    .sheet { max-width: 720px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 16px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    .muted { color: #5c6b63; font-size: 14px; font-family: system-ui, sans-serif; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-family: system-ui, sans-serif; font-size: 14px; }
    th, td { padding: 10px 0; border-bottom: 1px solid #e6e1d8; vertical-align: top; }
    th { text-align: left; color: #5c6b63; font-weight: 500; }
    .totals td { border-bottom: none; }
    .total { font-size: 20px; font-family: Georgia, serif; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; font-family: system-ui, sans-serif; font-size: 14px; }
    .actions { margin-top: 28px; font-family: system-ui, sans-serif; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { border-radius: 0; box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <h1>${SITE_NAME}</h1>
    <p class="muted">Reçu de paiement · ${escapeHtml(number)}</p>
    <p class="muted">Commande #${escapeHtml(order.id.slice(0, 8))} · ${escapeHtml(date)}</p>

    <div class="grid">
      <div>
        <strong>Client</strong><br/>
        ${escapeHtml(address?.fullName || order.email)}<br/>
        ${escapeHtml(order.email)}
        ${address?.phone ? `<br/>${escapeHtml(address.phone)}` : ""}
      </div>
      <div>
        <strong>Paiement</strong><br/>
        ${escapeHtml(PAYMENT_LABEL[order.payment_method] ?? order.payment_method)}<br/>
        Statut : payé
        ${
          order.shipping_carrier
            ? `<br/>Livraison : ${escapeHtml(CARRIER_LABEL[order.shipping_carrier] ?? order.shipping_carrier)}`
            : ""
        }
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Article</th><th style="text-align:right">Montant TTC</th></tr>
      </thead>
      <tbody>
        ${lines}
        <tr class="totals"><td class="muted">Sous-total</td><td style="text-align:right">${money(subtotal, order.currency)}</td></tr>
        ${
          order.discount_amount > 0
            ? `<tr class="totals"><td class="muted">${
                order.referral_discount_applied
                  ? "Remises (parrainage / points)"
                  : "Remise points fidélité"
              }</td><td style="text-align:right">−${money(order.discount_amount, order.currency)}</td></tr>`
            : ""
        }
        ${
          order.points_redeemed > 0
            ? `<tr class="totals"><td class="muted">Points utilisés</td><td style="text-align:right">${order.points_redeemed} pts</td></tr>`
            : ""
        }
        <tr class="totals"><td class="muted">Livraison</td><td style="text-align:right">${money(order.shipping_fee || 0, order.currency)}</td></tr>
        <tr class="totals"><td class="total">Total TTC</td><td class="total" style="text-align:right">${money(order.total, order.currency)}</td></tr>
      </tbody>
    </table>

    ${
      address
        ? `<div style="margin-top:28px;font-family:system-ui,sans-serif;font-size:14px">
            <strong>Adresse</strong><br/>
            ${escapeHtml(address.line1)}<br/>
            ${escapeHtml(address.postalCode)} ${escapeHtml(address.city)}<br/>
            ${escapeHtml(address.country)}
          </div>`
        : ""
    }

    <p class="muted" style="margin-top:32px">
      Merci pour votre commande.<br/>
      Contact : ${escapeHtml(CONTACT_EMAIL)} · ${escapeHtml(absoluteUrl("/"))}<br/>
      ${legalBits.join(" · ")}
      ${
        !COMPANY_VAT
          ? "<br/>Montants exprimés en TTC."
          : ""
      }
    </p>
    ${
      includePrintButton
        ? `<div class="actions no-print">
      <button onclick="window.print()" style="padding:10px 16px;border-radius:10px;border:1px solid #1a2e24;background:#1a2e24;color:#fff;cursor:pointer">
        Imprimer / PDF
      </button>
    </div>`
        : ""
    }
  </div>
</body>
</html>`;
}

/** HTML imprimable — reçu de paiement Awura Beauty (page web, avec bouton Imprimer/PDF). */
export function buildPaymentReceiptHtml(order: OrderRow): string {
  return receiptBodyHtml(order, true);
}

/** HTML e-mail — même reçu, sans bouton Imprimer (inerte dans un client mail). */
export function buildPaymentReceiptEmailHtml(order: OrderRow): string {
  return receiptBodyHtml(order, false);
}

/** Sujet de l'e-mail de reçu de paiement. */
export function paymentReceiptEmailSubject(order: OrderRow): string {
  return `Ton reçu ${SITE_NAME} — commande #${order.id.slice(0, 8).toUpperCase()}`;
}
