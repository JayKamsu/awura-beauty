"use client";

import { useTranslation } from "react-i18next";
import { type ProductCardData } from "@/components/ui/product-card";
import { ProductRail } from "@/components/ui/product-rail";
import {
  isFibreProduct,
  isHelmetProduct,
} from "@/features/shop/utils/map-product";

/** Props de la grille produits. */
type ProductGridProps = {
  products: ProductCardData[];
};

/** Indique si le produit est une fibre, un casque ou un accessoire. */
function isAccessoryOrFibre(product: ProductCardData): boolean {
  return (
    isFibreProduct(product) ||
    product.productType === "accessory" ||
    isHelmetProduct(product)
  );
}

type ShopSectionProps = {
  title: string;
  products: ProductCardData[];
  railLabel: string;
};

/** Section titrée d'une famille de produits (soins, fibres et accessoires). */
function ShopSection({ title, products, railLabel }: ShopSectionProps) {
  if (products.length === 0) return null;
  return (
    <section className="space-y-5">
      <h2 className="font-serif text-2xl text-primary">{title}</h2>
      <ProductRail products={products} label={railLabel} />
    </section>
  );
}

/**
 * Grille de cartes produits pour la boutique. Les soins sont séparés des
 * fibres de bananier et accessoires, regroupés dans une même section.
 */
export function ProductGrid({ products }: ProductGridProps) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted">{t("shop.empty")}</p>
    );
  }

  const accessories = [
    ...products.filter((p) => isFibreProduct(p)),
    ...products.filter((p) => isAccessoryOrFibre(p) && !isFibreProduct(p)),
  ];
  const accessoryIds = new Set(accessories.map((p) => p.id));
  const hairCare = products.filter((p) => !accessoryIds.has(p.id));

  const railLabel = t("shop.productsRail");
  const count = (
    <p className="text-sm text-muted">
      {t("shop.productsCount", { count: products.length })}
    </p>
  );

  if (hairCare.length === 0 || accessories.length === 0) {
    return (
      <div className="space-y-5">
        {count}
        <ProductRail products={products} label={railLabel} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {count}
      <ShopSection
        title={t("shop.groupHairCare")}
        products={hairCare}
        railLabel={railLabel}
      />
      <ShopSection
        title={t("shop.groupFibresAccessories")}
        products={accessories}
        railLabel={railLabel}
      />
    </div>
  );
}
