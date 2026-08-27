"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RatingInput } from "@/components/ui/rating-input";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { SiteTestimonialRow, TestimonialInviteRow } from "@/lib/domain/testimonial";
import type { OrderReviewRow } from "@/lib/infrastructure/supabase/order-reviews";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Panneau admin : liens d'invitation, témoignages site (photos), avis produits et diagnostic. */
export function AdminReviewsPanel() {
  const { t, i18n } = useTranslation();
  const adminFetch = useAdminFetch();
  const [reviews, setReviews] = useState<OrderReviewRow[]>([]);
  const [testimonials, setTestimonials] = useState<OrderReviewRow[]>([]);
  const [siteTestimonials, setSiteTestimonials] = useState<SiteTestimonialRow[]>([]);
  const [invites, setInvites] = useState<TestimonialInviteRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftQuote, setDraftQuote] = useState("");
  const [draftRating, setDraftRating] = useState(5);
  const [draftImage, setDraftImage] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [reviewsRes, productsRes, testimonialsRes, siteRes, invitesRes] =
      await Promise.all([
        adminFetch("/api/admin/reviews"),
        adminFetch("/api/admin/products"),
        adminFetch("/api/admin/diagnostic/testimonials"),
        adminFetch("/api/admin/testimonials"),
        adminFetch("/api/admin/testimonial-invites"),
      ]);
    const reviewsJson = (await reviewsRes.json()) as { reviews?: OrderReviewRow[] };
    const productsJson = (await productsRes.json()) as { products?: ProductRow[] };
    const testimonialsJson = (await testimonialsRes.json()) as {
      testimonials?: OrderReviewRow[];
    };
    const siteJson = (await siteRes.json()) as { testimonials?: SiteTestimonialRow[] };
    const invitesJson = (await invitesRes.json()) as { invites?: TestimonialInviteRow[] };
    setReviews(reviewsJson.reviews ?? []);
    setProducts(productsJson.products ?? []);
    setTestimonials(testimonialsJson.testimonials ?? []);
    setSiteTestimonials(siteJson.testimonials ?? []);
    setInvites(invitesJson.invites ?? []);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) map.set(product.id, product.name);
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((review) => {
      const name = (review.productId && productNameById.get(review.productId)) ?? "";
      return (
        name.toLowerCase().includes(q) ||
        review.comment.toLowerCase().includes(q) ||
        (review.orderId ?? "").toLowerCase().includes(q)
      );
    });
  }, [reviews, query, productNameById]);

  const uploadImage = async (file: File, targetId?: string) => {
    setUploadingId(targetId ?? "new");
    const body = new FormData();
    body.append("file", file);
    body.append("folder", "testimonials");
    const res = await adminFetch("/api/admin/upload", { method: "POST", body });
    const json = (await res.json()) as { url?: string };
    setUploadingId(null);
    return json.url ?? "";
  };

  const createInvite = async () => {
    const res = await adminFetch("/api/admin/testimonial-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: inviteNote }),
    });
    const json = (await res.json()) as { url?: string };
    if (json.url) {
      setCreatedUrl(json.url);
      setCopied(false);
      setInviteNote("");
      void load();
    }
  };

  const copyUrl = async () => {
    if (!createdUrl) return;
    await navigator.clipboard.writeText(createdUrl);
    setCopied(true);
  };

  const saveDraft = async () => {
    const res = await adminFetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorName: draftName,
        quote: draftQuote,
        rating: draftRating,
        imageUrl: draftImage,
        published: true,
      }),
    });
    if (!res.ok) return;
    setDraftName("");
    setDraftQuote("");
    setDraftRating(5);
    setDraftImage("");
    void load();
  };

  const patchSite = async (
    id: string,
    patch: Partial<SiteTestimonialRow> & { imageUrl?: string; published?: boolean },
  ) => {
    await adminFetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    void load();
  };

  const fieldClass =
    "min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <AdminPageHeader
        title={t("admin.reviewsTitle")}
        subtitle={t("admin.reviewsSubtitle")}
      />

      <section className="space-y-3 rounded-2xl border border-border p-4">
        <h2 className="font-serif text-xl text-primary">
          {t("admin.reviews.inviteTitle")}
        </h2>
        <p className="text-sm text-muted">{t("admin.reviews.inviteHint")}</p>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{t("admin.reviews.inviteNote")}</span>
          <input
            className={fieldClass}
            value={inviteNote}
            onChange={(e) => setInviteNote(e.target.value)}
          />
        </label>
        <Button type="button" onClick={() => void createInvite()}>
          {t("admin.reviews.inviteCreate")}
        </Button>
        {createdUrl ? (
          <div className="space-y-2 rounded-xl bg-background-alt p-3 text-sm">
            <p className="font-medium text-primary">
              {t("admin.reviews.inviteCreated")}
            </p>
            <p className="break-all text-muted">{createdUrl}</p>
            <Button type="button" variant="ghost" onClick={() => void copyUrl()}>
              {copied ? t("admin.reviews.inviteCopied") : t("admin.reviews.inviteCopy")}
            </Button>
          </div>
        ) : null}
        {invites.length ? (
          <ul className="space-y-2 text-xs text-muted">
            {invites.slice(0, 8).map((invite) => {
              const expired = new Date(invite.expiresAt).getTime() < Date.now();
              const status = invite.usedAt
                ? t("admin.reviews.inviteUsed")
                : expired
                  ? t("admin.reviews.inviteExpired")
                  : t("admin.reviews.inviteOpen");
              return (
                <li key={invite.id}>
                  {invite.note ? `${invite.note} · ` : ""}
                  {status} ·{" "}
                  {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                    dateStyle: "medium",
                  }).format(new Date(invite.createdAt))}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-primary">
          {t("admin.reviews.siteTitle")}
        </h2>
        <div className="space-y-3 rounded-2xl border border-border p-4">
          <p className="text-sm font-medium text-primary">
            {t("admin.reviews.addSite")}
          </p>
          <input
            className={fieldClass}
            placeholder={t("admin.reviews.authorName")}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <RatingInput value={draftRating} onChange={setDraftRating} />
          <textarea
            className={fieldClass}
            rows={3}
            placeholder={t("admin.reviews.quote")}
            value={draftQuote}
            onChange={(e) => setDraftQuote(e.target.value)}
          />
          {draftImage ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-background-alt">
              <Image src={draftImage} alt="" fill className="object-cover" />
            </div>
          ) : null}
          <input
            type="file"
            accept="image/*"
            disabled={uploadingId === "new"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void uploadImage(file).then((url) => {
                if (url) setDraftImage(url);
              });
            }}
          />
          {draftImage ? (
            <button
              type="button"
              className="text-sm text-accent"
              onClick={() => setDraftImage("")}
            >
              {t("admin.reviews.removeImage")}
            </button>
          ) : null}
          <Button type="button" onClick={() => void saveDraft()}>
            {t("admin.save")}
          </Button>
        </div>

        {loading ? (
          <p className="text-muted">{t("admin.loading")}</p>
        ) : siteTestimonials.length === 0 ? (
          <AdminEmptyState message={t("admin.reviews.siteEmpty")} />
        ) : (
          <ul className="space-y-3">
            {siteTestimonials.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-start"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-background-alt">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-2 text-sm">
                  <p className="font-medium text-primary">{item.authorName}</p>
                  <RatingInput value={item.rating} onChange={() => {}} disabled />
                  <p className="text-muted">{item.quote}</p>
                  <label className="flex items-center gap-2 text-muted">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={item.published}
                      onChange={(e) =>
                        void patchSite(item.id, { published: e.target.checked })
                      }
                    />
                    {t("admin.reviews.published")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <label className="text-xs text-accent">
                      {t("admin.reviews.replaceImage")}
                      <input
                        type="file"
                        accept="image/*"
                        className="ml-2"
                        disabled={uploadingId === item.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void uploadImage(file, item.id).then((url) => {
                            if (url) void patchSite(item.id, { imageUrl: url });
                          });
                        }}
                      />
                    </label>
                    {item.imageUrl ? (
                      <button
                        type="button"
                        className="text-xs text-accent"
                        onClick={() => void patchSite(item.id, { imageUrl: "" })}
                      >
                        {t("admin.reviews.removeImage")}
                      </button>
                    ) : null}
                    <ConfirmDeleteButton
                      label={t("admin.delete")}
                      confirmMessage={t("admin.confirmDeleteAction")}
                      onConfirm={async () => {
                        await adminFetch(`/api/admin/testimonials/${item.id}`, {
                          method: "DELETE",
                        });
                        void load();
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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
                  {(review.productId && productNameById.get(review.productId)) ??
                    review.productId}
                </p>
                <RatingInput value={review.rating} onChange={() => {}} disabled />
                <p className="text-muted">{review.comment || t("admin.reviews.noComment")}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-muted">
                <p>
                  {t("admin.reviews.colOrder")}: #{(review.orderId ?? "").slice(0, 8)}
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

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="font-serif text-xl text-primary">
          {t("admin.reviews.diagnosticTestimonialsTitle", {
            count: testimonials.length,
          })}
        </h2>
        {loading ? null : testimonials.length === 0 ? (
          <AdminEmptyState message={t("admin.reviews.diagnosticTestimonialsEmpty")} />
        ) : (
          <ul className="space-y-3">
            {testimonials.map((testimonial) => (
              <li
                key={testimonial.id}
                className="flex flex-col gap-2 rounded-2xl border border-border p-4 text-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <RatingInput value={testimonial.rating} onChange={() => {}} disabled />
                  <p className="text-muted">
                    {testimonial.comment || t("admin.reviews.noComment")}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted">
                  <p>
                    {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                      dateStyle: "medium",
                    }).format(new Date(testimonial.createdAt))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
