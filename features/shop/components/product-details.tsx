"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ProductQr } from "@/components/brand/product-qr";
import { useBrandSettings } from "@/components/brand/brand-settings-provider";
import { resolveProductQrTarget } from "@/lib/application/brand/qr";
import { absoluteUrl } from "@/lib/site";
import type { BundleComponent, ProductRow } from "@/lib/infrastructure/supabase/types";

/** Props de la fiche produit. */
type ProductDetailsProps = {
  product: ProductRow;
  /** Slug du tutoriel lié à ce produit (null si aucun) — pilote l'affichage du QR. */
  tutorialSlug: string | null;
  /** Composants inclus si ce produit est une offre promo multi-produits. */
  bundleComponents?: BundleComponent[];
};

function splitIngredients(value: string) {
  return value
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitUsageSteps(value: string) {
  const parts = value
    .split(/[.!?]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (/[.!?]$/.test(item) ? item : `${item}.`));
  return parts.length > 1 ? parts : [value];
}

/** Bénéfices : short_description découpé, sinon description courte. */
function splitBenefits(product: ProductRow): string[] {
  const raw = product.short_description || product.description || "";
  const byDash = raw
    .split(/\s+[–—-]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byDash.length >= 2) return byDash.slice(0, 3);
  const byBullet = raw
    .split(/[•·|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byBullet.length >= 2) return byBullet.slice(0, 3);
  return [raw].filter(Boolean).slice(0, 1);
}

/**
 * Fiche produit charte Awura — 5 blocs :
 * Nom → Bénéfices → Composition → Utilisation → QR/lien
 * (docs/design-system/product-sheet.md)
 */
export function ProductDetails({
  product,
  tutorialSlug,
  bundleComponents = [],
}: ProductDetailsProps) {
  const { t } = useTranslation();
  const { settings } = useBrandSettings();
  const ingredients = splitIngredients(product.ingredients);
  const usageSteps = splitUsageSteps(product.usage);
  const benefits = splitBenefits(product);
  const isAccessory = product.product_type === "accessory";
  const hasManualQrOverride = Boolean(product.qr_url?.trim());
  const showQr = Boolean(tutorialSlug) || hasManualQrOverride;
  const qrTarget = tutorialSlug
    ? absoluteUrl(`/tutoriels/${tutorialSlug}`)
    : resolveProductQrTarget({
        slug: product.slug,
        qrUrl: product.qr_url,
        settings,
      });

  return (
    <section
      className="space-y-10 rounded-[2rem] border border-border bg-background-alt/70 p-6 sm:p-10"
      data-awura-universe={product.universe === "child" ? "child" : undefined}
    >
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          {t("shop.detailsEyebrow")}
        </p>
        <h2 className="font-serif text-3xl text-primary sm:text-4xl">
          {product.name}
        </h2>
        {product.description ? (
          <p className="max-w-prose text-base leading-relaxed text-muted">
            {product.description}
          </p>
        ) : null}
      </header>

      {bundleComponents.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-serif text-2xl text-primary">
            {t("shop.bundleContentsTitle")}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {bundleComponents.map((component) => (
              <li
                key={component.product.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5"
              >
                {component.product.image_url ? (
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-background-alt">
                    <Image
                      src={component.product.image_url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <span className="text-sm text-primary">
                  {component.quantity > 1 ? `${component.quantity}× ` : ""}
                  {component.product.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-serif text-2xl text-primary">
          {t("shop.benefitsTitle")}
        </h3>
        <p className="text-muted">
          {benefits.join(" – ")}
        </p>
      </div>

      {ingredients.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl text-primary">
              {isAccessory ? t("shop.materialTitle") : t("shop.ingredientsTitle")}
            </h3>
            <p className="text-sm text-muted">
              {isAccessory ? t("shop.materialIntro") : t("shop.ingredientsIntro")}
            </p>
            <ul className="flex flex-wrap gap-2">
              {ingredients.map((ingredient) => (
                <li
                  key={ingredient}
                  className="rounded-xl border border-border bg-background px-3.5 py-1.5 text-sm text-primary"
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
          {product.ingredients_image_url ? (
            <div className="relative min-h-[14rem] overflow-hidden rounded-2xl bg-background">
              <Image
                src={product.ingredients_image_url}
                alt={t("shop.ingredientAlt", { name: product.name })}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {usageSteps.length > 0 ? (
        <div className="space-y-5">
          <h3 className="font-serif text-2xl text-primary">
            {isAccessory ? t("shop.howToUseTitle") : t("shop.usageTitle")}
          </h3>
          <ol className="space-y-4">
            {usageSteps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-sm text-primary">
                  {index + 1}
                </span>
                <p className="pt-1 leading-relaxed text-muted">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {showQr ? (
        <div className="rounded-2xl border border-border bg-background p-6">
          <h3 className="font-serif text-2xl text-primary">
            {t("shop.qrTitle")}
          </h3>
          <p className="mt-2 text-sm text-muted">{t("shop.qrBody")}</p>
          <div className="mt-5">
            <ProductQr targetUrl={qrTarget} productName={product.name} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={tutorialSlug ? `/tutoriels/${tutorialSlug}` : "/tutoriels"}
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium uppercase tracking-wide text-background transition hover:bg-primary/90"
            >
              {t("shop.qrTutorials")}
            </Link>
            <Link
              href="/diagnostic-capillaire"
              className="inline-flex min-h-11 items-center rounded-xl border border-primary px-5 text-sm font-medium uppercase tracking-wide text-primary transition hover:bg-primary/10"
            >
              {t("shop.qrDiagnostic")}
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
