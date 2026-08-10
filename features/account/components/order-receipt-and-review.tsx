"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RatingInput } from "@/components/ui/rating-input";
import { useAuth } from "@/features/auth/context/auth-provider";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { OrderReviewRow } from "@/lib/infrastructure/supabase/order-reviews";
import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";

/** Props du bloc reçu/avis : la commande concernée et le callback de synchronisation après mise à jour. */
type OrderReceiptAndReviewProps = {
  order: OrderRow;
  onOrderUpdate: (order: OrderRow) => void;
};

/** Permet au client de confirmer la réception d'une commande livrée puis de noter les produits reçus. */
export function OrderReceiptAndReview({
  order,
  onOrderUpdate,
}: OrderReceiptAndReviewProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, OrderReviewRow>>({});
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  const canConfirmReceipt =
    !order.received_at &&
    (order.shipping_status === "delivered" || order.status === "paid");

  useEffect(() => {
    if (!order.received_at || !session?.access_token) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/account/orders/review?orderId=${encodeURIComponent(order.id)}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      if (!res.ok || cancelled) return;
      const json = (await res.json()) as { reviews?: OrderReviewRow[] };
      if (cancelled) return;
      const byProduct: Record<string, OrderReviewRow> = {};
      for (const review of json.reviews ?? []) byProduct[review.productId] = review;
      setReviews(byProduct);
      setReviewsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [order.received_at, order.id, session?.access_token]);

  const confirmReceipt = async () => {
    if (!session?.access_token) return;
    setConfirming(true);
    setError(null);
    const res = await fetch("/api/account/orders/confirm-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ orderId: order.id }),
    });
    setConfirming(false);
    if (!res.ok) {
      setError(t("account.confirmReceiptError"));
      return;
    }
    const json = (await res.json()) as { order?: OrderRow };
    if (json.order) onOrderUpdate(json.order);
  };

  if (!canConfirmReceipt && !order.received_at) return null;

  return (
    <div className="space-y-4 rounded-xl bg-background-alt/80 p-4">
      {order.received_at ? (
        <p className="text-sm text-primary">
          {t("account.confirmReceiptDone", {
            date: new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
              dateStyle: "medium",
            }).format(new Date(order.received_at)),
          })}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            {t("account.confirmReceiptPrompt")}
          </p>
          {error ? <p className="text-sm text-accent">{error}</p> : null}
          <Button
            type="button"
            size="md"
            pending={confirming}
            onClick={() => void confirmReceipt()}
          >
            {confirming
              ? t("account.confirmReceiptPending")
              : t("account.confirmReceiptButton")}
          </Button>
        </div>
      )}

      {order.received_at && reviewsLoaded ? (
        <div className="space-y-3 border-t border-border/70 pt-3">
          <p className="text-sm font-medium text-primary">
            {t("account.reviewPrompt")}
          </p>
          {order.items.map((item) => (
            <ProductReviewForm
              key={item.product_id}
              orderId={order.id}
              productId={item.product_id}
              productName={item.name}
              existing={reviews[item.product_id]}
              accessToken={session?.access_token}
              onSaved={(review) =>
                setReviews((prev) => ({ ...prev, [item.product_id]: review }))
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductReviewForm({
  orderId,
  productId,
  productName,
  existing,
  accessToken,
  onSaved,
}: {
  orderId: string;
  productId: string;
  productName: string;
  existing?: OrderReviewRow;
  accessToken?: string;
  onSaved: (review: OrderReviewRow) => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(!existing);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!accessToken) return;
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
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ orderId, productId, rating, comment }),
    });
    setPending(false);
    if (!res.ok) {
      setError(t("account.reviewError"));
      return;
    }
    const json = (await res.json()) as { review?: OrderReviewRow };
    if (json.review) {
      onSaved(json.review);
      setEditing(false);
    }
  };

  if (!editing && existing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 text-sm">
        <div className="min-w-0">
          <p className="truncate text-primary">{productName}</p>
          <div className="flex items-center gap-2">
            <RatingInput value={existing.rating} onChange={() => {}} disabled />
            {existing.comment ? (
              <span className="truncate text-xs text-muted">{existing.comment}</span>
            ) : null}
          </div>
        </div>
        <Button type="button" size="md" variant="ghost" onClick={() => setEditing(true)}>
          {t("account.reviewEdit")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg bg-background px-3 py-3 text-sm">
      <p className="text-primary">{productName}</p>
      <RatingInput value={rating} onChange={setRating} disabled={pending} />
      <textarea
        className="min-h-16 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("account.reviewCommentPlaceholder")}
        disabled={pending}
      />
      {error ? <p className="text-xs text-accent">{error}</p> : null}
      <Button type="button" size="md" pending={pending} onClick={() => void submit()}>
        {pending ? t("account.reviewSubmitPending") : t("account.reviewSubmit")}
      </Button>
    </div>
  );
}
