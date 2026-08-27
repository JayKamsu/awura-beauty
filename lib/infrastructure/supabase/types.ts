import type { ProductColorKey } from "@/lib/domain/product-color";

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
  /** Prix barré (avant réduction) affiché à côté du prix courant ; null = pas de réduction. */
  compare_at_price: number | null;
  description: string;
  short_description: string;
  ingredients: string;
  usage: string;
  image_url: string;
  ingredients_image_url: string;
  lifestyle_image_url: string | null;
  category: string;
  /** Groupe de produit : soin capillaire (formules) vs accessoire/fibre (objets). Pilote l'affichage boutique. */
  product_type: "hair_care" | "accessory";
  /** true = ce produit est une offre promo regroupant plusieurs produits (voir bundle_items). */
  is_bundle: boolean;
  is_new: boolean;
  stock: number;
  /** Supplément livraison unitaire (€), hors retrait sur place. */
  shipping_fee: number;
  /** URL QR override (vide = défaut marque admin). */
  qr_url: string;
  /** Univers charte : adult (défaut) | child (pastel). */
  universe: "adult" | "child";
  /** Variantes couleur proposées à l'achat (vide = pas de choix). Stock partagé. */
  color_variants: ProductColorKey[];
  created_at?: string;
};

/** Slugs de catégories produit connus (usage typage strict, distinct de la table dynamique product_categories). */
export type ProductCategory =
  | "hydratation"
  | "demelage"
  | "pousse"
  | "nettoyage"
  | "soin"
  | "routine"
  | "fibres-de-bananier"
  | "casques-chauffants"
  | "accessoires";

/** Tri appliqué à la liste des produits. */
export type ProductSort = "recent" | "price_asc" | "price_desc" | "name_asc";

/** Paramètres de filtrage/pagination pour la liste des produits. */
export type ListProductsParams = {
  category?: string | null;
  universe?: "adult" | "child" | null;
  /** Groupe de produit (soin capillaire / accessoire), null = tous. */
  productType?: "hair_care" | "accessory" | null;
  /** Recherche texte libre (nom, description courte). */
  query?: string | null;
  /** Prix minimum (€), inclusif. */
  minPrice?: number | null;
  /** Prix maximum (€), inclusif. */
  maxPrice?: number | null;
  /** Ne garder que les produits en stock. */
  inStockOnly?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

/** Composant d'un bundle (offre promo multi-produits) : produit inclus + quantité. */
export type BundleComponent = {
  product: ProductRow;
  quantity: number;
};

/** Résultat paginé de listProducts, avec indication de la source (Supabase ou fallback local). */
export type ListProductsResult = {
  products: ProductRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  source: "supabase" | "fallback";
};
