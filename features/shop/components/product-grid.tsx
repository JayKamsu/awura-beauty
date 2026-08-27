"use client";

import { useTranslation } from "react-i18next";
import { ProductCard, type ProductCardData } from "@/components/ui/product-card";

const FIBRES_CATEGORY = "fibres-de-bananier";
const HELMETS_CATEGORY = "casques-chauffants";
const HELMET_SLUG = "casque-chauffant";

/** Props de la grille produits. */
type ProductGridProps = {
  products: ProductCardData[];
};

type AccessoryKind = "fibres" | "helmets" | "other";

/** Classe un accessoire : fibres de bananier, casques chauffants, ou autres. */
function accessoryKind(product: ProductCardData): AccessoryKind | null {
  if (product.productType !== "accessory") return null;
  if (product.category === FIBRES_CATEGORY) return "fibres";
  if (product.category === HELMETS_CATEGORY || product.slug === HELMET_SLUG) {
    return "helmets";
  }
  return "other";
}

function Grid({
  products,
  label,
}: {
  products: ProductCardData[];
  label: string;
}) {
  return (
    <div
      className="-mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-8 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none sm:scroll-px-0 md:grid-cols-3 lg:grid-cols-4"
      role="list"
      aria-label={label}
    >
      {products.map((product) => (
        <div
          key={product.id}
          className="w-[9.75rem] shrink-0 snap-start sm:w-auto sm:min-w-0"
          role="listitem"
        >
          <ProductCard product={product} compact />
        </div>
      ))}
    </div>
  );
}

type ShopSectionProps = {
  title: string;
  badge?: string;
  products: ProductCardData[];
  railLabel: string;
};

/** Section titrée d'une famille de produits (soins, fibres, casques, accessoires). */
function ShopSection({ title, badge, products, railLabel }: ShopSectionProps) {
  if (products.length === 0) return null;
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-serif text-2xl text-primary">{title}</h2>
        {badge ? (
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-accent">
            {badge}
          </span>
        ) : null}
      </div>
      <Grid products={products} label={railLabel} />
    </section>
  );
}

/**
 * Grille de cartes produits pour la boutique. Soins, fibres de bananier,
 * casques chauffants et autres accessoires sont affichés en sections distinctes.
 */
export function ProductGrid({ products }: ProductGridProps) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-muted">{t("shop.empty")}</p>
    );
  }

  const hairCare = products.filter((p) => p.productType !== "accessory");
  const fibres = products.filter((p) => accessoryKind(p) === "fibres");
  const helmets = products.filter((p) => accessoryKind(p) === "helmets");
  const otherAccessories = products.filter((p) => accessoryKind(p) === "other");

  const sections = [hairCare, fibres, helmets, otherAccessories].filter(
    (group) => group.length > 0,
  );
  const showTitles =
    sections.length > 1 || fibres.length > 0 || helmets.length > 0;

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
        <Grid products={products} label={railLabel} />
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
        badge={t("shop.accessoryBadge")}
        products={fibres}
        railLabel={railLabel}
      />
      <ShopSection
        title={t("shop.groupHelmets", {
          defaultValue: "Casques chauffants",
        })}
        badge={t("shop.accessoryBadge")}
        products={helmets}
        railLabel={railLabel}
      />
      <ShopSection
        title={t("shop.groupAccessories")}
        badge={t("shop.accessoryBadge")}
        products={otherAccessories}
        railLabel={railLabel}
      />
    </div>
  );
}
