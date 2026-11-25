"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/components/providers/preferences-provider";
import { formatPrice } from "@/lib/format/price";
import { formatProductLead } from "@/lib/format/product-copy";
import { useCart } from "@/features/cart/context/cart-provider";
import { useFavorites } from "@/features/favorites/context/favorites-provider";
import {
  PRODUCT_COLOR_SWATCH_CLASS,
  type ProductColorKey,
} from "@/lib/domain/product-color";
import { isFibreProduct } from "@/features/shop/utils/map-product";
import { GAMME_COMPLETE_COMPONENT_SLUGS } from "@/lib/domain/bundle";

/** DonnÃ©es produit nÃ©cessaires Ã  l'affichage d'une carte dans une grille boutique. */
export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  price: number;
  /** Prix barrÃ© (avant rÃ©duction) ; undefined/null = pas de rÃ©duction. */
  compareAtPrice?: number | null;
  image: string;
  ingredientImage?: string;
  lifestyleImage?: string | null;
  isNew?: boolean;
  /** Pack de plusieurs soins (gamme complète). */
  isBundle?: boolean;
  productType?: "hair_care" | "accessory";
  /** CatÃ©gorie boutique (fibres, casques, accessoiresâ€¦) pour le groupement de la grille. */
  category?: string;
  stock?: number;
  /** Variantes couleur : si renseignÃ©, l'ajout panier se fait depuis la fiche. */
  colorVariants?: ProductColorKey[];
  /** Photo de chaque teinte, pour le survol d'une fibre ou d'un accessoire coloré. */
  colorImages?: Partial<Record<ProductColorKey, string>>;
  /** Soins inclus dans une gamme, photos quand le catalogue les fournit. */
  bundleItems?: Array<{ slug: string; name: string; image?: string }>;
};

type ProductColorSwatchProps = {
  colorKey: ProductColorKey;
  selected?: boolean;
  size?: "sm" | "md";
};

/** Pastille visuelle d'une couleur produit (tokens swatch du thÃ¨me). */
export function ProductColorSwatch({
  colorKey,
  selected = false,
  size = "md",
}: ProductColorSwatchProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border border-border bg-background p-0.5 ${
        size === "sm" ? "size-6" : "size-11"
      } ${selected ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
      aria-hidden
    >
      <span
        className={`size-full rounded-full border border-border ${PRODUCT_COLOR_SWATCH_CLASS[colorKey]}`}
      />
    </span>
  );
}

type ProductCardProps = {
  product: ProductCardData;
  onAddToCart?: (product: ProductCardData) => void;
  /** Carte plus petite, pour le rail horizontal mobile de la boutique. */
  compact?: boolean;
};

/** Carte produit avec visuel, prix et ajout rapide au panier. */
export function ProductCard({ product, onAddToCart, compact = false }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [added, setAdded] = useState(false);

  const hasIngredientsImage = Boolean(product.ingredientImage);
  const colorVariants = product.colorVariants ?? [];
  const hasColors = colorVariants.length > 0;
  const isBundle = Boolean(product.isBundle);
  const hoverMode = isBundle
    ? "bundle"
    : hasColors
      ? "colors"
      : hasIngredientsImage
        ? "ingredients"
        : "photo";
  const href = hasColors
    ? `/boutique/${product.slug}?couleur=${colorVariants[0]}`
    : `/boutique/${product.slug}`;
  const hasDiscount = Boolean(
    product.compareAtPrice && product.compareAtPrice > product.price,
  );
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        unitPrice: product.price,
        imageUrl: product.image,
      });
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-background-alt/60">
      <div
        className={`relative w-full overflow-hidden bg-background-alt ${
          compact ? "aspect-[3/4] sm:aspect-[4/5]" : "aspect-[4/5]"
        }`}
      >
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col gap-1.5">
          {product.isNew ? (
            <span className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wider text-background">
              {t("shop.newBadge")}
            </span>
          ) : null}
          {isBundle ? (
            <span className="rounded-md bg-accent px-2.5 py-1 text-[10px] font-semibold tracking-wider text-background">
              {t("shop.gammeBadge")}
            </span>
          ) : null}
          {product.productType === "accessory" && !isFibreProduct(product) && !isBundle ? (
            <span className="rounded-md bg-accent px-2.5 py-1 text-[10px] font-semibold tracking-wider text-background">
              {t("shop.accessoryBadge")}
            </span>
          ) : null}
          {hasDiscount ? (
            <span className="rounded-md bg-foreground px-2.5 py-1 text-[10px] font-semibold tracking-wider text-background">
              {t("shop.discountBadge", { percent: discountPercent })}
            </span>
          ) : null}
        </div>
        <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className={`flex items-center justify-center rounded-full bg-background/90 text-primary shadow-sm backdrop-blur transition hover:bg-background ${
              compact ? "size-7 sm:size-9" : "size-8 sm:size-9"
            }`}
            aria-label={
              isFavorite(product.id)
                ? t("shop.removeFromFavorites", { name: product.name })
                : t("shop.addToFavorites", { name: product.name })
            }
            aria-pressed={isFavorite(product.id)}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4.5 sm:size-5"
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
          {product.stock === 0 ? (
            <span className="pointer-events-none rounded-md bg-foreground/80 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-background">
              {t("shop.outOfStock")}
            </span>
          ) : null}
        </div>

        <span
          aria-hidden
          className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-out ${
            hoverMode === "ingredients"
              ? "[@media(hover:hover)]:group-hover:scale-95 [@media(hover:hover)]:group-hover:opacity-0"
              : ""
          }`}
        >
          <Image
            src={product.image}
            alt=""
            fill
            className="object-cover transition duration-500 [@media(hover:hover)]:group-hover:scale-105"
            sizes={
              compact
                ? "(max-width: 640px) 42vw, (max-width: 1280px) 33vw, 20vw"
                : "(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
            }
          />
        </span>
        {hoverMode === "ingredients" && product.ingredientImage ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 scale-95 opacity-0 transition-[opacity,transform] duration-500 ease-out [@media(hover:hover)]:group-hover:scale-100 [@media(hover:hover)]:group-hover:opacity-100"
          >
            <Image
              src={product.ingredientImage}
              alt=""
              fill
              className="object-cover"
              sizes={
                compact
                  ? "(max-width: 640px) 42vw, (max-width: 1280px) 33vw, 20vw"
                  : "(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
              }
            />
          </span>
        ) : null}
        {hoverMode === "colors" ? (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center gap-2 bg-gradient-to-t from-background via-background/80 to-transparent px-2 pb-3 pt-10 opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100">
            {colorVariants.map((key) => {
              const src = product.colorImages?.[key];
              return (
                <span key={key} className="flex min-w-0 flex-col items-center gap-1">
                  {src ? (
                    <span className="relative size-11 overflow-hidden rounded-xl border border-border">
                      <Image src={src} alt="" fill className="object-cover" sizes="44px" />
                    </span>
                  ) : (
                    <ProductColorSwatch colorKey={key} size="sm" />
                  )}
                  <span className="max-w-14 truncate text-[10px] font-medium text-primary">
                    {t(`shop.colors.${key}`)}
                  </span>
                </span>
              );
            })}
          </div>
        ) : null}
        {hoverMode === "bundle" ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end bg-background/85 p-3 opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
              {t("shop.bundleIncludes")}
            </p>
            <ul className="grid grid-cols-5 gap-1.5">
              {GAMME_COMPLETE_COMPONENT_SLUGS.map((slug) => {
                const item = product.bundleItems?.find((entry) => entry.slug === slug);
                const label = item?.name || t(`shop.gammeItems.${slug}`);
                return (
                  <li key={slug} className="min-w-0 text-center">
                    {item?.image ? (
                      <span className="relative mb-1 block aspect-square overflow-hidden rounded-lg">
                        <Image src={item.image} alt="" fill className="object-cover" sizes="64px" />
                      </span>
                    ) : (
                      <span className="mb-1 block aspect-square rounded-lg bg-background-alt" />
                    )}
                    <span className="line-clamp-2 text-[9px] leading-tight text-primary">
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <Link
          href={href}
          className="absolute inset-0 z-10"
          aria-label={t("shop.viewProduct")}
        />
      </div>

      <div
        className={`flex flex-1 flex-col ${
          compact ? "gap-1.5 p-2.5 sm:gap-2 sm:p-4" : "gap-2 p-3 sm:p-4"
        }`}
      >
        <h3
          className={`font-serif leading-snug text-primary ${
            compact ? "line-clamp-2 text-sm sm:text-xl" : "text-base sm:text-xl"
          }`}
        >
          <Link href={href} className="relative z-10 transition hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <p
          className={`line-clamp-2 text-muted ${
            compact ? "hidden text-sm sm:block" : "text-xs sm:text-sm"
          }`}
        >
          {formatProductLead(product.shortDescription)}
        </p>
        <div
          className={`mt-auto flex flex-col ${
            compact ? "gap-1.5 pt-1.5 sm:gap-3 sm:pt-3" : "gap-2 pt-2 sm:gap-3 sm:pt-3"
          }`}
        >
          <p
            className={`flex flex-wrap items-baseline gap-1.5 font-medium text-primary ${
              compact ? "text-xs sm:text-base" : "text-sm sm:text-base"
            }`}
          >
            <span>{formatPrice(product.price, currency, i18n.language)}</span>
            {hasDiscount ? (
              <span className="text-xs font-normal text-muted line-through sm:text-sm">
                {formatPrice(product.compareAtPrice!, currency, i18n.language)}
              </span>
            ) : null}
          </p>
          {hasColors ? (
            <div className="flex items-center gap-1.5" aria-hidden>
              {colorVariants.map((key) => (
                <ProductColorSwatch key={key} colorKey={key} size="sm" />
              ))}
            </div>
          ) : null}
          {hasColors ? (
            <Link
              href={href}
              className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-background transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                compact ? "h-8 sm:h-11" : "h-10 sm:h-11"
              }`}
              aria-label={t("shop.chooseColorAria", { name: product.name })}
            >
              <span
                className={`font-medium uppercase tracking-wide sm:text-sm ${
                  compact ? "text-[10px]" : "text-xs"
                }`}
              >
                {t("shop.chooseColor")}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-background transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                compact ? "h-8 sm:h-11" : "h-10 sm:h-11"
              }`}
              aria-label={t("shop.addToCart", { name: product.name })}
            >
              <svg
                viewBox="0 0 24 24"
                className={`shrink-0 sm:size-5 ${compact ? "size-4" : "size-4.5"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M6 7h12l-1 11H7L6 7Z" />
                <path d="M9 7V5.5A3 3 0 0 1 15 5.5V7" />
              </svg>
              <span
                className={`font-medium uppercase tracking-wide sm:text-sm ${
                  compact ? "text-[10px]" : "text-xs"
                }`}
              >
                {t("shop.addToCartButton")}
              </span>
            </button>
          )}
        </div>
        {added && !hasColors ? (
          <p className="text-xs text-primary" role="status">
            {t("shop.addedToCart", { name: product.name })}
          </p>
        ) : null}
      </div>
    </article>
  );
}
