"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { RatingInput } from "@/components/ui/rating-input";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { PublicReview } from "@/lib/infrastructure/supabase/order-reviews";

export function ReviewsList({ reviews }: { reviews: PublicReview[] }) {
  const { t, i18n } = useTranslation();

  if (reviews.length === 0) {
    return <p className="py-16 text-center text-muted">{t("reviews.empty")}</p>;
  }

  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-5"
        >
          <div className="flex items-center gap-3">
            {review.productImageUrl ? (
              <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-background-alt">
                <Image
                  src={review.productImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <Link
                href={`/boutique/${review.productSlug}`}
                className="block truncate font-medium text-primary hover:text-accent"
              >
                {review.productName}
              </Link>
              <p className="text-xs text-muted">
                {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                  dateStyle: "medium",
                }).format(new Date(review.createdAt))}
              </p>
            </div>
          </div>
          <RatingInput value={review.rating} onChange={() => {}} disabled />
          {review.comment ? (
            <p className="text-sm leading-relaxed text-foreground/90">
              “{review.comment}”
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
