import { NextResponse } from "next/server";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { findProductReviewEligibility } from "@/lib/infrastructure/supabase/orders";
import { listReviewsForOrder } from "@/lib/infrastructure/supabase/order-reviews";

/**
 * Indique si le client connecté peut commenter ce produit, et renvoie son avis existant.
 */
export async function GET(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = new URL(request.url).searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const eligibility = await findProductReviewEligibility(userId, productId);
  if (eligibility.state !== "eligible") {
    return NextResponse.json({
      state: eligibility.state,
      orderId: eligibility.state === "awaiting_receipt" ? eligibility.orderId : null,
      review: null,
    });
  }

  const reviews = await listReviewsForOrder(eligibility.orderId);
  const review =
    reviews.find((item) => item.productId === productId) ?? null;

  return NextResponse.json({
    state: "eligible",
    orderId: eligibility.orderId,
    review,
  });
}
