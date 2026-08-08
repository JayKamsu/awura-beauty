import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/application/checkout/mark-order-paid";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  getOrderById,
  updateOrderPayment,
} from "@/lib/infrastructure/supabase/orders";
import type { OrderStatus } from "@/lib/infrastructure/supabase/order-types";

type Action = "mark_paid" | "mark_refunded" | "mark_cancelled";

/**
 * Actions admin sur le statut de paiement d’une commande.
 * Les remboursements Stripe/PayPal se font dans leur dashboard ;
 * ici on aligne le statut Awura.
 */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    orderId?: string;
    action?: Action;
  };
  const orderId = String(body.orderId ?? "").trim();
  const action = body.action;
  if (!orderId || !action) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (action === "mark_paid") {
    const ok = await markOrderPaid(orderId);
    if (!ok) {
      return NextResponse.json({ error: "Unable to mark paid" }, { status: 500 });
    }
    const updated = await getOrderById(orderId);
    return NextResponse.json({ ok: true, order: updated });
  }

  const map: Record<
    Exclude<Action, "mark_paid">,
    { paymentStatus: string; status: OrderStatus }
  > = {
    mark_refunded: { paymentStatus: "refunded", status: "refunded" },
    mark_cancelled: { paymentStatus: "cancelled", status: "cancelled" },
  };

  const patch = map[action];
  if (!patch) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const ok = await updateOrderPayment(orderId, patch);
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const updated = await getOrderById(orderId);
  return NextResponse.json({ ok: true, order: updated });
}
