import { NextResponse } from "next/server";
import { normalizeAnswerMap } from "@/lib/application/diagnostic/recommend";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { container } from "@/lib/application/container";
import { listAvailableDiagnosticSlots } from "@/lib/application/diagnostic/slots";
import {
  createAppointment,
  getDiagnosticSettings,
  updateAppointment,
} from "@/lib/infrastructure/supabase/diagnostic-admin";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    fullName?: string;
    phone?: string;
    startsAt?: string;
    answers?: Record<string, unknown>;
  };

  const email = String(body.email ?? "").trim();
  const fullName = String(body.fullName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const startsAt = String(body.startsAt ?? "").trim();
  const answers = normalizeAnswerMap(body.answers ?? {});

  if (!email || !fullName || !phone || !startsAt) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const settings = await getDiagnosticSettings();
  const duration = settings.slotDurationMinutes || 45;
  const endsAt = new Date(
    new Date(startsAt).getTime() + duration * 60_000,
  ).toISOString();

  const from = new Date(startsAt);
  from.setHours(0, 0, 0, 0);
  const to = new Date(startsAt);
  to.setDate(to.getDate() + 1);
  const slots = await listAvailableDiagnosticSlots(
    from.toISOString(),
    to.toISOString(),
  );
  const stillOpen = slots.some((s) => s.startsAt === new Date(startsAt).toISOString() || s.startsAt === startsAt);
  // Compare by time proximity (ISO may differ by ms formatting)
  const match = slots.find(
    (s) => Math.abs(new Date(s.startsAt).getTime() - new Date(startsAt).getTime()) < 1000,
  );
  if (!match && !stillOpen) {
    return NextResponse.json({ error: "Slot unavailable" }, { status: 409 });
  }

  const userId = await userIdFromRequest(request);
  const amountCents = settings.physicalPriceCents;
  const appointment = await createAppointment({
    userId,
    email,
    fullName,
    phone,
    startsAt: match?.startsAt ?? startsAt,
    endsAt: match?.endsAt ?? endsAt,
    answers,
    amountCents,
    currency: settings.currency,
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "Unable to create appointment" },
      { status: 500 },
    );
  }

  const origin = new URL(request.url).origin;
  const checkout = await container.payments.createStripeCheckout({
    orderId: `diag-${appointment.id}`,
    customerEmail: email,
    currency: settings.currency,
    successUrl: `${origin}/diagnostic-capillaire/rdv/succes?appointmentId=${appointment.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/diagnostic-capillaire?mode=physical&cancelled=1`,
    metadata: {
      appointmentId: appointment.id,
      type: "diagnostic_appointment",
    },
    lineItems: [
      {
        name: "Diagnostic capillaire Awura Beauty (présentiel)",
        quantity: 1,
        unitAmountCents: amountCents,
      },
    ],
  });

  if (!checkout.url) {
    await updateAppointment(appointment.id, { status: "cancelled" });
    return NextResponse.json(
      { error: checkout.error ?? "Stripe unavailable" },
      { status: 500 },
    );
  }

  if (checkout.sessionId) {
    await updateAppointment(appointment.id, {
      stripeSessionId: checkout.sessionId,
    });
  }

  return NextResponse.json({
    appointmentId: appointment.id,
    url: checkout.url,
  });
}
