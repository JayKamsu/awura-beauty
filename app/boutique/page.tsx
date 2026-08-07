import { ShopFilters } from "@/features/shop/components/shop-filters";
import { ShopPagination } from "@/features/shop/components/shop-pagination";
import { ProductGrid } from "@/features/shop/components/product-grid";
import { toProductCardData } from "@/features/shop/utils/map-product";
import { listProducts } from "@/lib/infrastructure/supabase";
import { ShopPageHeader } from "@/features/shop/components/shop-page-header";

type BoutiquePageProps = {
  searchParams: Promise<{ category?: string; page?: string }>;
};

export default async function BoutiquePage({ searchParams }: BoutiquePageProps) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const page = Number(params.page ?? "1") || 1;

  const result = await listProducts({
    category: category === "all" ? null : category,
    page,
    pageSize: 4,
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <ShopPageHeader />
      <ShopFilters activeCategory={category} />
      <ProductGrid products={result.products.map(toProductCardData)} />
      <ShopPagination
        page={result.page}
        totalPages={result.totalPages}
        category={category}
      />
    </main>
  );
}
