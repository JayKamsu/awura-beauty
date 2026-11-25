"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RatingInput } from "@/components/ui/rating-input";
import { Stars } from "@/components/ui/stars";
import { useAuth } from "@/features/auth/context/auth-provider";
import type {
  OrderReviewRow,
  ProductReviewSummary,
} from "@/lib/infrastructure/supabase/order-reviews";

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
              <ReviewByline item={item} />
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

/** Signature d'un avis : prénom, et mention d'achat seulement si la commande existe. */
function ReviewByline({
  item,
}: {
  item: ProductReviewSummary["reviews"][number];
}) {
  const { t } = useTranslation();
  const name = item.authorName.trim() || t("shop.reviewAuthor");
  return (
    <p className="text-xs font-medium text-muted">
      {name}
      {item.verified ? (
        <>
          <span className="mx-1.5 text-border" aria-hidden>
            ·
          </span>
          {t("shop.verifiedPurchase")}
        </>
      ) : null}
    </p>
  );
}

type ReviewEligibility = {
  state: "eligible" | "awaiting_receipt" | "not_purchased";
  orderId: string | null;
  review: OrderReviewRow | null;
};

/** Formulaire d'avis sur la fiche : achat vérifié et réception confirmée. */
function ProductReviewComposer({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [editing, setEditing] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = session?.access_token;
    if (!user || !token) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/account/products/review?productId=${encodeURIComponent(productId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok || cancelled) return;
      const json = (await res.json()) as ReviewEligibility;
      if (cancelled) return;
      setEligibility(json);
      if (json.review) {
        setRating(json.review.rating);
        setComment(json.review.comment);
        setEditing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, session?.access_token, user]);

  if (loading) return null;

  if (!user) {
    const redirect = `${pathname}#avis-produit`;
    return (
      <div className="space-y-3 rounded-2xl bg-background-alt px-5 py-4">
        <p className="text-sm text-muted">{t("shop.reviewLogin")}</p>
        <Button
          href={`/compte/connexion?redirect=${encodeURIComponent(redirect)}`}
          size="md"
        >
          {t("shop.reviewLoginCta")}
        </Button>
      </div>
    );
  }

  if (!eligibility) {
    return <p className="text-sm text-muted">{t("shop.reviewChecking")}</p>;
  }

  if (eligibility.state === "awaiting_receipt") {
    return (
      <div className="space-y-3 rounded-2xl bg-background-alt px-5 py-4">
        <p className="text-sm text-muted">{t("shop.reviewAwaitingReceipt")}</p>
        <Button href="/compte" size="md" variant="ghost">
          {t("shop.reviewAccountCta")}
        </Button>
      </div>
    );
  }

  if (eligibility.state === "not_purchased" || !eligibility.orderId) {
    return (
      <p className="rounded-2xl bg-background-alt px-5 py-4 text-sm text-muted">
        {t("shop.reviewNeedPurchase")}
      </p>
    );
  }

  const submit = async () => {
    const token = session?.access_token;
    if (!token || !eligibility.orderId) return;
    if (rating < 1) {
      setError(t("account.reviewRatingRequired"));
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch("/api/account/orders/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId: eligibility.orderId,
        productId,
        rating,
        comment,
      }),
    });
    setPending(false);
    if (!res.ok) {
      setError(t("account.reviewError"));
      return;
    }
    const json = (await res.json()) as { review?: OrderReviewRow };
    if (json.review) {
      setEligibility((current) =>
        current ? { ...current, review: json.review ?? null } : current,
      );
    }
    setSaved(true);
    setEditing(false);
    router.refresh();
  };

  if (!editing && eligibility.review) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background-alt px-5 py-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-primary">
            {saved ? t("account.reviewSubmitted") : t("shop.reviewYours")}
          </p>
          <RatingInput value={eligibility.review.rating} onChange={() => {}} disabled />
          {eligibility.review.comment ? (
            <p className="text-sm text-muted">{eligibility.review.comment}</p>
          ) : null}
        </div>
        <Button type="button" size="md" variant="ghost" onClick={() => setEditing(true)}>
          {t("account.reviewEdit")}
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3 rounded-2xl bg-background-alt px-5 py-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-sm font-medium text-primary">{t("shop.reviewFormTitle")}</p>
      <RatingInput value={rating} onChange={setRating} disabled={pending} />
      <label className="block space-y-1 text-sm">
        <span className="sr-only">{t("account.reviewCommentPlaceholder")}</span>
        <textarea
          className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("account.reviewCommentPlaceholder")}
          maxLength={2000}
          disabled={pending}
        />
      </label>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <Button type="submit" size="md" pending={pending}>
        {pending ? t("account.reviewSubmitPending") : t("account.reviewSubmit")}
      </Button>
    </form>
  );
}

/** Liste complète des avis en bas de la fiche produit, avec le formulaire de commentaire. */
export function ProductReviewsSection({
  summary,
  productId,
}: {
  summary: ProductReviewSummary;
  productId: string;
}) {
  const { t, i18n } = useTranslation();
  const quotes = summary.reviews.filter((item) => item.comment);

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
          {summary.count > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <Stars value={summary.average} />
              <span className="font-medium text-primary">{ratingLabel}</span>
              <span>{t("shop.reviewsCount", { count: summary.count })}</span>
            </div>
          ) : null}
        </div>
      </div>

      <ProductReviewComposer productId={productId} />

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
                <ReviewByline item={item} />
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
