"use client";

import { ProductCard, type ProductCardData } from "@/components/ui/product-card";

type ProductRailProps = {
  products: ProductCardData[];
  label: string;
};

/**
 * Rail de cartes produits : défilement horizontal sur mobile, grille dès `sm`.
 */
export function ProductRail({ products, label }: ProductRailProps) {
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
