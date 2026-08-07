import { NextResponse } from "next/server";
import { updateOrderPayment } from "@/lib/infrastructure/supabase/orders";

export async function POST(request: Request) {
  const body = (await request.json()) as { orderId?: string };
  if (!body.orderId || body.orderId.startsWith("demo-")) {
    return NextResponse.json({ ok: true });
  }

  const ok = await updateOrderPayment(body.orderId, {
    paymentStatus: "paid",
    status: "paid",
  });

  return NextResponse.json({ ok });
}
