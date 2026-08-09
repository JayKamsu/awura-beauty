import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/application/checkout/mark-order-paid";
import { capturePayPalOrder } from "@/lib/infrastructure/payments/paypal";
import { getOrderById } from "@/lib/infrastructure/supabase/orders";

type CaptureBody = {
  paypalOrderId: string;
  orderId: string;
};

function amountsMatch(expected: number, actual: string | null | undefined) {
  if (!actual) return false;
  const a = Number(actual);
  if (!Number.isFinite(a)) return false;
  return Math.abs(a - expected) < 0.01;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CaptureBody;

  if (!body.paypalOrderId || !body.orderId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (body.orderId.startsWith("demo-")) {
    return NextResponse.json({ ok: true, orderId: body.orderId });
  }

  const order = await getOrderById(body.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Déjà payée (retry navigateur / double clic) — ne pas re-capturer
  if (order.payment_status === "paid" || order.status === "paid") {
    return NextResponse.json({ ok: true, orderId: body.orderId, alreadyPaid: true });
  }

  if (order.payment_method !== "paypal") {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  const capture = await capturePayPalOrder(body.paypalOrderId);
  if (!capture.ok) {
    // Capture déjà faite côté PayPal → tenter de marquer payé si montant cohérent
    const refreshed = await getOrderById(body.orderId);
    if (
      refreshed &&
      (refreshed.payment_status === "paid" || refreshed.status === "paid")
    ) {
      return NextResponse.json({ ok: true, orderId: body.orderId, alreadyPaid: true });
    }
    return NextResponse.json(
      { error: capture.error ?? "Capture failed" },
      { status: 500 },
    );
  }

  if (
    capture.awuraOrderId &&
    capture.awuraOrderId !== body.orderId
  ) {
    return NextResponse.json(
      { error: "PayPal order mismatch" },
      { status: 400 },
    );
  }

  if (!amountsMatch(order.total, capture.amountValue)) {
    return NextResponse.json(
      { error: "PayPal amount mismatch" },
      { status: 400 },
    );
  }

  if (
    capture.currencyCode &&
    capture.currencyCode.toUpperCase() !== order.currency.toUpperCase()
  ) {
    return NextResponse.json(
      { error: "PayPal currency mismatch" },
      { status: 400 },
    );
  }

  const ok = await markOrderPaid(body.orderId);
  if (!ok) {
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orderId: body.orderId });
}
