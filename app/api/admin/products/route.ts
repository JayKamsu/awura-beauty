import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  adminDeleteProduct,
  adminListProducts,
  adminUpsertProduct,
  type ProductInput,
} from "@/lib/infrastructure/supabase/admin-products";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const products = await adminListProducts();
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as ProductInput;
  const result = await adminUpsertProduct(body);
  if (!result.product) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ product: result.product });
}

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
  return NextResponse.json({ ok: true });
}
