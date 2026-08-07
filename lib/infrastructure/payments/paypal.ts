export type PayPalAmount = {
  currencyCode: string;
  value: string;
};

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

export async function capturePayPalOrder(
  paypalOrderId: string,
): Promise<{ ok: boolean; error: string | null }> {
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

  return { ok: true, error: null };
}
