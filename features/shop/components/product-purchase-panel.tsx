"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useCart } from "@/features/cart/context/cart-provider";
import { formatPrice } from "@/lib/format/price";
import { isGammeCompleteSlug } from "@/lib/domain/bundle";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Props du panneau d'achat produit. */
type ProductPurchasePanelProps = {
  product: ProductRow;
};

/** Panneau d'achat sticky d'une fiche produit : prix, stock, sélecteur de quantité et ajout au panier. */
export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const lowStock = product.stock > 0 && product.stock <= 5;
  const outOfStock = product.stock <= 0;
  const categoryKey = `shop.categories.${product.category}`;
  const isGamme = isGammeCompleteSlug(product.slug);
  const handleAdd = () => {
    if (outOfStock) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        unitPrice: product.price,
        imageUrl: product.image_url,
      },
      quantity,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2800);
  };

  const decrease = () => setQuantity((q) => Math.max(1, q - 1));
  const increase = () =>
    setQuantity((q) => Math.min(Math.max(product.stock, 1), q + 1));

  return (
    <div className="space-y-8 lg:sticky lg:top-28">
      <div className="space-y-5">
        <nav aria-label={t("shop.breadcrumbLabel")} className="text-sm text-muted">
          <Link href="/boutique" className="transition hover:text-accent">
            {t("shop.title")}
          </Link>
          <span className="mx-2 text-border" aria-hidden>
            /
          </span>
          <span className="break-words text-primary">{product.name}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            {t(categoryKey)}
          </span>
          {product.is_new ? (
            <span className="rounded-md bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-background">
              {t("shop.newBadge")}
            </span>
          ) : null}
          {isGamme ? (
            <span className="rounded-md bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {t("shop.gammeOfferBadge")}
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          <h1 className="font-serif text-4xl leading-tight text-primary sm:text-5xl">
            {product.name}
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted">
            {product.short_description}
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-serif text-3xl text-primary">
            {formatPrice(product.price, currency, i18n.language)}
          </p>
          {isGamme ? (
            <p className="text-sm text-muted">{t("shop.gammeCompareHint")}</p>
          ) : null}
        </div>

        <p
          className={`text-sm ${
            outOfStock
              ? "text-muted"
              : lowStock
                ? "text-accent"
                : "text-muted"
          }`}
        >
          {outOfStock
            ? t("shop.outOfStock")
            : lowStock
              ? t("shop.lowStock", { count: product.stock })
              : t("shop.inStock")}
        </p>
      </div>

      <div className="space-y-4 border-t border-border pt-8">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="inline-flex items-center rounded-xl border border-border bg-background"
            role="group"
            aria-label={t("shop.quantityLabel")}
          >
            <button
              type="button"
              onClick={decrease}
              disabled={quantity <= 1 || outOfStock}
              className="flex size-11 items-center justify-center text-primary transition hover:bg-background-alt disabled:opacity-40"
              aria-label={t("shop.quantityDecrease")}
            >
              −
            </button>
            <span className="min-w-10 text-center text-sm font-medium text-primary" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={increase}
              disabled={outOfStock || quantity >= product.stock}
              className="flex size-11 items-center justify-center text-primary transition hover:bg-background-alt disabled:opacity-40"
              aria-label={t("shop.quantityIncrease")}
            >
              +
            </button>
          </div>

          <Button
            type="button"
            size="lg"
            className="min-w-[12rem] flex-1 sm:flex-none"
            onClick={handleAdd}
            disabled={outOfStock}
          >
            {t("shop.addToCartButton")}
          </Button>
        </div>

        {added ? (
          <p className="text-sm text-primary" role="status">
            {t("shop.addedToCart", { name: product.name })}{" "}
            <Link href="/panier" className="underline underline-offset-4 hover:text-accent">
              {t("shop.viewCart")}
            </Link>
          </p>
        ) : null}
      </div>

      <ul className="space-y-3 border-t border-border pt-8 text-sm text-muted">
        {isGamme ? (
          <li className="flex gap-3 font-medium text-primary">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            {t("shop.gammeOfferBadge")}
          </li>
        ) : null}
        <li className="flex gap-3">
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
          {t("shop.trustNatural")}
        </li>
        <li className="flex gap-3">
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
          {t("shop.trustShipping")}
        </li>
        <li className="flex gap-3">
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
          {t("shop.trustTexture")}
        </li>
      </ul>
    </div>
  );
}
