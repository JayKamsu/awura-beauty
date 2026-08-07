"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

type ProductDetailsProps = {
  product: ProductRow;
};

type DetailTab = "description" | "ingredients" | "usage";

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

export function ProductDetails({ product }: ProductDetailsProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<DetailTab>("description");
  const ingredients = splitIngredients(product.ingredients);
  const usageSteps = splitUsageSteps(product.usage);

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: "description", label: t("shop.descriptionTitle") },
    { id: "ingredients", label: t("shop.ingredientsTitle") },
    { id: "usage", label: t("shop.usageTitle") },
  ];

  return (
    <section className="rounded-[2rem] bg-background-alt/70">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[18rem] overflow-hidden rounded-t-[2rem] bg-background-alt sm:min-h-[22rem] lg:min-h-[28rem] lg:rounded-l-[2rem] lg:rounded-tr-none">
          <Image
            src={
              product.ingredients_image_url ||
              product.lifestyle_image_url ||
              product.image_url
            }
            alt={t("shop.ingredientAlt", { name: product.name })}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-5 pt-16 sm:p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-accent">
              {t("shop.detailsEyebrow")}
            </p>
            <p className="mt-1 font-serif text-xl text-primary sm:text-2xl">
              {product.name}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-10">
          <div
            className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label={t("shop.detailsTabsLabel")}
          >
            {tabs.map((item) => {
              const selected = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(item.id)}
                  className={`relative min-h-11 shrink-0 px-3 py-3 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-4 ${
                    selected
                      ? "text-primary"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  {item.label}
                  {selected ? (
                    <span
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex-1 pt-6" role="tabpanel">
            {tab === "description" ? (
              <div className="space-y-4">
                <h2 className="font-serif text-2xl text-primary">
                  {t("shop.descriptionTitle")}
                </h2>
                <p className="max-w-prose text-base leading-relaxed text-muted">
                  {product.description}
                </p>
              </div>
            ) : null}

            {tab === "ingredients" ? (
              <div className="space-y-5">
                <h2 className="font-serif text-2xl text-primary">
                  {t("shop.ingredientsTitle")}
                </h2>
                <p className="text-sm text-muted">{t("shop.ingredientsIntro")}</p>
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
            ) : null}

            {tab === "usage" ? (
              <div className="space-y-5">
                <h2 className="font-serif text-2xl text-primary">
                  {t("shop.usageTitle")}
                </h2>
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
          </div>
        </div>
      </div>
    </section>
  );
}
