"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

type RelatedProductCtaProps = {
  product: ProductRow;
};

export function RelatedProductCta({ product }: RelatedProductCtaProps) {
  const { t } = useTranslation();

  return (
    <aside className="rounded-[2rem] bg-primary px-6 py-8 text-background md:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-accent-light">
        {t("blog.relatedProduct.eyebrow")}
      </p>
      <h2 className="mt-3 font-serif text-3xl text-accent-light">
        {product.name}
      </h2>
      <p className="mt-3 max-w-xl text-background/85">
        {product.short_description}
      </p>
      <div className="mt-6">
        <Button
          href={`/boutique/${product.slug}`}
          variant="accent-outline"
          className="border-accent-light text-accent-light hover:bg-accent-light/10"
        >
          {t("blog.relatedProduct.cta")}
        </Button>
      </div>
      <p className="mt-4 text-sm text-background/70">
        <Link href={`/boutique/${product.slug}`} className="underline-offset-2 hover:underline">
          {t("blog.relatedProduct.linkLabel", { name: product.name })}
        </Link>
      </p>
    </aside>
  );
}
