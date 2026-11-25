import { NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/application/catalog-revalidate";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  createAdminProductReview,
  deleteOrderReview,
  listAllReviews,
} from "@/lib/infrastructure/supabase/order-reviews";
import { getProductsByIds } from "@/lib/infrastructure/supabase/products";

/** Liste tous les avis clients, tous produits confondus — admin uniquement. */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const reviews = await listAllReviews();
  return NextResponse.json({ reviews });
}

/** Publie un avis sur la fiche d'un produit — admin uniquement. */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    productId?: string;
    authorName?: string;
    rating?: number;
    comment?: string;
  };
  const productId = String(body.productId ?? "").trim();
  const authorName = String(body.authorName ?? "").trim().slice(0, 80);
  const comment = String(body.comment ?? "").trim().slice(0, 2000);
  const rating = Math.round(Number(body.rating));
  if (
    !/^[0-9a-f-]{36}$/i.test(productId) ||
    authorName.length < 2 ||
    comment.length < 2 ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const review = await createAdminProductReview({
    productId,
    authorName,
    rating,
    comment,
  });
  if (!review) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  const [product] = await getProductsByIds([productId]);
  revalidateCatalog(product?.slug);
  return NextResponse.json({ review });
}

/** Supprime un avis produit ou un témoignage diagnostic — admin uniquement. */
export async function DELETE(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const result = await deleteOrderReview(id);
  if (!result.ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  if (result.productId) {
    const [product] = await getProductsByIds([result.productId]);
    revalidateCatalog(product?.slug);
  }
  return NextResponse.json({ ok: true });
}
