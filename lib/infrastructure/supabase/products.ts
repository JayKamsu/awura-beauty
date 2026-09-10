import { GAMME_COMPLETE_SLUG } from "@/lib/domain/bundle";
import { parseColorImages, parseColorVariants } from "@/lib/domain/product-color";
import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";
import { FALLBACK_PRODUCTS } from "@/lib/infrastructure/supabase/fallback-products";
import { getBundleComponents } from "@/lib/infrastructure/supabase/bundles";
import type {
  BundleComponent,
  ListProductsParams,
  ListProductsResult,
  ProductRow,
} from "@/lib/infrastructure/supabase/types";

const DEFAULT_PAGE_SIZE = 4;

/** Best-sellers accueil : ordre d'affichage, avec alias de slug / nom. */
const HOME_BESTSELLER_SLOTS = [
  {
    slugs: ["nutrition-royale", "creme-nutrition-royale"],
    names: ["nutrition royale"],
  },
  {
    slugs: ["savon-solide", "shampooing-solide"],
    names: ["shampooing solide", "savon solide"],
  },
  {
    slugs: ["demelant-nourrissant"],
    names: ["demelant nourrissant"],
  },
  {
    slugs: ["fibre-bananier-naturelle"],
    names: ["fibre de bananier"],
  },
  {
    slugs: [GAMME_COMPLETE_SLUG],
    names: ["gamme complete"],
  },
] as const;

/** Normalise un libellé catalogue pour comparer slug et nom (accents ignorés). */
function normalizeCatalogText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Sélectionne les best-sellers dans l'ordre de la page d'accueil. */
function pickHomeBestsellers(products: ProductRow[]): ProductRow[] {
  const used = new Set<string>();
  const picked: ProductRow[] = [];

  for (const slot of HOME_BESTSELLER_SLOTS) {
    const match = products.find((product) => {
      if (used.has(product.id)) return false;
      if ((slot.slugs as readonly string[]).includes(product.slug)) return true;
      const name = normalizeCatalogText(product.name);
      return slot.names.some((fragment) =>
        name.includes(normalizeCatalogText(fragment)),
      );
    });
    if (match) {
      used.add(match.id);
      picked.push(match);
    }
  }

  return picked;
}

function paginate(
  products: ProductRow[],
  page: number,
  pageSize: number,
  source: ListProductsResult["source"],
): ListProductsResult {
  const safePage = Math.max(1, page);
  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    products: products.slice(start, start + pageSize),
    total,
    page: currentPage,
    pageSize,
    totalPages,
    source,
  };
}

function sortProducts(
  products: ProductRow[],
  sort?: ListProductsParams["sort"],
): ProductRow[] {
  const list = [...products];
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    case "name_asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list;
  }
}

function filterFallback(params: ListProductsParams) {
  const { category, universe, productType, query, minPrice, maxPrice, inStockOnly, sort } =
    params;
  let list = FALLBACK_PRODUCTS.filter((product) => product.is_active);
  if (category && category !== "all") {
    list = list.filter((product) =>
      category === "accessoires"
        ? product.category === "accessoires" ||
          product.category === "casques-chauffants" ||
          product.category === "fibres-de-bananier"
        : product.category === category,
    );
  }
  if (universe === "adult" || universe === "child") {
    list = list.filter((product) => product.universe === universe);
  }
  if (productType) {
    list = list.filter((product) => product.product_type === productType);
  }
  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.short_description.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q),
    );
  }
  if (typeof minPrice === "number") {
    list = list.filter((product) => product.price >= minPrice);
  }
  if (typeof maxPrice === "number") {
    list = list.filter((product) => product.price <= maxPrice);
  }
  if (inStockOnly) {
    list = list.filter((product) => product.stock > 0);
  }
  return sortProducts(list, sort);
}

function mapRow(row: Record<string, unknown>): ProductRow {
  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    name: String(row.name ?? ""),
    price: Number(row.price ?? 0),
    compare_at_price:
      row.compare_at_price !== null && row.compare_at_price !== undefined
        ? Number(row.compare_at_price)
        : null,
    description: String(row.description ?? ""),
    short_description: String(row.short_description ?? row.description ?? ""),
    ingredients: String(row.ingredients ?? ""),
    usage: String(row.usage ?? ""),
    image_url: String(row.image_url ?? ""),
    ingredients_image_url: String(row.ingredients_image_url ?? ""),
    lifestyle_image_url: row.lifestyle_image_url
      ? String(row.lifestyle_image_url)
      : null,
    category: String(row.category ?? "soin"),
    product_type: row.product_type === "accessory" ? "accessory" : "hair_care",
    is_bundle: Boolean(row.is_bundle),
    is_new: Boolean(row.is_new),
    is_active: row.is_active !== false,
    stock: Number(row.stock ?? 0),
    shipping_fee: Number(row.shipping_fee ?? 0),
    qr_url: String(row.qr_url ?? ""),
    universe: row.universe === "child" ? "child" : "adult",
    color_variants: parseColorVariants(row.color_variants),
    color_images: parseColorImages(row.color_images),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

/** Liste paginée des produits avec filtres catégorie/univers/recherche/prix/stock/tri.
 *  Sans Supabase (local sans env) : catalogue de démo. Dès que Supabase est configuré,
 *  on ne retombe jamais sur ce catalogue fantôme — les modifications admin sont la source. */
export async function listProducts(
  params: ListProductsParams = {},
): Promise<ListProductsResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const { category, universe, productType, query: search, minPrice, maxPrice, inStockOnly, sort } =
    params;

  const supabase = createSupabaseClient();
  if (!supabase) {
    return paginate(filterFallback(params), page, pageSize, "fallback");
  }

  let query = supabase.from("products").select("*", { count: "exact" }).eq("is_active", true);

  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else if (sort === "name_asc") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: true });
  }

  if (category && category !== "all") {
    query =
      category === "accessoires"
        ? query.in("category", [
            "accessoires",
            "casques-chauffants",
            "fibres-de-bananier",
          ])
        : query.eq("category", category);
  }
  if (universe === "adult" || universe === "child") {
    query = query.eq("universe", universe);
  }
  if (productType) {
    query = query.eq("product_type", productType);
  }
  if (search?.trim()) {
    const escaped = search.trim().replace(/[%_]/g, (m) => `\\${m}`);
    query = query.or(
      `name.ilike.%${escaped}%,short_description.ilike.%${escaped}%,description.ilike.%${escaped}%`,
    );
  }
  if (typeof minPrice === "number") {
    query = query.gte("price", minPrice);
  }
  if (typeof maxPrice === "number") {
    query = query.lte("price", maxPrice);
  }
  if (inStockOnly) {
    query = query.gt("stock", 0);
  }

  const from = (Math.max(1, page) - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("[catalog] listProducts", error.message);
    return {
      products: [],
      total: 0,
      page: Math.max(1, page),
      pageSize,
      totalPages: 1,
      source: "supabase",
    };
  }

  const rows = data ?? [];
  const total = count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  return {
    products: rows.map((row) => mapRow(row as Record<string, unknown>)),
    total,
    page: Math.min(Math.max(1, page), totalPages),
    pageSize,
    totalPages,
    source: "supabase",
  };
}

/** Récupère un produit par slug (Supabase si configuré, sinon catalogue local) ; pour la Gamme Complète, le stock affiché est le minimum des composants. */
export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const supabase = createSupabaseClient();
  let product: ProductRow | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("[catalog] getProductBySlug", error.message);
      return null;
    }
    if (data) {
      product = mapRow(data as Record<string, unknown>);
    }
  } else {
    product = FALLBACK_PRODUCTS.find((row) => row.slug === slug) ?? null;
  }

  if (!product || !product.is_active) return null;

  if (product.is_bundle) {
    const components = await getBundleComponents(product.id);
    if (components.length > 0) {
      product = {
        ...product,
        stock: Math.min(
          ...components.map((c: BundleComponent) =>
            Math.floor(c.product.stock / c.quantity),
          ),
        ),
      };
    }
  }

  return product;
}

/** Produits liés : même catégorie en priorité, sinon n'importe quels autres produits en complément. */
export async function getRelatedProducts(
  product: ProductRow,
  limit = 4,
): Promise<ProductRow[]> {
  const supabase = createSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .neq("id", product.id)
      .eq("category", product.category)
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map((row) => mapRow(row as Record<string, unknown>));
    }

    const { data: others } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .neq("id", product.id)
      .limit(limit);

    if (others && others.length > 0) {
      return others.map((row) => mapRow(row as Record<string, unknown>));
    }
    return [];
  }

  const sameCategory = FALLBACK_PRODUCTS.filter(
    (item) =>
      item.is_active && item.id !== product.id && item.category === product.category,
  );
  if (sameCategory.length > 0) return sameCategory.slice(0, limit);

  return FALLBACK_PRODUCTS.filter(
    (item) => item.is_active && item.id !== product.id,
  ).slice(0, limit);
}

/** Tous les slugs produits (génération de routes), Supabase si configuré sinon catalogue local. */
export async function listAllProductSlugs(): Promise<string[]> {
  const supabase = createSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("slug")
      .eq("is_active", true);
    if (error) {
      console.error("[catalog] listAllProductSlugs", error.message);
      return [];
    }
    return (data ?? []).map((row) => String((row as { slug: string }).slug));
  }
  return FALLBACK_PRODUCTS.filter((product) => product.is_active).map(
    (product) => product.slug,
  );
}

/** Récupère plusieurs produits par slugs, en conservant l'ordre demandé. */
export async function getProductsBySlugs(
  slugs: string[],
): Promise<ProductRow[]> {
  if (slugs.length === 0) return [];

  const supabase = createSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("slug", slugs);

    if (error) {
      console.error("[catalog] getProductsBySlugs", error.message);
      return [];
    }
    const mapped = (data ?? [])
      .map((row) => mapRow(row as Record<string, unknown>))
      .filter((product) => product.is_active);
    return slugs
      .map((slug) => mapped.find((product) => product.slug === slug))
      .filter(Boolean) as ProductRow[];
  }

  return slugs
    .map((slug) =>
      FALLBACK_PRODUCTS.find((product) => product.slug === slug && product.is_active),
    )
    .filter(Boolean) as ProductRow[];
}

/** Récupère plusieurs produits par ids, en conservant l'ordre demandé (ex. hydratation des favoris). */
export async function getProductsByIds(ids: string[]): Promise<ProductRow[]> {
  if (ids.length === 0) return [];

  const supabase = createSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from("products").select("*").in("id", ids);

    if (error) {
      console.error("[catalog] getProductsByIds", error.message);
      return [];
    }
    const mapped = (data ?? [])
      .map((row) => mapRow(row as Record<string, unknown>))
      .filter((product) => product.is_active);
    return ids
      .map((id) => mapped.find((product) => product.id === id))
      .filter(Boolean) as ProductRow[];
  }

  return ids
    .map((id) =>
      FALLBACK_PRODUCTS.find((product) => product.id === id && product.is_active),
    )
    .filter(Boolean) as ProductRow[];
}

/** Best-sellers de la page d'accueil, dans l'ordre crème / shampoing / démêlant / fibre / gamme complète. */
export async function listHomeBestsellers(): Promise<ProductRow[]> {
  const slugs = HOME_BESTSELLER_SLOTS.flatMap((slot) => [...slot.slugs]);
  const bySlug = await getProductsBySlugs(slugs);
  const picked = pickHomeBestsellers(bySlug);
  if (picked.length === HOME_BESTSELLER_SLOTS.length) return picked;

  const { products } = await listProducts({ page: 1, pageSize: 100 });
  const seen = new Set(bySlug.map((product) => product.id));
  return pickHomeBestsellers([
    ...bySlug,
    ...products.filter((product) => !seen.has(product.id)),
  ]);
}
