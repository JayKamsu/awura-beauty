"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  cmsOr,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";
import { TestimonialCard } from "@/features/reviews/components/testimonial-card";
import type { PublicTestimonial } from "@/lib/domain/testimonial";

/** Section témoignages de l'accueil : avis réels, masquée s'il n'y en a aucun. */
export function TestimonialsSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("testimonials");
  const [items, setItems] = useState<PublicTestimonial[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/testimonials?limit=8")
      .then((res) => res.json())
      .then((json: { testimonials?: PublicTestimonial[] }) => {
        if (cancelled) return;
        setItems((json.testimonials ?? []).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="bg-background-alt">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-16 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-3xl text-primary sm:text-4xl">
            {cmsOr(cms, "title", t("home.testimonials.title"))}
          </h2>
          <Button
            href="/temoignages"
            variant="ghost"
            className="self-start uppercase tracking-wide text-accent sm:self-auto"
          >
            {t("home.testimonials.seeAll")}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <TestimonialCard
              key={item.id}
              item={item}
              compact
              badge={
                item.kind === "diagnostic"
                  ? t("reviews.diagnosticBadge")
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
