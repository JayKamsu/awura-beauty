import { NextResponse } from "next/server";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import {
  addFavorite,
  listFavoriteProductIds,
  mergeFavorites,
  removeFavorite,
} from "@/lib/infrastructure/supabase/favorites";

/** Favoris du client connecté (Bearer) : ids produit, hydratés depuis le catalogue. */
export async function GET(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productIds = await listFavoriteProductIds(userId);
  return NextResponse.json({ productIds });
}

/**
 * Ajoute un favori, ou fusionne une liste de favoris locaux (guest → compte) si
 * `productIds` est fourni au lieu de `productId`.
 */
export async function POST(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    productId?: string;
    productIds?: string[];
  };

  if (Array.isArray(body.productIds)) {
    const result = await mergeFavorites(userId, body.productIds);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const productIds = await listFavoriteProductIds(userId);
    return NextResponse.json({ productIds });
  }

  if (!body.productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const result = await addFavorite(userId, body.productId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

/** Retire un produit des favoris (?productId=). */
export async function DELETE(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const result = await removeFavorite(userId, productId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
