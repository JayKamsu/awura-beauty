"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

type ShopPaginationProps = {
  page: number;
  totalPages: number;
  category?: string | null;
  universe?: "adult" | "child" | null;
};

function buildHref(
  page: number,
  category?: string | null,
  universe?: "adult" | "child" | null,
) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (universe === "adult" || universe === "child") {
    params.set("universe", universe);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/boutique?${query}` : "/boutique";
}

export function ShopPagination({
  page,
  totalPages,
  category,
  universe,
}: ShopPaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-3"
      aria-label={t("shop.paginationLabel")}
    >
      {page > 1 ? (
        <Link
          href={buildHref(page - 1, category, universe)}
          className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm text-foreground transition hover:border-accent"
        >
          {t("shop.prev")}
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center rounded-xl border border-transparent px-4 text-sm text-muted opacity-40">
          {t("shop.prev")}
        </span>
      )}

      <p className="text-sm text-muted">
        {t("shop.pageStatus", { page, totalPages })}
      </p>

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1, category, universe)}
          className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm text-foreground transition hover:border-accent"
        >
          {t("shop.next")}
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center rounded-xl border border-transparent px-4 text-sm text-muted opacity-40">
          {t("shop.next")}
        </span>
      )}
    </nav>
  );
}
