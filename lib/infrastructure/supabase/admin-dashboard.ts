import { listAllOrders } from "@/lib/infrastructure/supabase/orders";
import { adminListProducts } from "@/lib/infrastructure/supabase/admin-products";
import { getLoyaltyProfilesByIds } from "@/lib/infrastructure/supabase/loyalty";
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

/** KPIs du dashboard admin : commandes/CA sur différentes fenêtres, hors paniers abandonnés jamais payés. */
export type AdminDashboardStats = {
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
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(n: number) {
  const date = startOfToday();
  date.setDate(date.getDate() - n);
  return date;
}

function dateKey(iso: string) {
  return iso.slice(0, 10);
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
): Promise<AdminDashboardStats> {
  const [allOrders, products] = await Promise.all([
    listAllOrders(),
    adminListProducts(),
  ]);
  // Paniers abandonnés (jamais payés) : hors KPI, ils ne sont pas des ventes ni de vraies commandes à traiter.
  const orders = allOrders.filter((order) => !isAbandonedPendingOrder(order));

  const today = startOfToday();
  const yesterday = daysAgo(1);
  const startOfWeek = daysAgo(7);
  const startOfPreviousWeek = daysAgo(14);
  const start30d = daysAgo(30);
  const start14d = daysAgo(14);

  const todaysOrders = orders.filter(
    (order) => new Date(order.created_at) >= today,
  );
  const yesterdaysOrders = orders.filter((order) => {
    const created = new Date(order.created_at);
    return created >= yesterday && created < today;
  });
  const thisWeekOrders = orders.filter(
    (order) => new Date(order.created_at) >= startOfWeek,
  );
  const previousWeekOrders = orders.filter((order) => {
    const created = new Date(order.created_at);
    return created >= startOfPreviousWeek && created < startOfWeek;
  });
  const orders30d = orders.filter(
    (order) => new Date(order.created_at) >= start30d,
  );
  const paid30d = orders30d.filter(
    (order) => paymentBadgeStatus(order) === "paid",
  );

  const dailyBuckets = new Map<string, AdminDashboardDailyPoint>();
  for (let i = 13; i >= 0; i--) {
    const key = dateKey(daysAgo(i).toISOString());
    dailyBuckets.set(key, { date: key, revenue: 0, orders: 0 });
  }
  for (const order of orders) {
    if (new Date(order.created_at) < start14d) continue;
    const key = dateKey(order.created_at);
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
  for (const order of orders30d) {
    statusBreakdown30d[paymentBadgeStatus(order)] += 1;
    methodBreakdown30d[order.payment_method] += 1;
  }

  const productTotals = new Map<string, AdminDashboardTopProduct>();
  for (const order of paid30d) {
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

  return {
    ordersToday: todaysOrders.length,
    revenueToday: sumTotal(todaysOrders),
    ordersYesterday: yesterdaysOrders.length,
    revenueYesterday: sumTotal(yesterdaysOrders),
    ordersThisWeek: thisWeekOrders.length,
    revenueThisWeek: sumTotal(thisWeekOrders),
    ordersPreviousWeek: previousWeekOrders.length,
    revenuePreviousWeek: sumTotal(previousWeekOrders),
    averageOrderValue30d: orders30d.length
      ? sumTotal(orders30d) / orders30d.length
      : 0,
    paidConversionRate30d: orders30d.length
      ? paid30d.length / orders30d.length
      : 0,
    lowStockProducts: products.filter(
      (product) => product.stock <= lowStockThreshold,
    ),
    recentOrders: orders.slice(0, 5),
    dailySeries14d: [...dailyBuckets.values()],
    statusBreakdown30d,
    methodBreakdown30d,
    topProducts30d,
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
