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
    is_new: Boolean(row.is_new),
    stock: Number(row.stock ?? 0),
    shipping_fee: Number(row.shipping_fee ?? 0),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export type ProductInput = Omit<ProductRow, "id" | "created_at"> & {
  id?: string;
};

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

export async function adminUpsertProduct(
  input: ProductInput,
): Promise<{ product: ProductRow | null; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  const payload = {
    slug: input.slug,
    name: input.name,
    price: input.price,
    description: input.description,
    short_description: input.short_description,
    ingredients: input.ingredients,
    usage: input.usage,
    image_url: input.image_url,
    ingredients_image_url: input.ingredients_image_url,
    lifestyle_image_url: input.lifestyle_image_url,
    category: input.category,
    is_new: input.is_new,
    stock: input.stock,
    shipping_fee: Number(input.shipping_fee ?? 0),
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
