"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import {
  cmsOr,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";
import { BESTSELLERS } from "@/features/home/data/content";

export function BestsellersSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("bestsellers");

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-16 md:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="font-serif text-3xl text-primary sm:text-4xl">
              {cmsOr(cms, "title", t("home.bestsellers.title"))}
            </h2>
            <p className="text-muted">
              {cmsOr(cms, "subtitle", t("home.bestsellers.subtitle"))}
            </p>
          </div>
          <Button href="/boutique" variant="primary-outline" size="md">
            {cmsOr(cms, "cta_label", t("home.bestsellers.seeAll"))}
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {BESTSELLERS.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                slug: product.id,
                name: t(product.nameKey),
                shortDescription: t(product.descriptionKey),
                price: product.price,
                image: product.image,
                ingredientImage: product.ingredientImage,
                lifestyleImage: product.lifestyleImage,
                isNew: product.isNew,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
