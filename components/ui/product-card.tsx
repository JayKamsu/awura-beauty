"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/components/providers/preferences-provider";
import { formatPrice } from "@/lib/format/price";
import { useCart } from "@/features/cart/context/cart-provider";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  price: number;
  image: string;
  ingredientImage?: string;
  lifestyleImage?: string | null;
  isNew?: boolean;
};

type ProductCardProps = {
  product: ProductCardData;
  onAddToCart?: (product: ProductCardData) => void;
};

function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const { addItem } = useCart();
  /** Mobile / tactile : bascule manuelle (desktop = hover CSS). */
  const [touchReveal, setTouchReveal] = useState(false);
  const [added, setAdded] = useState(false);

  const hasIngredientsImage = Boolean(product.ingredientImage);
  const href = `/boutique/${product.slug}`;

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

  const handleMediaClick = (event: React.MouseEvent) => {
    if (!hasIngredientsImage || !isCoarsePointer()) return;
    event.preventDefault();
    setTouchReveal((value) => !value);
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-background-alt/60">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-background-alt">
        {product.isNew ? (
          <span className="absolute left-3 top-3 z-20 rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold tracking-wider text-background">
            {t("shop.newBadge")}
          </span>
        ) : null}

        <Link
          href={href}
          className="absolute inset-0 z-0 block"
          aria-label={t("shop.viewProduct")}
          onClick={handleMediaClick}
        >
          <span
            aria-hidden
            className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-out ${
              touchReveal
                ? "pointer-events-none scale-95 opacity-0"
                : "scale-100 opacity-100"
            } ${
              hasIngredientsImage
                ? "[@media(hover:hover)]:group-hover:pointer-events-none [@media(hover:hover)]:group-hover:scale-95 [@media(hover:hover)]:group-hover:opacity-0"
                : ""
            }`}
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition duration-500 [@media(hover:hover)]:group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
            />
          </span>
          {hasIngredientsImage ? (
            <span
              aria-hidden
              className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-out ${
                touchReveal
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0"
              } [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:scale-100 [@media(hover:hover)]:group-hover:opacity-100`}
            >
              <Image
                src={product.ingredientImage!}
                alt={t("shop.ingredientAlt", { name: product.name })}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
              />
            </span>
          ) : null}
        </Link>

        {hasIngredientsImage ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 [@media(hover:hover)]:hidden"
            aria-hidden
          >
            <span
              className={`size-1.5 rounded-full transition ${
                touchReveal ? "bg-background/50" : "bg-background"
              }`}
            />
            <span
              className={`size-1.5 rounded-full transition ${
                touchReveal ? "bg-background" : "bg-background/50"
              }`}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-serif text-xl text-primary">
          <Link href={href} className="transition hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-muted">{product.shortDescription}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="font-medium text-primary">
            {formatPrice(product.price, currency, i18n.language)}
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-background transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label={t("shop.addToCart", { name: product.name })}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path d="M6 7h12l-1 11H7L6 7Z" />
              <path d="M9 7V5.5A3 3 0 0 1 15 5.5V7" />
            </svg>
          </button>
        </div>
        {added ? (
          <p className="text-xs text-primary" role="status">
            {t("shop.addedToCart", { name: product.name })}
          </p>
        ) : null}
      </div>
    </article>
  );
}
