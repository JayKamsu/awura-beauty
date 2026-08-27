import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  deleteSiteTestimonial,
  updateSiteTestimonial,
} from "@/lib/infrastructure/supabase/site-testimonials";

type RouteContext = { params: Promise<{ id: string }> };

/** Met à jour un témoignage site (texte, image, publication). */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  const body = (await request.json()) as {
    authorName?: string;
    quote?: string;
    rating?: number;
    imageUrl?: string;
    published?: boolean;
  };
  const testimonial = await updateSiteTestimonial(id, {
    authorName: body.authorName?.trim().slice(0, 80),
    quote: body.quote?.trim().slice(0, 2000),
    rating:
      body.rating !== undefined && Number.isFinite(Number(body.rating))
        ? Math.round(Number(body.rating))
        : undefined,
    imageUrl: body.imageUrl,
    published: body.published,
  });
  if (!testimonial) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
  return NextResponse.json({ testimonial });
}

/** Supprime un témoignage site. */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  const ok = await deleteSiteTestimonial(id);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
