import { NextResponse } from "next/server";
import { buildPaymentReceiptHtml } from "@/lib/application/checkout/payment-receipt";
import { isOrderPaid } from "@/lib/application/checkout/payment-status";
import { getUserFromAccessToken } from "@/lib/infrastructure/supabase/admin-auth";
import { getOrderById } from "@/lib/infrastructure/supabase/orders";

/** Reçu de paiement pour le client propriétaire de la commande. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const user = await getUserFromAccessToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = new URL(request.url).searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const owns =
    (order.user_id && order.user_id === user.id) ||
    (user.email &&
      order.email.toLowerCase() === user.email.toLowerCase());
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Aligné sur l’UI : payée OU processing (après expédition).
  if (!isOrderPaid(order)) {
    return NextResponse.json(
      { error: "Receipt available after payment" },
      { status: 400 },
    );
  }

  return new NextResponse(buildPaymentReceiptHtml(order), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
