"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  cmsOr,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";
import { CATALOG } from "@/features/home/data/content";

export function IngredientsSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("ingredients");

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-16 md:px-6">
        <div className="max-w-2xl space-y-4">
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {CATALOG.map((product) => (
            <article key={product.id} className="space-y-3">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-background-alt">
                <Image
                  src={product.ingredientImage}
                  alt={t("home.ingredients.pairAlt", {
                    name: t(product.nameKey),
                  })}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
              </div>
              <h3 className="font-serif text-lg text-primary">
                {t(product.nameKey)}
              </h3>
              <p className="text-sm text-muted">
                {t("home.ingredients.pairLabel", { number: product.number })}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
