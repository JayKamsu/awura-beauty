"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Stars } from "@/components/ui/stars";
import type { ProductReviewSummary } from "@/lib/infrastructure/supabase/order-reviews";

/** Lien note + volume d'avis, ancré vers la liste en bas de fiche. */
export function ProductRatingSummary({
  summary,
}: {
  summary: ProductReviewSummary;
}) {
  const { t, i18n } = useTranslation();
  if (summary.count === 0) return null;

  const ratingLabel = summary.average.toLocaleString(i18n.language, {
    minimumFractionDigits: summary.average % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });

  return (
    <a
      href="#avis-produit"
      className="inline-flex flex-wrap items-center gap-2 text-sm text-muted transition hover:text-accent"
    >
      <Stars value={summary.average} />
      <span className="font-medium text-primary">{ratingLabel}</span>
      <span>
        {t("shop.reviewsCount", { count: summary.count })}
      </span>
    </a>
  );
}

/** Carrousel d'avis qui défile sous le bouton d'ajout au panier. */
export function ProductReviewsCarousel({
  summary,
}: {
  summary: ProductReviewSummary;
}) {
  const { t } = useTranslation();
  const quotes = summary.reviews.filter((item) => item.comment);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (quotes.length < 2) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % quotes.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [quotes.length]);

  if (quotes.length === 0) return null;

  return (
    <div
      className="space-y-3"
      aria-roledescription="carousel"
      aria-label={t("shop.reviewsCarouselLabel")}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
        {t("shop.reviewsCarouselLabel")}
      </p>
      <div className="relative overflow-hidden rounded-2xl bg-background-alt">
        <div
          className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {quotes.map((item) => (
            <div key={item.id} className="min-w-full shrink-0 space-y-3 px-5 py-4">
              <Stars value={item.rating} />
              <blockquote className="text-sm italic leading-relaxed text-foreground/90">
                “{item.comment}”
              </blockquote>
              <p className="text-xs font-medium text-muted">
                {t("shop.reviewAuthor")}
                <span className="mx-1.5 text-border" aria-hidden>
                  ·
                </span>
                {t("shop.verifiedPurchase")}
              </p>
            </div>
          ))}
        </div>
      </div>
      {quotes.length > 1 ? (
        <div className="flex items-center justify-center gap-1.5">
          {quotes.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={t("shop.reviewSlide", { current: i + 1, total: quotes.length })}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`size-1.5 rounded-full transition ${
                i === index ? "bg-accent" : "bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Liste complète des avis en bas de la fiche produit. */
export function ProductReviewsSection({
  summary,
}: {
  summary: ProductReviewSummary;
}) {
  const { t, i18n } = useTranslation();
  const quotes = summary.reviews.filter((item) => item.comment);
  if (summary.count === 0) return null;

  const ratingLabel = summary.average.toLocaleString(i18n.language, {
    minimumFractionDigits: summary.average % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });

  return (
    <section id="avis-produit" className="scroll-mt-28 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-primary sm:text-3xl">
            {t("shop.reviewsTitle")}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Stars value={summary.average} />
            <span className="font-medium text-primary">{ratingLabel}</span>
            <span>{t("shop.reviewsCount", { count: summary.count })}</span>
          </div>
        </div>
      </div>

      {quotes.length === 0 ? (
        <p className="text-sm text-muted">{t("shop.reviewsEmpty")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {quotes.map((item) => (
            <li key={item.id}>
              <article className="h-full space-y-3 rounded-2xl bg-background-alt px-5 py-4">
                <Stars value={item.rating} />
                <p className="text-sm italic leading-relaxed text-foreground/90">
                  “{item.comment}”
                </p>
                <p className="text-xs font-medium text-muted">
                  {t("shop.reviewAuthor")}
                  <span className="mx-1.5 text-border" aria-hidden>
                    ·
                  </span>
                  {t("shop.verifiedPurchase")}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
