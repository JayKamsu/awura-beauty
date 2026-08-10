import { NextResponse } from "next/server";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { getOrderById } from "@/lib/infrastructure/supabase/orders";
import {
  listReviewsForOrder,
  upsertOrderReview,
} from "@/lib/infrastructure/supabase/order-reviews";

/** Liste les avis laissés pour une commande, réservé au client propriétaire. */
export async function GET(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = new URL(request.url).searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order || order.user_id !== userId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const reviews = await listReviewsForOrder(orderId);
  return NextResponse.json({ reviews });
}

/**
 * Crée ou met à jour l'avis du client sur un produit de la commande.
 * Nécessite que la commande soit confirmée reçue et que le produit en fasse partie.
 */
export async function POST(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    orderId?: string;
    productId?: string;
    rating?: number;
    comment?: string;
  };

  const orderId = String(body.orderId ?? "").trim();
  const productId = String(body.productId ?? "").trim();
  const rating = Math.round(Number(body.rating));
  const comment = String(body.comment ?? "").trim().slice(0, 2000);

  if (!orderId || !productId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order || order.user_id !== userId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.received_at) {
    return NextResponse.json(
      { error: "Order not confirmed as received yet" },
      { status: 409 },
    );
  }
  if (!order.items.some((item) => item.product_id === productId)) {
    return NextResponse.json(
      { error: "Product not part of this order" },
      { status: 400 },
    );
  }

  const review = await upsertOrderReview({
    orderId,
    productId,
    userId,
    rating,
    comment,
  });
  if (!review) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, review });
}
