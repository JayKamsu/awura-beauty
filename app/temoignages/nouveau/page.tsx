import type { Metadata } from "next";
import { Suspense } from "react";
import { TestimonialInviteForm } from "@/features/reviews/components/testimonial-invite-form";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Laisser un témoignage",
  description: "Partage ton avis sur Awura Beauty.",
  path: "/temoignages/nouveau",
  noIndex: true,
});

/** Page d'invitation : le client laisse un témoignage via le lien envoyé par Awura. */
export default function NouveauTemoignagePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-14 md:px-6">
      <Suspense fallback={<p className="text-muted">…</p>}>
        <TestimonialInviteForm />
      </Suspense>
    </main>
  );
}
