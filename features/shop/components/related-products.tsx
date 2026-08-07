"use client";

import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ui/product-card";
import { toProductCardData } from "@/features/shop/utils/map-product";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

type RelatedProductsProps = {
  products: ProductRow[];
};

export function RelatedProducts({ products }: RelatedProductsProps) {
  const { t } = useTranslation();

  if (products.length === 0) return null;

  return (
    <section className="space-y-8">
      <h2 className="font-serif text-3xl text-primary sm:text-4xl">
        {t("shop.relatedTitle")}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={toProductCardData(product)} />
        ))}
      </div>
    </section>
  );
}
