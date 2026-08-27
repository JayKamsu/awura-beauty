import { NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/application/catalog-revalidate";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  adminDeleteProduct,
  adminListProducts,
  adminUpsertProduct,
  type ProductInput,
} from "@/lib/infrastructure/supabase/admin-products";

/** Liste tous les produits — admin uniquement. */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const products = await adminListProducts();
  return NextResponse.json({ products });
}

/** Crée ou met à jour un produit — admin uniquement. */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as ProductInput;
  const result = await adminUpsertProduct(body);
  if (!result.product) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  revalidateCatalog(result.product.slug);
  return NextResponse.json({ product: result.product });
}

/** Supprime un produit par id — admin uniquement. */
export async function DELETE(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const result = await adminDeleteProduct(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  revalidateCatalog();
  return NextResponse.json({ ok: true });
}
