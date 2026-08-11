"use client";

import { useTranslation } from "react-i18next";
import { ProductCard, type ProductCardData } from "@/components/ui/product-card";

/** Props de la grille produits. */
type ProductGridProps = {
  products: ProductCardData[];
};

function Grid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/**
 * Grille de cartes produits pour la boutique. Quand le résultat mélange soins
 * capillaires et accessoires/fibres, les deux groupes sont affichés en sections
 * distinctes pour bien les différencier visuellement.
 */
export function ProductGrid({ products }: ProductGridProps) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted">{t("shop.empty")}</p>
    );
  }

  const hairCare = products.filter((p) => p.productType !== "accessory");
  const accessories = products.filter((p) => p.productType === "accessory");

  if (hairCare.length === 0 || accessories.length === 0) {
    return <Grid products={products} />;
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-primary">
          {t("shop.groupHairCare")}
        </h2>
        <Grid products={hairCare} />
      </section>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-2xl text-primary">
            {t("shop.groupAccessories")}
          </h2>
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-accent">
            {t("shop.accessoryBadge")}
          </span>
        </div>
        <Grid products={accessories} />
      </section>
    </div>
  );
}
