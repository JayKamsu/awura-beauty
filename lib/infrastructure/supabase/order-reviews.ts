import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";

/** Avis client sur un produit acheté, rattaché à une commande précise. */
export type OrderReviewRow = {
  id: string;
  orderId: string;
  productId: string;
  userId: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

function mapReview(row: Record<string, unknown>): OrderReviewRow {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    productId: String(row.product_id),
    userId: row.user_id ? String(row.user_id) : null,
    rating: Number(row.rating ?? 0),
    comment: String(row.comment ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

/** Avis laissés pour une commande donnée (admin/service_role ou client selon le contexte d'appel). */
export async function listReviewsForOrder(
  orderId: string,
): Promise<OrderReviewRow[]> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("order_reviews")
    .select("*")
    .eq("order_id", orderId);

  if (error || !data) return [];
  return data.map((row) => mapReview(row as Record<string, unknown>));
}

/** Avis publiés pour un produit, les plus récents d'abord. */
export async function listReviewsForProduct(
  productId: string,
): Promise<OrderReviewRow[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("order_reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapReview(row as Record<string, unknown>));
}

/** Tous les avis, tous produits confondus (admin, service_role requis). */
export async function listAllReviews(): Promise<OrderReviewRow[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("order_reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapReview(row as Record<string, unknown>));
}

/** Avis enrichi des infos produit (nom, slug, image) pour l'affichage public. */
export type PublicReview = OrderReviewRow & {
  productName: string;
  productSlug: string;
  productImageUrl: string;
};

/** Page publique /avis — RLS autorise la lecture anonyme, sans clé service_role. */
export async function listPublicReviews(limit = 100): Promise<PublicReview[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("order_reviews")
    .select("*, products:product_id(name, slug, image_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data
    .map((row) => {
      const record = row as Record<string, unknown>;
      const product = record.products as
        | { name?: string; slug?: string; image_url?: string }
        | null;
      return {
        ...mapReview(record),
        productName: product?.name ?? "",
        productSlug: product?.slug ?? "",
        productImageUrl: product?.image_url ?? "",
      };
    })
    .filter((review) => review.productSlug);
}

/** Crée ou remplace l'avis d'un client pour un produit d'une commande (un seul avis par couple commande/produit). */
export async function upsertOrderReview(input: {
  orderId: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
}): Promise<OrderReviewRow | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("order_reviews")
    .upsert(
      {
        order_id: input.orderId,
        product_id: input.productId,
        user_id: input.userId,
        rating: input.rating,
        comment: input.comment,
      },
      { onConflict: "order_id,product_id" },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return mapReview(data as Record<string, unknown>);
}
