import { NextResponse } from "next/server";
import { listPublicTestimonialFeed } from "@/lib/application/testimonials/list-public-testimonials";

/** Liste publique des témoignages (diagnostic / site par défaut). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 24));
  const kindsRaw = url.searchParams.get("kinds");
  const allowed = new Set(["site", "diagnostic", "product"]);
  const kinds = kindsRaw
    ? kindsRaw
        .split(",")
        .map((item) => item.trim())
        .filter((item): item is "site" | "diagnostic" | "product" =>
          allowed.has(item),
        )
    : (["site", "diagnostic"] as const);
  const testimonials = await listPublicTestimonialFeed(
    limit,
    kinds.length ? [...kinds] : ["site", "diagnostic"],
  );
  return NextResponse.json({ testimonials });
}
