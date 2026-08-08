import { NextResponse } from "next/server";
import {
  canJoinDiagnosticVideo,
  diagnosticVideoPath,
} from "@/lib/application/diagnostic/video";
import { getStripeClient } from "@/lib/infrastructure/payments/stripe";
import {
  getAppointmentById,
  updateAppointment,
} from "@/lib/infrastructure/supabase/diagnostic-admin";

function withVideo(appointment: NonNullable<
  Awaited<ReturnType<typeof getAppointmentById>>
>) {
  const videoPath = canJoinDiagnosticVideo(appointment.status)
    ? diagnosticVideoPath(appointment.id, appointment.email)
    : null;
  return { appointment, videoPath };
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    appointmentId?: string;
    sessionId?: string;
  };
  const appointmentId = String(body.appointmentId ?? "").trim();
  const sessionId = String(body.sessionId ?? "").trim();
  if (!appointmentId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (appointment.status === "confirmed" || appointment.status === "completed") {
    return NextResponse.json({ ok: true, ...withVideo(appointment) });
  }

  if (sessionId) {
    const stripe = getStripeClient();
    if (stripe) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const metaId = session.metadata?.appointmentId;
      if (
        metaId === appointmentId &&
        (session.payment_status === "paid" || session.status === "complete")
      ) {
        const updated = await updateAppointment(appointmentId, {
          status: "confirmed",
          stripeSessionId: sessionId,
        });
        if (!updated) {
          return NextResponse.json({ ok: false, appointment });
        }
        return NextResponse.json({ ok: true, ...withVideo(updated) });
      }
    }
  }

  return NextResponse.json({ ok: false, ...withVideo(appointment) });
}
