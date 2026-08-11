import { NextResponse } from "next/server";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { listFavoriteProductIds } from "@/lib/infrastructure/supabase/favorites";
import { getProductsByIds } from "@/lib/infrastructure/supabase/products";

/** Produits favoris du client connecté, hydratés depuis le catalogue. */
export async function GET(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productIds = await listFavoriteProductIds(userId);
  const products = await getProductsByIds(productIds);
  return NextResponse.json({ products });
}
