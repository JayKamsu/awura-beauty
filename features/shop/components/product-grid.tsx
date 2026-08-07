"use client";

import { useTranslation } from "react-i18next";
import { ProductCard, type ProductCardData } from "@/components/ui/product-card";

type ProductGridProps = {
  products: ProductCardData[];
};

export function ProductGrid({ products }: ProductGridProps) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted">{t("shop.empty")}</p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
