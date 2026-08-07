import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { listAllOrders } from "@/lib/infrastructure/supabase/orders";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const orders = await listAllOrders();
  return NextResponse.json({ orders });
}
