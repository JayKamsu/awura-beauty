import type { PublicTestimonial } from "@/lib/domain/testimonial";
import {
  listPublicDiagnosticTestimonials,
  listPublicReviews,
} from "@/lib/infrastructure/supabase/order-reviews";
import { listPublishedSiteTestimonials } from "@/lib/infrastructure/supabase/site-testimonials";

const ALL_KINDS: PublicTestimonial["kind"][] = ["site", "diagnostic", "product"];

/** Fusionne témoignages (site, diagnostic, produits) du plus récent au plus ancien. */
export async function listPublicTestimonialFeed(
  limit = 100,
  kinds: PublicTestimonial["kind"][] = ALL_KINDS,
): Promise<PublicTestimonial[]> {
  const includeSite = kinds.includes("site");
  const includeDiagnostic = kinds.includes("diagnostic");
  const includeProduct = kinds.includes("product");

  const [site, diagnostic, products] = await Promise.all([
    includeSite ? listPublishedSiteTestimonials(limit) : Promise.resolve([]),
    includeDiagnostic
      ? listPublicDiagnosticTestimonials(limit)
      : Promise.resolve([]),
    includeProduct ? listPublicReviews(limit) : Promise.resolve([]),
  ]);

  const feed: PublicTestimonial[] = [
    ...site.map((item) => ({
      id: `site-${item.id}`,
      kind: "site" as const,
      authorName: item.authorName,
      quote: item.quote,
      rating: item.rating,
      imageUrl: item.imageUrl || null,
      createdAt: item.createdAt,
    })),
    ...diagnostic
      .filter((item) => item.comment.trim())
      .map((item) => ({
        id: `diagnostic-${item.id}`,
        kind: "diagnostic" as const,
        authorName: item.diagnosticTitle || "",
        quote: item.comment,
        rating: item.rating,
        imageUrl: null,
        createdAt: item.createdAt,
      })),
    ...products
      .filter((item) => item.comment.trim())
      .map((item) => ({
        id: `product-${item.id}`,
        kind: "product" as const,
        authorName: item.productName,
        quote: item.comment,
        rating: item.rating,
        imageUrl: item.productImageUrl || null,
        href: item.productSlug ? `/boutique/${item.productSlug}` : undefined,
        createdAt: item.createdAt,
      })),
  ];

  feed.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return feed.slice(0, limit);
}
