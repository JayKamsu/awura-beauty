import { parseColorVariants } from "@/lib/domain/product-color";
import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";
import type { BundleComponent, ProductRow } from "@/lib/infrastructure/supabase/types";

function mapProductRow(row: Record<string, unknown>): ProductRow {
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
    stock: Number(row.stock ?? 0),
    shipping_fee: Number(row.shipping_fee ?? 0),
    qr_url: String(row.qr_url ?? ""),
    universe: row.universe === "child" ? "child" : "adult",
    color_variants: parseColorVariants(row.color_variants),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

/** Composants (produits + quantités) d'un bundle, triés par position ; liste vide si le produit n'est pas un bundle ou si Supabase est indisponible. */
export async function getBundleComponents(
  bundleProductId: string,
): Promise<BundleComponent[]> {
  const supabase = createSupabaseClient() ?? createAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("bundle_items")
    .select("quantity, position, component:component_product_id(*)")
    .eq("bundle_product_id", bundleProductId)
    .order("position", { ascending: true });

  if (error || !data) return [];

  return (data as unknown as Array<Record<string, unknown>>)
    .filter((row) => row.component)
    .map((row) => ({
      product: mapProductRow(row.component as Record<string, unknown>),
      quantity: Number(row.quantity ?? 1),
    }));
}

/** Remplace intégralement les composants d'un bundle (admin, service_role requis). */
export async function adminSetBundleComponents(
  bundleProductId: string,
  components: Array<{ productId: string; quantity: number }>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return { ok: false, error: "Supabase admin client unavailable" };

  const { error: deleteError } = await supabase
    .from("bundle_items")
    .delete()
    .eq("bundle_product_id", bundleProductId);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (components.length === 0) return { ok: true };

  const payload = components.map((component, index) => ({
    bundle_product_id: bundleProductId,
    component_product_id: component.productId,
    quantity: Math.max(1, Math.floor(component.quantity) || 1),
    position: index,
  }));

  const { error: insertError } = await supabase.from("bundle_items").insert(payload);
  if (insertError) return { ok: false, error: insertError.message };

  return { ok: true };
}
