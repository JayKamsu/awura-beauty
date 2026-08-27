import { NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/application/catalog-revalidate";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  adminSetBundleComponents,
  getBundleComponents,
} from "@/lib/infrastructure/supabase/bundles";

/** Liste les composants d'un bundle (produit + quantité) — admin uniquement. */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const components = await getBundleComponents(productId);
  return NextResponse.json({ components });
}

/** Remplace les composants d'un bundle — admin uniquement. */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    productId?: string;
    components?: Array<{ productId: string; quantity: number }>;
  };

  if (!body.productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const result = await adminSetBundleComponents(
    body.productId,
    (body.components ?? []).filter((c) => c.productId),
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  revalidateCatalog();
  return NextResponse.json({ ok: true });
}
