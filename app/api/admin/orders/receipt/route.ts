import { NextResponse } from "next/server";
import { buildPaymentReceiptHtml } from "@/lib/application/checkout/payment-receipt";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { getOrderById } from "@/lib/infrastructure/supabase/orders";

/** Aperçu / impression du reçu de paiement (admin). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const orderId = new URL(request.url).searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_status !== "paid" && order.status !== "paid") {
    return NextResponse.json(
      { error: "Receipt available after payment" },
      { status: 400 },
    );
  }

  const html = buildPaymentReceiptHtml(order);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
