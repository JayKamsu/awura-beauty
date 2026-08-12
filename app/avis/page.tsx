import { ReviewsHeader } from "@/features/reviews/components/reviews-header";
import { ReviewsList } from "@/features/reviews/components/reviews-list";
import {
  listPublicDiagnosticTestimonials,
  listPublicReviews,
} from "@/lib/infrastructure/supabase/order-reviews";

/** Page "Avis clients" : récupère les avis produits et témoignages diagnostic, les affiche sous l'en-tête de la section. */
export default async function AvisPage() {
  const [reviews, testimonials] = await Promise.all([
    listPublicReviews(),
    listPublicDiagnosticTestimonials(),
  ]);

  const combined = [...reviews, ...testimonials].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <ReviewsHeader />
      <ReviewsList reviews={combined} />
    </main>
  );
}
