import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  adminListSiteTestimonials,
  insertSiteTestimonial,
} from "@/lib/infrastructure/supabase/site-testimonials";

/** Liste les témoignages site — admin uniquement. */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const testimonials = await adminListSiteTestimonials();
  return NextResponse.json({ testimonials });
}

/** Crée un témoignage site saisi par l'admin. */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    authorName?: string;
    quote?: string;
    rating?: number;
    imageUrl?: string;
    published?: boolean;
  };
  const authorName = String(body.authorName ?? "").trim().slice(0, 80);
  const quote = String(body.quote ?? "").trim().slice(0, 2000);
  const rating = Math.round(Number(body.rating));
  if (authorName.length < 2 || quote.length < 8 || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const testimonial = await insertSiteTestimonial({
    authorName,
    quote,
    rating,
    imageUrl: String(body.imageUrl ?? ""),
    published: body.published !== false,
    source: "admin",
  });
  if (!testimonial) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
  return NextResponse.json({ testimonial });
}
