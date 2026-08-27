"use client";

import { useTranslation } from "react-i18next";
import { TestimonialCard } from "@/features/reviews/components/testimonial-card";
import type { PublicTestimonial } from "@/lib/domain/testimonial";

/** Grille publique des témoignages (site, diagnostic, produits). */
export function ReviewsList({ reviews }: { reviews: PublicTestimonial[] }) {
  const { t } = useTranslation();

  if (reviews.length === 0) {
    return <p className="py-16 text-center text-muted">{t("reviews.empty")}</p>;
  }

  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((item) => (
        <li key={item.id}>
          <TestimonialCard
            item={item}
            badge={
              item.kind === "diagnostic"
                ? t("reviews.diagnosticBadge")
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
