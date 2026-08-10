"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format/price";
import type {
  DiagnosticProfile,
  DiagnosticRoutineStep,
  DiagnosticSettings,
} from "@/lib/domain/diagnostic";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

type DiagnosticResultProps = {
  profile: DiagnosticProfile;
  products: ProductRow[];
  routine: DiagnosticRoutineStep[];
  saved: boolean;
  linkedToUser: boolean;
  settings?: DiagnosticSettings | null;
  onRestart: () => void;
};

/** Affiche le profil capillaire, la routine et les produits recommandés à l'issue du diagnostic. */
export function DiagnosticResult({
  profile,
  products,
  routine,
  saved,
  linkedToUser,
  settings,
  onRestart,
}: DiagnosticResultProps) {
  const { t, i18n } = useTranslation();
  const title = profile.title || t(profile.titleKey);
  const summary = profile.summary || t(profile.summaryKey);
  const detailed =
    profile.detailedFeedback?.trim() ||
    summary;
  const processSteps = profile.processSteps ?? [];

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-border">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background-alt to-accent/10"
        />
        <div className="relative space-y-5 p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.18em] text-accent">
            {t("diagnostic.result.eyebrow")}
          </p>
          <h2 className="max-w-2xl font-serif text-3xl text-primary sm:text-5xl">
            {title}
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">
            {detailed}
          </p>
          {settings ? (
            <p className="text-sm text-muted">
              {t("diagnostic.result.onlineValue", {
                price: formatPrice(0, settings.currency, i18n.language),
                compare: formatPrice(
                  settings.onlineCompareCents / 100,
                  settings.currency,
                  i18n.language,
                ),
              })}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs uppercase tracking-wide text-muted"
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
      </section>

      {processSteps.length > 0 ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-serif text-2xl text-primary sm:text-3xl">
              {t("diagnostic.result.processTitle")}
            </h3>
            <p className="text-muted">{t("diagnostic.result.processSubtitle")}</p>
          </div>
          <ol className="space-y-4">
            {processSteps.map((step) => (
              <li
                key={`process-${step.order}`}
                className="space-y-2 rounded-2xl border border-border bg-background-alt/50 p-5"
              >
                <p className="font-medium text-primary">{step.title}</p>
                <p className="text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {routine.length > 0 ? (
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-serif text-2xl text-primary sm:text-3xl">
              {t("diagnostic.result.routineTitle")}
            </h3>
            <p className="text-muted">{t("diagnostic.result.routineSubtitle")}</p>
          </div>
          <ol className="space-y-4">
            {routine.map((step) => (
              <li
                key={`${step.order}-${step.productSlug}`}
                className="grid gap-3 rounded-2xl border border-border bg-background p-5 sm:grid-cols-[auto_1fr]"
              >
                <span className="font-serif text-3xl text-accent">
                  {String(step.order).padStart(2, "0")}
                </span>
                <div className="space-y-2">
                  <p className="font-medium text-primary">{step.title}</p>
                  <p className="text-sm leading-relaxed text-muted">
                    {step.usage}
                  </p>
                  {step.productSlug ? (
                    <Link
                      href={`/boutique/${step.productSlug}`}
                      className="inline-flex text-sm text-accent underline-offset-4 hover:underline"
                    >
                      {t("diagnostic.result.buyProduct")}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="space-y-6">
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
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href="/boutique" size="lg">
          {t("diagnostic.result.shopCta")}
        </Button>
        <Button href="/compte#diagnostics" variant="primary-outline" size="lg">
          {t("diagnostic.result.accountCta")}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={onRestart}>
          {t("diagnostic.result.restart")}
        </Button>
      </div>
    </div>
  );
}
