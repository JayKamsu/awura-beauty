import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";
import { FALLBACK_PRODUCTS } from "@/lib/infrastructure/supabase/fallback-products";
import type {
  ListProductsParams,
  ListProductsResult,
  ProductRow,
} from "@/lib/infrastructure/supabase/types";

const DEFAULT_PAGE_SIZE = 4;

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

function filterFallback(category?: string | null) {
  if (!category || category === "all") return FALLBACK_PRODUCTS;
  return FALLBACK_PRODUCTS.filter((product) => product.category === category);
}

function mapRow(row: Record<string, unknown>): ProductRow {
  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    name: String(row.name ?? ""),
    price: Number(row.price ?? 0),
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
    is_new: Boolean(row.is_new),
    stock: Number(row.stock ?? 0),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export async function listProducts(
  params: ListProductsParams = {},
): Promise<ListProductsResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const category = params.category;

  const supabase = createSupabaseClient();
  if (!supabase) {
    return paginate(filterFallback(category), page, pageSize, "fallback");
  }

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: true });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const from = (Math.max(1, page) - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return paginate(filterFallback(category), page, pageSize, "fallback");
  }

  // Table vide / non seedée → fallback local
  if ((count === 0 || !data) && (!category || category === "all") && page <= 1) {
    return paginate(filterFallback(category), page, pageSize, "fallback");
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

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  const supabase = createSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && data) {
      return mapRow(data as Record<string, unknown>);
    }
  }

  return FALLBACK_PRODUCTS.find((product) => product.slug === slug) ?? null;
}

export async function getRelatedProducts(
  product: ProductRow,
  limit = 4,
): Promise<ProductRow[]> {
  const supabase = createSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .neq("id", product.id)
      .eq("category", product.category)
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map((row) => mapRow(row as Record<string, unknown>));
    }

    const { data: others } = await supabase
      .from("products")
      .select("*")
      .neq("id", product.id)
      .limit(limit);

    if (others && others.length > 0) {
      return others.map((row) => mapRow(row as Record<string, unknown>));
    }
  }

  const sameCategory = FALLBACK_PRODUCTS.filter(
    (item) => item.id !== product.id && item.category === product.category,
  );
  if (sameCategory.length > 0) return sameCategory.slice(0, limit);

  return FALLBACK_PRODUCTS.filter((item) => item.id !== product.id).slice(0, limit);
}

export async function listAllProductSlugs(): Promise<string[]> {
  const supabase = createSupabaseClient();
  if (supabase) {
    const { data } = await supabase.from("products").select("slug");
    if (data && data.length > 0) {
      return data.map((row) => String((row as { slug: string }).slug));
    }
  }
  return FALLBACK_PRODUCTS.map((product) => product.slug);
}

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

    if (!error && data && data.length > 0) {
      const mapped = data.map((row) => mapRow(row as Record<string, unknown>));
      return slugs
        .map((slug) => mapped.find((product) => product.slug === slug))
        .filter(Boolean) as ProductRow[];
    }
  }

  return slugs
    .map((slug) => FALLBACK_PRODUCTS.find((product) => product.slug === slug))
    .filter(Boolean) as ProductRow[];
}
