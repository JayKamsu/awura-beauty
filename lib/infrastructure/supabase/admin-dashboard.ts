import { listAllOrders } from "@/lib/infrastructure/supabase/orders";
import { adminListProducts } from "@/lib/infrastructure/supabase/admin-products";
import type {
  OrderRow,
  PaymentMethod,
  ShippingCarrier,
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

export type AdminCustomer = {
  email: string;
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
};

export type AdminDashboardStats = {
  ordersToday: number;
  revenueToday: number;
  lowStockProducts: ProductRow[];
  recentOrders: OrderRow[];
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
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

export async function getAdminDashboardStats(
  lowStockThreshold = 5,
): Promise<AdminDashboardStats> {
  const [orders, products] = await Promise.all([
    listAllOrders(),
    adminListProducts(),
  ]);

  const today = startOfToday();
  const todaysOrders = orders.filter(
    (order) => new Date(order.created_at) >= today,
  );

  return {
    ordersToday: todaysOrders.length,
    revenueToday: todaysOrders.reduce((sum, order) => sum + order.total, 0),
    lowStockProducts: products.filter(
      (product) => product.stock <= lowStockThreshold,
    ),
    recentOrders: orders.slice(0, 5),
  };
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  const orders = await listAllOrders();
  const byEmail = new Map<string, OrderRow[]>();

  for (const order of orders) {
    const email = order.email.toLowerCase();
    const list = byEmail.get(email) ?? [];
    list.push(order);
    byEmail.set(email, list);
  }

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

    customers.push({
      email: sorted[0].email,
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
    });
  }

  return customers.sort(
    (a, b) =>
      new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
  );
}
