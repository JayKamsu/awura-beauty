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

/** Classe un produit : fibre de bananier, accessoire (dont casque), ou soin. */
function accessoryKind(
  product: ProductCardData,
): "fibres" | "other" | null {
  if (isFibreProduct(product)) return "fibres";
  if (product.productType === "accessory" || isHelmetProduct(product)) {
    return "other";
  }
  return null;
}

type ShopSectionProps = {
  title: string;
  products: ProductCardData[];
  railLabel: string;
};

/** Section titrée d'une famille de produits (soins, fibres, accessoires). */
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
 * Grille de cartes produits pour la boutique. Soins, fibres de bananier
 * et accessoires (casque chauffant inclus) sont affichés en sections distinctes.
 */
export function ProductGrid({ products }: ProductGridProps) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted">{t("shop.empty")}</p>
    );
  }

  const fibres = products.filter((p) => accessoryKind(p) === "fibres");
  const accessories = products.filter((p) => accessoryKind(p) === "other");
  const groupedIds = new Set([...fibres, ...accessories].map((p) => p.id));
  const hairCare = products.filter((p) => !groupedIds.has(p.id));

  const sections = [hairCare, fibres, accessories].filter(
    (group) => group.length > 0,
  );
  const showTitles = sections.length > 1 || fibres.length > 0;

  const count = (
    <p className="text-sm text-muted">
      {t("shop.productsCount", { count: products.length })}
    </p>
  );

  const railLabel = t("shop.productsRail");

  if (!showTitles) {
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
        title={t("shop.groupFibres", {
          defaultValue: "Fibres de bananier",
        })}
        products={fibres}
        railLabel={railLabel}
      />
      <ShopSection
        title={t("shop.groupAccessories")}
        products={accessories}
        railLabel={railLabel}
      />
    </div>
  );
}
