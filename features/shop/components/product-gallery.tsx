"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/** Image de galerie produit, avec étiquette optionnelle (produit / ingrédients / lifestyle / couleur). */
export type GalleryImage = {
  src: string;
  alt: string;
  labelKey?:
    | "shop.galleryProduct"
    | "shop.galleryIngredients"
    | "shop.galleryLifestyle"
    | "shop.galleryColor";
};

/** Props de la galerie produit. */
type ProductGalleryProps = {
  images: GalleryImage[];
  /** Image à afficher en premier (photo de la couleur choisie). */
  featuredSrc?: string | null;
};

/** Galerie produit avec image principale et vignettes cliquables (dédoublonne les images par URL). */
export function ProductGallery({ images, featuredSrc }: ProductGalleryProps) {
  const unique = useMemo(
    () =>
      images.filter(
        (item, index, list) =>
          item.src && list.findIndex((entry) => entry.src === item.src) === index,
      ),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (!featuredSrc) return;
    const index = unique.findIndex((item) => item.src === featuredSrc);
    if (index >= 0) setActiveIndex(index);
  }, [featuredSrc, unique]);

  const active = unique[activeIndex] ?? unique[0];
  if (!active) return null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-5">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-background-alt lg:flex-1">
        {unique.map((image, index) => (
          <Image
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`absolute inset-0 object-cover transition-opacity duration-500 ease-out ${
              index === activeIndex
                ? "z-10 opacity-100"
                : "pointer-events-none z-0 opacity-0"
            }`}
          />
        ))}
        {active.labelKey ? (
          <span className="absolute bottom-4 left-4 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium tracking-wide text-primary backdrop-blur-sm">
            {t(active.labelKey)}
          </span>
        ) : null}
      </div>

      {unique.length > 1 ? (
        <div
          className="flex gap-3 overflow-x-auto pb-1 lg:w-24 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label={t("shop.galleryLabel")}
          role="tablist"
        >
          {unique.map((image, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={image.src}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveIndex(index)}
                className={`relative size-20 shrink-0 overflow-hidden rounded-2xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:h-24 lg:w-full ${
                  selected
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100"
                }`}
                aria-label={image.alt}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
