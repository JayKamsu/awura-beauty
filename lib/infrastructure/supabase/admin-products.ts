import { parseColorVariants } from "@/lib/domain/product-color";
import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import {
  getDemoProducts,
  setDemoProducts,
} from "@/lib/infrastructure/supabase/admin-store";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

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
    short_description: String(row.short_description ?? ""),
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
    stock: Number(row.stock ?? 0),
    shipping_fee: Number(row.shipping_fee ?? 0),
    qr_url: String(row.qr_url ?? ""),
    universe: row.universe === "child" ? "child" : "adult",
    color_variants: parseColorVariants(row.color_variants),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export type ProductInput = Omit<ProductRow, "id" | "created_at"> & {
  id?: string;
};

/** Liste tous les produits côté admin (service_role) ; retombe sur les produits démo si Supabase n'est pas configuré. */
export async function adminListProducts(): Promise<ProductRow[]> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) {
      return data.map((row) => mapRow(row as Record<string, unknown>));
    }
  }
  return getDemoProducts();
}

/** Crée ou met à jour un produit (selon la présence d'un id). Réservé à l'espace admin. */
export async function adminUpsertProduct(
  input: ProductInput,
): Promise<{ product: ProductRow | null; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  const payload: Omit<ProductRow, "id" | "created_at"> = {
    slug: input.slug,
    name: input.name,
    price: input.price,
    compare_at_price:
      input.compare_at_price !== null && input.compare_at_price !== undefined
        ? Number(input.compare_at_price)
        : null,
    description: input.description,
    short_description: input.short_description,
    ingredients: input.ingredients,
    usage: input.usage,
    image_url: input.image_url,
    ingredients_image_url: input.ingredients_image_url,
    lifestyle_image_url: input.lifestyle_image_url,
    category: input.category,
    product_type: input.product_type === "accessory" ? "accessory" : "hair_care",
    is_bundle: Boolean(input.is_bundle),
    is_new: input.is_new,
    stock: input.stock,
    shipping_fee: Number(input.shipping_fee ?? 0),
    qr_url: String(input.qr_url ?? ""),
    universe: input.universe === "child" ? "child" : "adult",
    color_variants: parseColorVariants(input.color_variants),
  };

  if (supabase) {
    if (input.id) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error || !data) {
        return { product: null, error: error?.message ?? "Update failed" };
      }
      return { product: mapRow(data as Record<string, unknown>), error: null };
    }

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("*")
      .maybeSingle();
    if (error || !data) {
      return { product: null, error: error?.message ?? "Insert failed" };
    }
    return { product: mapRow(data as Record<string, unknown>), error: null };
  }

  const products = [...getDemoProducts()];
  if (input.id) {
    const index = products.findIndex((item) => item.id === input.id);
    if (index === -1) return { product: null, error: "Not found" };
    products[index] = { ...products[index], ...payload, id: input.id };
    setDemoProducts(products);
    return { product: products[index], error: null };
  }

  const created: ProductRow = {
    ...payload,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  setDemoProducts([...products, created]);
  return { product: created, error: null };
}

/** Supprime un produit par id. Réservé à l'espace admin. */
export async function adminDeleteProduct(
  id: string,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    return { ok: !error, error: error?.message ?? null };
  }

  setDemoProducts(getDemoProducts().filter((product) => product.id !== id));
  return { ok: true, error: null };
}
