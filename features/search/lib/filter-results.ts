import type { ProductCardData } from "@/components/ui/product-card";
import type { BlogPost } from "@/lib/infrastructure/supabase/blog-types";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function matchesQuery(haystack: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return false;
  const tokens = q.split(/\s+/).filter(Boolean);
  const target = normalize(haystack);
  return tokens.every((token) => target.includes(token));
}

/** Filtre les produits dont le nom, la description, la catégorie ou les ingrédients correspondent à la requête (recherche insensible aux accents/casse). */
export function filterProductsByQuery(
  products: ProductRow[],
  query: string,
): ProductRow[] {
  if (!query.trim()) return [];
  return products.filter((product) =>
    matchesQuery(
      [
        product.name,
        product.short_description,
        product.description,
        product.category,
        product.ingredients,
      ].join(" "),
      query,
    ),
  );
}

/** Filtre les articles de blog/tutoriels dont le titre, l'extrait ou le type correspondent à la requête. */
export function filterPostsByQuery(posts: BlogPost[], query: string): BlogPost[] {
  if (!query.trim()) return [];
  return posts.filter((post) =>
    matchesQuery([post.title, post.excerpt, post.kind].join(" "), query),
  );
}

/** Convertit une ligne produit en données de carte produit pour l'affichage des résultats de recherche. */
export function toSearchProductCard(product: ProductRow): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.short_description,
    price: product.price,
    image: product.image_url,
    ingredientImage: product.ingredients_image_url || undefined,
    lifestyleImage: product.lifestyle_image_url,
    isNew: product.is_new,
  };
}
