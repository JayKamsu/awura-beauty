"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RatingInput } from "@/components/ui/rating-input";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { OrderReviewRow } from "@/lib/infrastructure/supabase/order-reviews";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Panneau admin listant les avis produits laissés par les clients. */
export function AdminReviewsPanel() {
  const { t, i18n } = useTranslation();
  const adminFetch = useAdminFetch();
  const [reviews, setReviews] = useState<OrderReviewRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      const [reviewsRes, productsRes] = await Promise.all([
        adminFetch("/api/admin/reviews"),
        adminFetch("/api/admin/products"),
      ]);
      const reviewsJson = (await reviewsRes.json()) as { reviews?: OrderReviewRow[] };
      const productsJson = (await productsRes.json()) as { products?: ProductRow[] };
      setReviews(reviewsJson.reviews ?? []);
      setProducts(productsJson.products ?? []);
      setLoading(false);
    })();
  }, [adminFetch]);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) map.set(product.id, product.name);
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((review) => {
      const name = productNameById.get(review.productId) ?? "";
      return (
        name.toLowerCase().includes(q) ||
        review.comment.toLowerCase().includes(q) ||
        review.orderId.toLowerCase().includes(q)
      );
    });
  }, [reviews, query, productNameById]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 md:px-6">
      <AdminPageHeader
        title={t("admin.reviewsTitle")}
        subtitle={t("admin.reviewsSubtitle")}
      />

      <AdminSearchField value={query} onChange={setQuery} />

      {loading ? (
        <p className="text-muted">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          message={
            reviews.length === 0
              ? t("admin.reviews.empty")
              : t("admin.noSearchResults")
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((review) => (
            <li
              key={review.id}
              className="flex flex-col gap-2 rounded-2xl border border-border p-4 text-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-primary">
                  {productNameById.get(review.productId) ?? review.productId}
                </p>
                <RatingInput value={review.rating} onChange={() => {}} disabled />
                <p className="text-muted">{review.comment || t("admin.reviews.noComment")}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-muted">
                <p>
                  {t("admin.reviews.colOrder")}: #{review.orderId.slice(0, 8)}
                </p>
                <p>
                  {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                    dateStyle: "medium",
                  }).format(new Date(review.createdAt))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
