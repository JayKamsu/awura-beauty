"use client";

import { ProductCard, type ProductCardData } from "@/components/ui/product-card";

type ProductRailProps = {
  products: ProductCardData[];
  label: string;
  /** Une seule rangée (accueil best-sellers) : rail mobile, tout visible dès `lg`. */
  singleRow?: boolean;
};

/**
 * Rail de cartes produits : défilement horizontal sur mobile, grille dès `sm`.
 */
export function ProductRail({
  products,
  label,
  singleRow = false,
}: ProductRailProps) {
  const railClass = singleRow
    ? "-mx-4 flex flex-nowrap gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 lg:snap-none lg:scroll-px-0"
    : "-mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-8 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none sm:scroll-px-0 md:grid-cols-3 lg:grid-cols-4";
  const itemClass = singleRow
    ? "w-[9.75rem] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:flex-1"
    : "w-[9.75rem] shrink-0 snap-start sm:w-auto sm:min-w-0";

  return (
    <div className={railClass} role="list" aria-label={label}>
      {products.map((product) => (
        <div key={product.id} className={itemClass} role="listitem">
          <ProductCard product={product} compact />
        </div>
      ))}
    </div>
  );
}
