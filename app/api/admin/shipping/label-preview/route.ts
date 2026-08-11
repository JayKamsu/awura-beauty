import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { getOrderById } from "@/lib/infrastructure/supabase/orders";
import { getSignedLabelUrl } from "@/lib/infrastructure/supabase/storage";

/**
 * URL d'aperçu signée temporaire pour une étiquette déjà générée (admin).
 * Ne renvoie jamais l'URL Colissimo/Storage brute — toujours une URL signée
 * de courte durée, régénérée à chaque appel.
 */
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

  if (order.label_path) {
    const signed = await getSignedLabelUrl(order.label_path);
    if (!signed.url) {
      return NextResponse.json(
        { error: signed.error ?? "Unable to sign label URL" },
        { status: 500 },
      );
    }
    return NextResponse.json({ labelUrl: signed.url });
  }

  if (order.label_url) {
    return NextResponse.json({ labelUrl: order.label_url });
  }

  return NextResponse.json({ error: "No label available" }, { status: 404 });
}
