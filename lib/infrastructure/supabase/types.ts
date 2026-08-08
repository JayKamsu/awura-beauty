/**
 * Shape alignée sur la table Supabase `products`.
 *
 * Colonnes demandées : name, price, description, ingredients, image_url, ingredients_image_url
 * Colonnes utiles boutique : slug, category, short_description, usage, lifestyle_image_url, is_new
 */
export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  short_description: string;
  ingredients: string;
  usage: string;
  image_url: string;
  ingredients_image_url: string;
  lifestyle_image_url: string | null;
  category: string;
  is_new: boolean;
  stock: number;
  /** Supplément livraison unitaire (€), hors retrait sur place. */
  shipping_fee: number;
  created_at?: string;
};

export type ProductCategory =
  | "hydratation"
  | "demelage"
  | "pousse"
  | "nettoyage"
  | "soin";

export type ListProductsParams = {
  category?: string | null;
  page?: number;
  pageSize?: number;
};

export type ListProductsResult = {
  products: ProductRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  source: "supabase" | "fallback";
};
