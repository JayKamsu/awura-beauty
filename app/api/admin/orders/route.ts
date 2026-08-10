import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { isAbandonedPendingOrder } from "@/lib/infrastructure/supabase/order-types";
import { listAllOrders } from "@/lib/infrastructure/supabase/orders";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const includeAbandoned =
    new URL(request.url).searchParams.get("includeAbandoned") === "1";
  const orders = await listAllOrders();
  const visible = includeAbandoned
    ? orders
    : orders.filter((order) => !isAbandonedPendingOrder(order));
  return NextResponse.json({ orders: visible });
}
