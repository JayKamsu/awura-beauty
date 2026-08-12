"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RatingInput } from "@/components/ui/rating-input";
import type { OrderReviewRow } from "@/lib/infrastructure/supabase/order-reviews";

type DiagnosticTestimonialFormProps = {
  diagnosticId: string;
  accessToken?: string;
};

/** Permet au client de laisser un témoignage (note + commentaire) sur son bilan diagnostic reçu. */
export function DiagnosticTestimonialForm({
  diagnosticId,
  accessToken,
}: DiagnosticTestimonialFormProps) {
  const { t } = useTranslation();
  const [existing, setExisting] = useState<OrderReviewRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/account/diagnostic/testimonial?diagnosticId=${encodeURIComponent(diagnosticId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok || cancelled) return;
      const json = (await res.json()) as { review?: OrderReviewRow | null };
      if (cancelled) return;
      if (json.review) {
        setExisting(json.review);
        setRating(json.review.rating);
        setComment(json.review.comment);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [diagnosticId, accessToken]);

  const submit = async () => {
    if (!accessToken) return;
    if (rating < 1) {
      setError(t("account.reviewRatingRequired"));
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch("/api/account/diagnostic/testimonial", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ diagnosticId, rating, comment }),
    });
    setPending(false);
    if (!res.ok) {
      setError(t("account.reviewError"));
      return;
    }
    const json = (await res.json()) as { review?: OrderReviewRow };
    if (json.review) {
      setExisting(json.review);
      setEditing(false);
    }
  };

  if (!loaded) return null;

  if (!editing && existing) {
    return (
      <div className="space-y-2 rounded-xl bg-background-alt px-3 py-3 text-sm">
        <p className="font-medium text-primary">
          {t("account.diagnosticsTestimonialThanks")}
        </p>
        <RatingInput value={existing.rating} onChange={() => {}} disabled />
        {existing.comment ? (
          <p className="text-sm text-muted">{existing.comment}</p>
        ) : null}
        <Button type="button" size="md" variant="ghost" onClick={() => setEditing(true)}>
          {t("account.reviewEdit")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl bg-background-alt px-3 py-3 text-sm">
      <p className="font-medium text-primary">
        {t("account.diagnosticsTestimonialPrompt")}
      </p>
      <RatingInput value={rating} onChange={setRating} disabled={pending} />
      <textarea
        className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("account.diagnosticsTestimonialPlaceholder")}
        disabled={pending}
      />
      {error ? <p className="text-xs text-accent">{error}</p> : null}
      <Button type="button" size="md" pending={pending} onClick={() => void submit()}>
        {pending ? t("account.reviewSubmitPending") : t("account.reviewSubmit")}
      </Button>
    </div>
  );
}
