"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  cmsOr,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";
import { CATALOG } from "@/features/home/data/content";

/**
 * Galerie botanique — compositions plantes / actifs en cercles doux,
 * rythme décalé (esprit maquette Awura).
 */
export function IngredientsSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("ingredients");

  return (
    <section className="overflow-hidden bg-background-alt">
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-accent">
            {cmsOr(cms, "subtitle", t("home.ingredients.eyebrow"))}
          </p>
          <h2 className="font-serif text-3xl text-primary sm:text-4xl">
            {cmsOr(cms, "title", t("home.ingredients.title"))}
          </h2>
          <p className="leading-relaxed text-muted">
            {cmsOr(cms, "body", t("home.ingredients.description"))}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
          {CATALOG.map((product, index) => (
            <article
              key={product.id}
              className={`flex flex-col items-center gap-4 text-center ${
                index % 2 === 1 ? "lg:mt-10" : index % 3 === 2 ? "lg:mt-4" : ""
              }`}
            >
              <div className="relative aspect-square w-full max-w-[11.5rem] overflow-hidden rounded-full bg-background shadow-lg ring-4 ring-background">
                <Image
                  src={product.ingredientImage}
                  alt={t("home.ingredients.pairAlt", {
                    name: t(product.nameKey),
                  })}
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 180px"
                />
              </div>
              <div className="space-y-1 px-1">
                <h3 className="font-serif text-base text-primary sm:text-lg">
                  {t(product.nameKey)}
                </h3>
                <p className="text-xs uppercase tracking-[0.12em] text-muted">
                  {t("home.ingredients.pairLabel", { number: product.number })}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
