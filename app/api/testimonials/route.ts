import { NextResponse } from "next/server";
import { listPublicTestimonialFeed } from "@/lib/application/testimonials/list-public-testimonials";

/** Liste publique des témoignages (site, diagnostic, produits). */
export async function GET(request: Request) {
  const limitRaw = new URL(request.url).searchParams.get("limit");
  const limit = Math.min(100, Math.max(1, Number(limitRaw) || 24));
  const testimonials = await listPublicTestimonialFeed(limit);
  return NextResponse.json({ testimonials });
}
