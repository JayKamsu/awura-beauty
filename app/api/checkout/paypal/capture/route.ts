import { NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/infrastructure/payments/paypal";
import { updateOrderPayment } from "@/lib/infrastructure/supabase/orders";

type CaptureBody = {
  paypalOrderId: string;
  orderId: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CaptureBody;

  if (!body.paypalOrderId || !body.orderId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const capture = await capturePayPalOrder(body.paypalOrderId);
  if (!capture.ok) {
    return NextResponse.json(
      { error: capture.error ?? "Capture failed" },
      { status: 500 },
    );
  }

  if (!body.orderId.startsWith("demo-")) {
    await updateOrderPayment(body.orderId, {
      paymentStatus: "paid",
      status: "paid",
    });
  }

  return NextResponse.json({ ok: true, orderId: body.orderId });
}
