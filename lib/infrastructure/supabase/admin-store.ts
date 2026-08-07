import type { BlogPost } from "@/lib/infrastructure/supabase/blog-types";
import { FALLBACK_POSTS } from "@/lib/infrastructure/supabase/fallback-posts";
import { FALLBACK_PRODUCTS } from "@/lib/infrastructure/supabase/fallback-products";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Store mémoire pour le mode démo (sans Supabase). */
let productsStore: ProductRow[] = FALLBACK_PRODUCTS.map((product) => ({
  ...product,
  stock: product.stock ?? (product.is_new ? 4 : 18),
}));

let postsStore: BlogPost[] = [...FALLBACK_POSTS];

export function getDemoProducts() {
  return productsStore;
}

export function setDemoProducts(products: ProductRow[]) {
  productsStore = products;
}

export function getDemoPosts() {
  return postsStore;
}

export function setDemoPosts(posts: BlogPost[]) {
  postsStore = posts;
}
