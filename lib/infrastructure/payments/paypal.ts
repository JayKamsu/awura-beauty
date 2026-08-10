/** Montant formaté pour l'API PayPal (devise + valeur en chaîne décimale). */
export type PayPalAmount = {
  currencyCode: string;
  value: string;
};

/** Récupère un token OAuth PayPal (client credentials), null si non configuré ou échec. */
export async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) return null;

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const base =
    process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) return null;
  const json = (await response.json()) as { access_token?: string };
  return json.access_token ?? null;
}

/** Crée une commande PayPal (intent CAPTURE), liée à l'ID de commande Awura via reference_id/custom_id. */
export async function createPayPalOrder(input: {
  orderId: string;
  amount: PayPalAmount;
}): Promise<{ id: string | null; error: string | null }> {
  const token = await getPayPalAccessToken();
  if (!token) return { id: null, error: "PayPal is not configured" };

  const base =
    process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

  const response = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderId,
          custom_id: input.orderId,
          amount: {
            currency_code: input.amount.currencyCode,
            value: input.amount.value,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    return { id: null, error: "Unable to create PayPal order" };
  }

  const json = (await response.json()) as { id?: string };
  return { id: json.id ?? null, error: null };
}

/** Résultat de capture d'une commande PayPal (statut + montant + lien vers la commande Awura). */
export type PayPalCaptureResult = {
  ok: boolean;
  error: string | null;
  status?: string | null;
  awuraOrderId?: string | null;
  amountValue?: string | null;
  currencyCode?: string | null;
};

/** Capture les fonds d'une commande PayPal approuvée ; considère payé si statut COMPLETED/CAPTURED. */
export async function capturePayPalOrder(
  paypalOrderId: string,
): Promise<PayPalCaptureResult> {
  const token = await getPayPalAccessToken();
  if (!token) return { ok: false, error: "PayPal is not configured" };

  const base =
    process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

  const response = await fetch(
    `${base}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    return { ok: false, error: "Unable to capture PayPal order" };
  }

  const json = (await response.json()) as {
    status?: string;
    purchase_units?: Array<{
      custom_id?: string;
      reference_id?: string;
      payments?: {
        captures?: Array<{
          amount?: { value?: string; currency_code?: string };
          status?: string;
        }>;
      };
      amount?: { value?: string; currency_code?: string };
    }>;
  };

  const unit = json.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const status = capture?.status ?? json.status ?? null;
  const paid =
    status === "COMPLETED" ||
    status === "CAPTURED" ||
    json.status === "COMPLETED";

  if (!paid) {
    return { ok: false, error: "PayPal capture not completed", status };
  }

  return {
    ok: true,
    error: null,
    status,
    awuraOrderId: unit?.custom_id ?? unit?.reference_id ?? null,
    amountValue: capture?.amount?.value ?? unit?.amount?.value ?? null,
    currencyCode:
      capture?.amount?.currency_code ?? unit?.amount?.currency_code ?? null,
  };
}
