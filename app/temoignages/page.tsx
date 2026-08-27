import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { ReviewsHeader } from "@/features/reviews/components/reviews-header";
import { ReviewsList } from "@/features/reviews/components/reviews-list";
import { listPublicTestimonialFeed } from "@/lib/application/testimonials/list-public-testimonials";
import { breadcrumbJsonLd, testimonialsJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Témoignages",
  description:
    "Témoignages de clientes Awura Beauty : soins, diagnostic capillaire et routines pour cheveux texturés.",
  path: "/temoignages",
});

/** Page publique des témoignages clients (site, diagnostic, produits). */
export default async function TemoignagesPage() {
  const reviews = await listPublicTestimonialFeed();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <JsonLd data={testimonialsJsonLd(reviews)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Témoignages", path: "/temoignages" },
        ])}
      />
      <ReviewsHeader />
      <ReviewsList reviews={reviews} />
    </main>
  );
}
