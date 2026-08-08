import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  adminCreateCategory,
  adminDeleteCategory,
  listProductCategories,
} from "@/lib/infrastructure/supabase/product-categories";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const categories = await listProductCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    label?: string;
    slug?: string;
    label_en?: string;
    label_es?: string;
  };
  const result = await adminCreateCategory({
    label: body.label ?? "",
    slug: body.slug,
    label_en: body.label_en,
    label_es: body.label_es,
  });
  if (!result.category) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ category: result.category });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const result = await adminDeleteCategory(slug);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
