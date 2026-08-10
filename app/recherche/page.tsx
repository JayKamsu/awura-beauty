import { SearchPageContent } from "@/features/search/components/search-page-content";
import {
  filterPostsByQuery,
  filterProductsByQuery,
  toSearchProductCard,
} from "@/features/search/lib/filter-results";
import { catalogPort, contentPort } from "@/lib/application/container";

type RecherchePageProps = {
  searchParams: Promise<{ q?: string }>;
};

/** Page "Recherche" : filtre produits et articles du blog selon la requête `q`. */
export default async function RecherchePage({ searchParams }: RecherchePageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  if (!query) {
    return <SearchPageContent query="" products={[]} posts={[]} />;
  }

  const [productsResult, postsResult] = await Promise.all([
    catalogPort.listProducts({ page: 1, pageSize: 100 }),
    contentPort.listBlogPosts(),
  ]);

  const products = filterProductsByQuery(productsResult.products, query).map(
    toSearchProductCard,
  );
  const posts = filterPostsByQuery(postsResult.posts, query);

  return (
    <SearchPageContent query={query} products={products} posts={posts} />
  );
}
