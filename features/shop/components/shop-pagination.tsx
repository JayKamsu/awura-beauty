"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

/** Props de la pagination de la boutique. */
type ShopPaginationProps = {
  page: number;
  totalPages: number;
  /** Paramètres additionnels à préserver dans l'URL (catégorie, univers, recherche, prix, tri…). */
  extraParams?: Record<string, string | null | undefined>;
};

function buildHref(page: number, extraParams: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extraParams)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/boutique?${query}` : "/boutique";
}

/** Pagination précédent/suivant de la boutique, préserve tous les filtres actifs dans l'URL ; masquée s'il n'y a qu'une page. */
export function ShopPagination({
  page,
  totalPages,
  extraParams = {},
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
          href={buildHref(page - 1, extraParams)}
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
          href={buildHref(page + 1, extraParams)}
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
