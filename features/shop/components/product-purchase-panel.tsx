"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ProductColorSwatch } from "@/components/ui/product-card";
import { ProductGallery, type GalleryImage } from "@/features/shop/components/product-gallery";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useCart } from "@/features/cart/context/cart-provider";
import { useFavorites } from "@/features/favorites/context/favorites-provider";
import {
  ProductRatingSummary,
  ProductReviewsCarousel,
} from "@/features/reviews/components/product-reviews";
import { formatPrice } from "@/lib/format/price";
import { formatProductLead } from "@/lib/format/product-copy";
import { GAMME_COMPLETE_SLUG } from "@/lib/domain/bundle";
import {
  parseProductColorKey,
  resolveProductImageForColor,
  type ProductColorKey,
} from "@/lib/domain/product-color";
import type { ProductReviewSummary } from "@/lib/infrastructure/supabase/order-reviews";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Props du panneau d'achat produit. */
type ProductPurchasePanelProps = {
  product: ProductRow;
  /** Couleur actuellement sélectionnée. */
  selectedColor: ProductColorKey | null;
  /** Met à jour la couleur choisie. */
  onSelectedColorChange: (key: ProductColorKey) => void;
  /** Note et avis du produit, affichés sous le titre et sous l'ajout au panier. */
  reviewSummary?: ProductReviewSummary;
};

/** Props du bloc galerie + achat d'une fiche produit. */
type ProductShowcaseProps = {
  product: ProductRow;
  images: GalleryImage[];
  initialColor?: string | null;
  reviewSummary?: ProductReviewSummary;
};

/** Première couleur valide : query `couleur` si elle existe, sinon la première variante. */
function firstValidColor(
  variants: ProductColorKey[],
  raw?: string | null,
): ProductColorKey | null {
  const fromUrl = parseProductColorKey(raw);
  if (fromUrl && variants.includes(fromUrl)) return fromUrl;
  return variants[0] ?? null;
}

/**
 * Galerie + panneau d'achat : la photo principale suit la couleur choisie.
 */
export function ProductShowcase({
  product,
  images,
  initialColor,
  reviewSummary,
}: ProductShowcaseProps) {
  const { t } = useTranslation();
  const colorKeys = product.color_variants;
  const [selectedColor, setSelectedColor] = useState<ProductColorKey | null>(
    () => firstValidColor(colorKeys, initialColor),
  );

  useEffect(() => {
    if (!selectedColor || !colorKeys.length) return;
    const url = new URL(window.location.href);
    url.searchParams.set("couleur", selectedColor);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [selectedColor, colorKeys.length]);

  const featuredSrc = resolveProductImageForColor(product, selectedColor);
  const galleryImages: GalleryImage[] = selectedColor
    ? [
        {
          src: featuredSrc,
          alt: `${product.name} — ${t(`shop.colors.${selectedColor}`)}`,
          labelKey: featuredSrc !== product.image_url ? "shop.galleryColor" : "shop.galleryProduct",
        },
        ...images,
      ]
    : images;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
      <ProductGallery images={galleryImages} featuredSrc={featuredSrc} />
      <ProductPurchasePanel
        product={product}
        selectedColor={selectedColor}
        onSelectedColorChange={setSelectedColor}
        reviewSummary={reviewSummary}
      />
    </div>
  );
}

/** Panneau d'achat sticky d'une fiche produit : prix, stock, sélecteur de quantité et ajout au panier. */
export function ProductPurchasePanel({
  product,
  selectedColor,
  onSelectedColorChange,
  reviewSummary,
}: ProductPurchasePanelProps) {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const colorKeys = product.color_variants;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const lowStock = product.stock > 0 && product.stock <= 5;
  const outOfStock = product.stock <= 0;
  const categoryKey = `shop.categories.${product.category}`;
  const isBundle = product.is_bundle;
  const isFlagshipGamme = product.slug === GAMME_COMPLETE_SLUG;
  const hasDiscount = Boolean(
    product.compare_at_price && product.compare_at_price > product.price,
  );
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0;
  const displayName = selectedColor
    ? `${product.name} — ${t(`shop.colors.${selectedColor}`)}`
    : product.name;
  const colorRequired = colorKeys.length > 0 && !selectedColor;
  const handleAdd = () => {
    if (outOfStock || colorRequired) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        unitPrice: product.price,
        imageUrl: resolveProductImageForColor(product, selectedColor),
        colorKey: selectedColor,
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
          {isFlagshipGamme ? (
            <span className="rounded-md bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {t("shop.gammeOfferBadge")}
            </span>
          ) : isBundle ? (
            <span className="rounded-md bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {t("shop.bundleBadge")}
            </span>
          ) : null}
          {hasDiscount ? (
            <span className="rounded-md bg-foreground px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-background">
              {t("shop.discountBadge", { percent: discountPercent })}
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          <h1 className="font-serif text-4xl leading-tight text-primary sm:text-5xl">
            {product.name}
          </h1>
          {reviewSummary ? (
            <ProductRatingSummary summary={reviewSummary} />
          ) : null}
          <p className="max-w-md text-base leading-relaxed text-muted">
            {formatProductLead(product.short_description)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="flex flex-wrap items-baseline gap-2 font-serif text-3xl text-primary">
            <span>{formatPrice(product.price, currency, i18n.language)}</span>
            {hasDiscount ? (
              <span className="font-sans text-lg font-normal text-muted line-through">
                {formatPrice(product.compare_at_price!, currency, i18n.language)}
              </span>
            ) : null}
          </p>
          {isFlagshipGamme ? (
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

        {colorKeys.length ? (
          <fieldset className="space-y-3">
            <legend className="sr-only">{t("shop.colorLabel")}</legend>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                {t("shop.colorLabel")}
              </p>
              <p className="text-sm text-primary" aria-live="polite">
                {selectedColor
                  ? t(`shop.colors.${selectedColor}`)
                  : t("shop.chooseColor")}
              </p>
            </div>
            <div
              className="flex flex-wrap gap-3"
              role="radiogroup"
              aria-label={t("shop.colorLabel")}
            >
              {colorKeys.map((key) => {
                const selected = selectedColor === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={t(`shop.colors.${key}`)}
                    onClick={() => onSelectedColorChange(key)}
                    className="rounded-full transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <ProductColorSwatch colorKey={key} selected={selected} />
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}
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
            disabled={outOfStock || colorRequired}
          >
            {t("shop.addToCartButton")}
          </Button>

          <button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-primary transition hover:border-accent hover:bg-background-alt"
            aria-label={
              isFavorite(product.id)
                ? t("shop.removeFromFavorites", { name: product.name })
                : t("shop.addToFavorites", { name: product.name })
            }
            aria-pressed={isFavorite(product.id)}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill={isFavorite(product.id) ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path
                d="M12 20.5s-7.5-4.6-10-9.1C.6 8 2 4.5 5.4 3.6c2.1-.5 4.1.4 5.3 2.1a.4.4 0 0 0 .6 0c1.2-1.7 3.2-2.6 5.3-2.1C20 4.5 21.4 8 22 11.4c-2.5 4.5-10 9.1-10 9.1Z"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {added ? (
          <p className="text-sm text-primary" role="status">
            {t("shop.addedToCart", { name: displayName })}{" "}
            <Link href="/panier" className="underline underline-offset-4 hover:text-accent">
              {t("shop.viewCart")}
            </Link>
          </p>
        ) : null}

        {reviewSummary ? (
          <ProductReviewsCarousel summary={reviewSummary} />
        ) : null}
      </div>

      <ul className="space-y-3 border-t border-border pt-8 text-sm text-muted">
        {isFlagshipGamme ? (
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
