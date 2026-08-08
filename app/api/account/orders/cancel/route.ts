import { NextResponse } from "next/server";
import { resolvePaymentStatus } from "@/lib/application/checkout/payment-status";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import {
  getOrderById,
  updateOrderPayment,
} from "@/lib/infrastructure/supabase/orders";

/**
 * Annule une commande encore en attente de paiement (ex. abandon Stripe).
 */
export async function POST(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { orderId?: string };
  const orderId = String(body.orderId ?? "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order || order.user_id !== userId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (resolvePaymentStatus(order) !== "pending") {
    return NextResponse.json(
      { error: "Order is not pending payment" },
      { status: 409 },
    );
  }

  const ok = await updateOrderPayment(orderId, {
    paymentStatus: "cancelled",
    status: "cancelled",
  });
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const updated = await getOrderById(orderId);
  return NextResponse.json({ ok: true, order: updated });
}
