import type { PublicTestimonial } from "@/lib/domain/testimonial";
import {
  listPublicDiagnosticTestimonials,
  listPublicReviews,
} from "@/lib/infrastructure/supabase/order-reviews";
import { listPublishedSiteTestimonials } from "@/lib/infrastructure/supabase/site-testimonials";

/** Fusionne témoignages site, diagnostic et avis produits, du plus récent au plus ancien. */
export async function listPublicTestimonialFeed(
  limit = 100,
): Promise<PublicTestimonial[]> {
  const [site, diagnostic, products] = await Promise.all([
    listPublishedSiteTestimonials(limit),
    listPublicDiagnosticTestimonials(limit),
    listPublicReviews(limit),
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
