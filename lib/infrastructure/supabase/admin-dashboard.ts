import { listAllOrders } from "@/lib/infrastructure/supabase/orders";
import { adminListProducts } from "@/lib/infrastructure/supabase/admin-products";
import { getLoyaltyProfilesByIds } from "@/lib/infrastructure/supabase/loyalty";
import {
  getSiteVisitStats,
  type AdminVisitCountry,
  type AdminVisitSource,
  type AdminVisitStats,
} from "@/lib/infrastructure/supabase/site-visits";
import {
  isAbandonedPendingOrder,
  paymentBadgeStatus,
  type OrderRow,
  type PaymentBadgeStatus,
  type PaymentMethod,
  type ShippingCarrier,
} from "@/lib/infrastructure/supabase/order-types";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

export type AdminCustomerOrderSummary = {
  id: string;
  total: number;
  currency: string;
  created_at: string;
  shipping_status: OrderRow["shipping_status"];
  payment_status: string;
  shipping_carrier: ShippingCarrier | null;
};

/** Vue agrégée d'un client admin : reconstruite à partir de ses commandes (groupées par email), pas stockée telle quelle. */
export type AdminCustomer = {
  email: string;
  userId: string | null;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  ordersCount: number;
  totalSpent: number;
  averageOrder: number;
  firstOrderAt: string;
  lastOrderAt: string;
  preferredCarrier: ShippingCarrier | null;
  paymentMethods: PaymentMethod[];
  recentOrders: AdminCustomerOrderSummary[];
  loyaltyPoints: number;
  referralCode: string | null;
  referredBy: string | null;
};

export type AdminDashboardDailyPoint = {
  date: string;
  revenue: number;
  orders: number;
};

export type AdminDashboardStatusBreakdown = Record<PaymentBadgeStatus, number>;

export type AdminDashboardMethodBreakdown = Record<PaymentMethod, number>;

export type AdminDashboardTopProduct = {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
};

export type { AdminVisitCountry, AdminVisitSource, AdminVisitStats };

/** Fenêtre d'analyse du dashboard, bornes inclusives au format YYYY-MM-DD. */
export type DashboardWindow = {
  from: Date;
  toExclusive: Date;
  previousFrom: Date;
  previousToExclusive: Date;
  fromKey: string;
  toKey: string;
  previousFromKey: string;
  previousToKey: string;
};

/**
 * KPIs du dashboard admin sur la période choisie, comparés à la période
 * précédente de même durée. Les paniers abandonnés jamais payés sont exclus.
 * Les champs *Today / *30d portent les totaux de la période sélectionnée.
 */
export type AdminDashboardStats = {
  rangeFrom: string;
  rangeTo: string;
  previousFrom: string;
  previousTo: string;
  ordersToday: number;
  revenueToday: number;
  ordersYesterday: number;
  revenueYesterday: number;
  ordersThisWeek: number;
  revenueThisWeek: number;
  ordersPreviousWeek: number;
  revenuePreviousWeek: number;
  averageOrderValue30d: number;
  paidConversionRate30d: number;
  lowStockProducts: ProductRow[];
  recentOrders: OrderRow[];
  dailySeries14d: AdminDashboardDailyPoint[];
  statusBreakdown30d: AdminDashboardStatusBreakdown;
  methodBreakdown30d: AdminDashboardMethodBreakdown;
  topProducts30d: AdminDashboardTopProduct[];
  visitorsToday: number;
  visitorsYesterday: number;
  visitors7d: number;
  visitsToday: number;
  sources30d: AdminVisitSource[];
  countries30d: AdminVisitCountry[];
};

const MAX_RANGE_DAYS = 366;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDay(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayCount(from: Date, toExclusive: Date) {
  let count = 0;
  for (let cursor = new Date(from); cursor < toExclusive; cursor = addDays(cursor, 1)) {
    count += 1;
    if (count > MAX_RANGE_DAYS + 1) break;
  }
  return count;
}

/**
 * Résout la période du dashboard. Sans dates : 30 derniers jours inclus.
 * `from` et `to` sont inclusifs (YYYY-MM-DD).
 */
export function resolveDashboardWindow(
  fromRaw?: string | null,
  toRaw?: string | null,
): { window: DashboardWindow } | { error: string } {
  const today = startOfToday();
  const hasFrom = Boolean(fromRaw);
  const hasTo = Boolean(toRaw);
  if (hasFrom !== hasTo) return { error: "invalid_range" };

  const toInclusive = hasTo ? parseDay(toRaw!) : today;
  const from = hasFrom ? parseDay(fromRaw!) : addDays(today, -29);
  if (!from || !toInclusive) return { error: "invalid_range" };
  if (from > toInclusive || toInclusive > today) return { error: "invalid_range" };

  const toExclusive = addDays(toInclusive, 1);
  const days = dayCount(from, toExclusive);
  if (days < 1 || days > MAX_RANGE_DAYS) return { error: "invalid_range" };

  const previousFrom = addDays(from, -days);
  return {
    window: {
      from,
      toExclusive,
      previousFrom,
      previousToExclusive: from,
      fromKey: formatDay(from),
      toKey: formatDay(toInclusive),
      previousFromKey: formatDay(previousFrom),
      previousToKey: formatDay(addDays(from, -1)),
    },
  };
}

function inWindow(iso: string, from: Date, toExclusive: Date) {
  const created = new Date(iso);
  return created >= from && created < toExclusive;
}

function sumTotal(orders: OrderRow[]) {
  return orders.reduce((sum, order) => sum + order.total, 0);
}

function mostFrequent<T extends string>(values: T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best: T | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

/** Calcule les statistiques du dashboard admin (CA, commandes, top produits...) en excluant les paniers jamais payés. */
export async function getAdminDashboardStats(
  lowStockThreshold = 5,
  window?: DashboardWindow,
): Promise<AdminDashboardStats> {
  const fallback = resolveDashboardWindow();
  if ("error" in fallback) {
    throw new Error(fallback.error);
  }
  const resolved = window ?? fallback.window;
  const [allOrders, products, visitStats] = await Promise.all([
    listAllOrders(),
    adminListProducts(),
    getSiteVisitStats(resolved),
  ]);
  // Paniers abandonnés (jamais payés) : hors KPI, ils ne sont pas des ventes ni de vraies commandes à traiter.
  const orders = allOrders.filter((order) => !isAbandonedPendingOrder(order));

  const periodOrders = orders.filter((order) =>
    inWindow(order.created_at, resolved.from, resolved.toExclusive),
  );
  const previousOrders = orders.filter((order) =>
    inWindow(order.created_at, resolved.previousFrom, resolved.previousToExclusive),
  );
  const paidPeriod = periodOrders.filter(
    (order) => paymentBadgeStatus(order) === "paid",
  );

  const dailyBuckets = new Map<string, AdminDashboardDailyPoint>();
  for (
    let cursor = new Date(resolved.from);
    cursor < resolved.toExclusive;
    cursor = addDays(cursor, 1)
  ) {
    const key = formatDay(cursor);
    dailyBuckets.set(key, { date: key, revenue: 0, orders: 0 });
  }
  for (const order of periodOrders) {
    const key = formatDay(new Date(order.created_at));
    const bucket = dailyBuckets.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue += order.total;
  }

  const statusBreakdown30d: AdminDashboardStatusBreakdown = {
    paid: 0,
    pending: 0,
    refunded: 0,
    cancelled: 0,
  };
  const methodBreakdown30d: AdminDashboardMethodBreakdown = {
    stripe: 0,
    paypal: 0,
    manual: 0,
  };
  for (const order of periodOrders) {
    statusBreakdown30d[paymentBadgeStatus(order)] += 1;
    methodBreakdown30d[order.payment_method] += 1;
  }

  const productTotals = new Map<string, AdminDashboardTopProduct>();
  for (const order of paidPeriod) {
    for (const item of order.items) {
      const entry = productTotals.get(item.product_id) ?? {
        productId: item.product_id,
        name: item.name,
        quantitySold: 0,
        revenue: 0,
      };
      entry.quantitySold += item.quantity;
      entry.revenue += item.unit_price * item.quantity;
      productTotals.set(item.product_id, entry);
    }
  }
  const topProducts30d = [...productTotals.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const periodRevenue = sumTotal(periodOrders);
  const previousRevenue = sumTotal(previousOrders);

  return {
    rangeFrom: resolved.fromKey,
    rangeTo: resolved.toKey,
    previousFrom: resolved.previousFromKey,
    previousTo: resolved.previousToKey,
    ordersToday: periodOrders.length,
    revenueToday: periodRevenue,
    ordersYesterday: previousOrders.length,
    revenueYesterday: previousRevenue,
    ordersThisWeek: periodOrders.length,
    revenueThisWeek: periodRevenue,
    ordersPreviousWeek: previousOrders.length,
    revenuePreviousWeek: previousRevenue,
    averageOrderValue30d: periodOrders.length
      ? periodRevenue / periodOrders.length
      : 0,
    paidConversionRate30d: periodOrders.length
      ? paidPeriod.length / periodOrders.length
      : 0,
    lowStockProducts: products.filter(
      (product) => product.stock <= lowStockThreshold,
    ),
    recentOrders: periodOrders.slice(0, 5),
    dailySeries14d: [...dailyBuckets.values()],
    statusBreakdown30d,
    methodBreakdown30d,
    topProducts30d,
    ...visitStats,
  };
}

/** Reconstruit la liste des clients en regroupant les commandes par email (pas de table clients dédiée). */
export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  const orders = (await listAllOrders()).filter(
    (order) => !isAbandonedPendingOrder(order),
  );
  const byEmail = new Map<string, OrderRow[]>();

  for (const order of orders) {
    const email = order.email.toLowerCase();
    const list = byEmail.get(email) ?? [];
    list.push(order);
    byEmail.set(email, list);
  }

  const userIds = [
    ...new Set(
      orders
        .map((order) => order.user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const loyaltyByUser = await getLoyaltyProfilesByIds(userIds);

  const customers: AdminCustomer[] = [];

  for (const [, list] of byEmail) {
    const sorted = [...list].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const latestWithAddress =
      sorted.find((order) => order.shipping_address?.fullName) ?? sorted[0];
    const address = latestWithAddress.shipping_address;
    const totalSpent = sorted.reduce((sum, order) => sum + order.total, 0);
    const carriers = sorted
      .map((order) => order.shipping_carrier)
      .filter((value): value is ShippingCarrier => Boolean(value));
    const methods = [
      ...new Set(sorted.map((order) => order.payment_method)),
    ] as PaymentMethod[];
    const userId =
      sorted.find((order) => order.user_id)?.user_id ?? null;
    const loyalty = userId ? loyaltyByUser.get(userId) : undefined;

    customers.push({
      email: sorted[0].email,
      userId,
      fullName: address?.fullName ?? null,
      phone: address?.phone ?? null,
      city: address?.city ?? null,
      country: address?.country ?? null,
      ordersCount: sorted.length,
      totalSpent,
      averageOrder: totalSpent / sorted.length,
      firstOrderAt: sorted[sorted.length - 1].created_at,
      lastOrderAt: sorted[0].created_at,
      preferredCarrier: mostFrequent(carriers),
      paymentMethods: methods,
      recentOrders: sorted.slice(0, 5).map((order) => ({
        id: order.id,
        total: order.total,
        currency: order.currency,
        created_at: order.created_at,
        shipping_status: order.shipping_status,
        payment_status: order.payment_status,
        shipping_carrier: order.shipping_carrier,
      })),
      loyaltyPoints: loyalty?.loyalty_points ?? 0,
      referralCode: loyalty?.referral_code ?? null,
      referredBy: loyalty?.referred_by ?? null,
    });
  }

  return customers.sort(
    (a, b) =>
      new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
  );
}
