import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";
import { getCurrentUserId } from "@/lib/infrastructure/supabase/auth";
import type {
  OrderItem,
  OrderRow,
  PaymentMethod,
  ShippingCarrier,
  ShippingStatus,
} from "@/lib/infrastructure/supabase/order-types";

function mapOrder(row: Record<string, unknown>): OrderRow {
  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    email: String(row.email ?? ""),
    status: row.status as OrderRow["status"],
    payment_method: row.payment_method as PaymentMethod,
    payment_status: String(row.payment_status ?? "pending"),
    shipping_status: (row.shipping_status as ShippingStatus) ?? "preparing",
    shipping_carrier: (row.shipping_carrier as ShippingCarrier) ?? null,
    tracking_number: row.tracking_number ? String(row.tracking_number) : null,
    label_url: row.label_url ? String(row.label_url) : null,
    label_path: row.label_path ? String(row.label_path) : null,
    relay_point_id: row.relay_point_id ? String(row.relay_point_id) : null,
    shipping_fee: Number(row.shipping_fee ?? 0),
    points_earned: Number(row.points_earned ?? 0),
    points_redeemed: Number(row.points_redeemed ?? 0),
    discount_amount: Number(row.discount_amount ?? 0),
    referral_discount_applied: Boolean(row.referral_discount_applied),
    total: Number(row.total ?? 0),
    currency: String(row.currency ?? "EUR"),
    items: (row.items as OrderItem[]) ?? [],
    shipping_address:
      (row.shipping_address as OrderRow["shipping_address"]) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    received_at: row.received_at ? String(row.received_at) : null,
  };
}

/** Données nécessaires à la création d'une commande, avant paiement. */
export type CreateOrderInput = {
  email: string;
  paymentMethod: PaymentMethod;
  currency: string;
  items: OrderItem[];
  shippingAddress: NonNullable<OrderRow["shipping_address"]>;
  paymentStatus?: string;
  status?: OrderRow["status"];
  relayPointId?: string | null;
  shippingCarrier?: ShippingCarrier | null;
  shippingFee?: number;
  /** Total TTC (produits + livraison). Si omis : somme items + shippingFee. */
  total?: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  discountAmount?: number;
  referralDiscountApplied?: boolean;
  /** Préférer userId issu du Bearer côté API (pas de session cookie serveur). */
  userId?: string | null;
};

/** Crée une commande en statut "pending" (Stripe/PayPal ont besoin de l'ID de commande avant paiement pour le webhook). */
export async function createOrder(
  input: CreateOrderInput,
): Promise<{ order: OrderRow | null; error: string | null }> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  const userId =
    input.userId !== undefined ? input.userId : await getCurrentUserId();
  const itemsTotal = input.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const shippingFee = Math.max(0, Number(input.shippingFee ?? 0));
  const total =
    input.total !== undefined
      ? Number(input.total)
      : Math.round((itemsTotal + shippingFee) * 100) / 100;

  if (!supabase) {
    return { order: null, error: "Supabase is not configured" };
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      email: input.email,
      status: input.status ?? "pending",
      payment_method: input.paymentMethod,
      payment_status: input.paymentStatus ?? "pending",
      shipping_status: "preparing",
      shipping_carrier: input.shippingCarrier ?? null,
      relay_point_id: input.relayPointId ?? null,
      shipping_fee: shippingFee,
      points_earned: Math.max(0, Math.floor(Number(input.pointsEarned ?? 0))),
      points_redeemed: Math.max(
        0,
        Math.floor(Number(input.pointsRedeemed ?? 0)),
      ),
      discount_amount: Math.max(0, Number(input.discountAmount ?? 0)),
      referral_discount_applied: Boolean(input.referralDiscountApplied),
      total,
      currency: input.currency,
      items: input.items,
      shipping_address: input.shippingAddress,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { order: null, error: error?.message ?? "Unable to create order" };
  }

  return { order: mapOrder(data as Record<string, unknown>), error: null };
}

/** Met à jour brutalement le statut de paiement d'une commande (admin, service_role requis) — préférer claimOrderPaid pour un passage à "paid" idempotent. */
export async function updateOrderPayment(
  orderId: string,
  payload: {
    paymentStatus: string;
    status: OrderRow["status"];
  },
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: payload.paymentStatus,
      status: payload.status,
    })
    .eq("id", orderId);

  return !error;
}

/**
 * Passe la commande en payée seulement si elle ne l’est pas déjà.
 * Retourne true uniquement sur la première transition (anti double notif / webhook+confirm).
 */
export async function claimOrderPaid(orderId: string): Promise<{
  claimed: boolean;
  alreadyPaid: boolean;
  order: OrderRow | null;
}> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { claimed: false, alreadyPaid: false, order: null };
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "paid",
    })
    .eq("id", orderId)
    .neq("payment_status", "paid")
    .select("*")
    .maybeSingle();

  if (!error && data) {
    return {
      claimed: true,
      alreadyPaid: false,
      order: mapOrder(data as Record<string, unknown>),
    };
  }

  const current = await getOrderById(orderId);
  const alreadyPaid = Boolean(
    current &&
      (current.payment_status === "paid" || current.status === "paid"),
  );
  return { claimed: false, alreadyPaid, order: current };
}

/** Met à jour le suivi d'expédition d'une commande ; passe automatiquement le statut commande à "processing" dès que l'expédition démarre. */
export async function updateOrderShipping(
  orderId: string,
  payload: {
    shippingStatus: ShippingStatus;
    shippingCarrier?: ShippingCarrier | null;
    trackingNumber?: string | null;
    labelUrl?: string | null;
    labelPath?: string | null;
    relayPointId?: string | null;
  },
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("orders")
    .update({
      shipping_status: payload.shippingStatus,
      ...(payload.shippingCarrier !== undefined
        ? { shipping_carrier: payload.shippingCarrier }
        : {}),
      ...(payload.trackingNumber !== undefined
        ? { tracking_number: payload.trackingNumber }
        : {}),
      ...(payload.labelUrl !== undefined ? { label_url: payload.labelUrl } : {}),
      ...(payload.labelPath !== undefined
        ? { label_path: payload.labelPath }
        : {}),
      ...(payload.relayPointId !== undefined
        ? { relay_point_id: payload.relayPointId }
        : {}),
      ...(payload.shippingStatus !== "preparing"
        ? { status: "processing" }
        : {}),
    })
    .eq("id", orderId);

  return !error;
}

/**
 * Ajoute un événement à l'historique de suivi transporteur (jsonb append)
 * et met à jour la date de dernière synchro. Utilisé par le cron de sync.
 */
export async function appendCarrierStatusEvent(
  orderId: string,
  event: { date: string; code: string; label: string; status: ShippingStatus },
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;

  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("carrier_status_history")
    .eq("id", orderId)
    .maybeSingle();

  if (readError) return false;

  const history = Array.isArray(current?.carrier_status_history)
    ? (current!.carrier_status_history as unknown[])
    : [];
  history.push(event);

  const { error } = await supabase
    .from("orders")
    .update({
      carrier_status_history: history,
      last_tracking_sync_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  return !error;
}

/** Commandes de l'utilisateur connecté (session navigateur, RLS filtre déjà par user_id). */
export async function listMyOrders(): Promise<OrderRow[]> {
  const supabase = createSupabaseClient();
  const userId = await getCurrentUserId();
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapOrder(row as Record<string, unknown>));
}

/** Liste admin — service_role obligatoire en production. */
export async function listAllOrders(): Promise<OrderRow[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => mapOrder(row as Record<string, unknown>));
}

/**
 * Le client confirme avoir reçu sa commande. Idempotent — ne réécrit pas
 * received_at si déjà posé (garde la date de la première confirmation).
 */
export async function markOrderReceived(
  orderId: string,
  userId: string,
): Promise<OrderRow | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .update({ received_at: new Date().toISOString(), shipping_status: "delivered" })
    .eq("id", orderId)
    .eq("user_id", userId)
    .is("received_at", null)
    .select("*")
    .maybeSingle();

  if (!error && data) return mapOrder(data as Record<string, unknown>);
  return getOrderById(orderId);
}

/** Récupère une commande par son id. */
export async function getOrderById(orderId: string): Promise<OrderRow | null> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return mapOrder(data as Record<string, unknown>);
}
