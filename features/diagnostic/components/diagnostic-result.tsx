"use client";

import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import type { DiagnosticProfile } from "@/lib/infrastructure/supabase/diagnostic-types";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

type DiagnosticResultProps = {
  profile: DiagnosticProfile;
  products: ProductRow[];
  saved: boolean;
  linkedToUser: boolean;
  onRestart: () => void;
};

export function DiagnosticResult({
  profile,
  products,
  saved,
  linkedToUser,
  onRestart,
}: DiagnosticResultProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      <div className="space-y-4 rounded-[2rem] bg-background-alt p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          {t("diagnostic.result.eyebrow")}
        </p>
        <h2 className="font-serif text-3xl text-primary sm:text-4xl">
          {t(profile.titleKey)}
        </h2>
        <p className="max-w-2xl leading-relaxed text-muted">
          {t(profile.summaryKey)}
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted"
            >
              {t(`diagnostic.tags.${tag}`, { defaultValue: tag })}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted">
          {saved
            ? linkedToUser
              ? t("diagnostic.result.savedLinked")
              : t("diagnostic.result.savedAnonymous")
            : t("diagnostic.result.saveFallback")}
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="font-serif text-2xl text-primary sm:text-3xl">
          {t("diagnostic.result.productsTitle")}
        </h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                shortDescription: product.short_description,
                price: product.price,
                image: product.image_url,
                ingredientImage: product.ingredients_image_url,
                lifestyleImage: product.lifestyle_image_url,
                isNew: product.is_new,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href="/boutique" size="lg">
          {t("diagnostic.result.shopCta")}
        </Button>
        <Button type="button" variant="primary-outline" size="lg" onClick={onRestart}>
          {t("diagnostic.result.restart")}
        </Button>
      </div>
    </div>
  );
}
