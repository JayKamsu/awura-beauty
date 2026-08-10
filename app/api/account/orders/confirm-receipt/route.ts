import { NextResponse } from "next/server";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import {
  getOrderById,
  markOrderReceived,
} from "@/lib/infrastructure/supabase/orders";

/** Le client confirme avoir reçu sa commande. */
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

  const updated = await markOrderReceived(orderId, userId);
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order: updated });
}
