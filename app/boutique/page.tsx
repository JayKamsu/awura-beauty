import { ShopFilters } from "@/features/shop/components/shop-filters";
import { ShopPagination } from "@/features/shop/components/shop-pagination";
import { ProductGrid } from "@/features/shop/components/product-grid";
import { toProductCardData } from "@/features/shop/utils/map-product";
import { listProducts } from "@/lib/infrastructure/supabase";
import { listProductCategories } from "@/lib/infrastructure/supabase/product-categories";
import { getSiteBrandSettings } from "@/lib/infrastructure/supabase/site-brand";
import { ShopPageHeader } from "@/features/shop/components/shop-page-header";

type BoutiquePageProps = {
  searchParams: Promise<{
    category?: string;
    page?: string;
    universe?: string;
  }>;
};

/**
 * Page boutique : liste les produits filtrés par catégorie, univers et pagination,
 * en tenant compte des réglages de marque (univers enfant activé ou non).
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

  const [result, categories] = await Promise.all([
    listProducts({
      category: category === "all" ? null : category,
      universe,
      page,
      pageSize: 4,
    }),
    listProductCategories(),
  ]);

  return (
    <main
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-14 md:px-6"
      data-awura-universe={universe === "child" ? "child" : undefined}
    >
      <ShopPageHeader />
      <ShopFilters
        activeCategory={category}
        categories={categories}
        activeUniverse={universe ?? "all"}
        childUniverseEnabled={brand.childUniverseEnabled}
      />
      <ProductGrid products={result.products.map(toProductCardData)} />
      <ShopPagination
        page={result.page}
        totalPages={result.totalPages}
        category={category}
        universe={universe}
      />
    </main>
  );
}
