import { NextResponse } from "next/server";
import { container } from "@/lib/application/container";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import type { PageSectionConfig } from "@/lib/domain";

/** Liste les mises en page de toutes les pages du site (admin). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const layouts = await container.pages.listPageLayouts();
  return NextResponse.json({ layouts });
}

/** Enregistre la mise en page (sections) d'une page donnée (admin). */
export async function PUT(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    pageKey?: string;
    sections?: PageSectionConfig[];
  };

  if (!body.pageKey || !Array.isArray(body.sections)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await container.pages.savePageLayout(
    body.pageKey,
    body.sections,
  );

  if (!result.layout) {
    return NextResponse.json(
      { error: result.error ?? "Save failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ layout: result.layout });
}
