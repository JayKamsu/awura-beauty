import { listAllOrders } from "@/lib/infrastructure/supabase/orders";
import { adminListProducts } from "@/lib/infrastructure/supabase/admin-products";
import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

export type AdminCustomer = {
  email: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string;
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
  const byEmail = new Map<string, AdminCustomer>();

  for (const order of orders) {
    const email = order.email.toLowerCase();
    const current = byEmail.get(email);
    if (!current) {
      byEmail.set(email, {
        email: order.email,
        ordersCount: 1,
        totalSpent: order.total,
        lastOrderAt: order.created_at,
      });
      continue;
    }

    current.ordersCount += 1;
    current.totalSpent += order.total;
    if (new Date(order.created_at) > new Date(current.lastOrderAt)) {
      current.lastOrderAt = order.created_at;
    }
  }

  return [...byEmail.values()].sort(
    (a, b) =>
      new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
  );
}
