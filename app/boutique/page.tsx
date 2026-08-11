import { ShopFiltersBar } from "@/features/shop/components/shop-filters-bar";
import { ShopPagination } from "@/features/shop/components/shop-pagination";
import { ProductGrid } from "@/features/shop/components/product-grid";
import { toProductCardData } from "@/features/shop/utils/map-product";
import { listProducts } from "@/lib/infrastructure/supabase";
import { listProductCategories } from "@/lib/infrastructure/supabase/product-categories";
import { getSiteBrandSettings } from "@/lib/infrastructure/supabase/site-brand";
import { ShopPageHeader } from "@/features/shop/components/shop-page-header";
import type { ProductSort } from "@/lib/infrastructure/supabase/types";

const VALID_SORTS: ProductSort[] = ["recent", "price_asc", "price_desc", "name_asc"];

type BoutiquePageProps = {
  searchParams: Promise<{
    category?: string;
    page?: string;
    universe?: string;
    q?: string;
    min?: string;
    max?: string;
    inStock?: string;
    sort?: string;
  }>;
};

/**
 * Page boutique : liste les produits filtrés par catégorie, univers, recherche,
 * prix et stock, avec tri et pagination — tient compte des réglages de marque
 * (univers enfant activé ou non).
 */
export default async function BoutiquePage({ searchParams }: BoutiquePageProps) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const page = Number(params.page ?? "1") || 1;
  const brand = await getSiteBrandSettings();
  const universeParam = params.universe;
  const universe =
    brand.childUniverseEnabled &&
    (universeParam === "adult" || universeParam === "child")
      ? universeParam
      : null;
  const query = params.q?.trim() ?? "";
  const minPrice = params.min?.trim() ?? "";
  const maxPrice = params.max?.trim() ?? "";
  const inStockOnly = params.inStock === "1";
  const sort: ProductSort = VALID_SORTS.includes(params.sort as ProductSort)
    ? (params.sort as ProductSort)
    : "recent";

  const [result, categories] = await Promise.all([
    listProducts({
      category: category === "all" ? null : category,
      universe,
      query: query || null,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      inStockOnly,
      sort,
      page,
      pageSize: 8,
    }),
    listProductCategories(),
  ]);

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-14 md:px-6"
      data-awura-universe={universe === "child" ? "child" : undefined}
    >
      <ShopPageHeader />
      <ShopFiltersBar
        activeCategory={category}
        categories={categories}
        activeUniverse={universe ?? "all"}
        childUniverseEnabled={brand.childUniverseEnabled}
        query={query}
        minPrice={minPrice}
        maxPrice={maxPrice}
        inStockOnly={inStockOnly}
        sort={sort}
      />
      <ProductGrid products={result.products.map(toProductCardData)} />
      <ShopPagination
        page={result.page}
        totalPages={result.totalPages}
        extraParams={{
          category: category !== "all" ? category : null,
          universe,
          q: query || null,
          min: minPrice || null,
          max: maxPrice || null,
          inStock: inStockOnly ? "1" : null,
          sort: sort !== "recent" ? sort : null,
        }}
      />
    </main>
  );
}
