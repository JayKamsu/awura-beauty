import { NextResponse } from "next/server";
import { notifyAppointmentRescheduled } from "@/lib/application/notifications/appointment-notify";
import { rescheduleAppointment } from "@/lib/application/diagnostic/reschedule";
import { getUserFromAccessToken } from "@/lib/infrastructure/supabase/admin-auth";
import { getAppointmentById } from "@/lib/infrastructure/supabase/diagnostic-admin";

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

type Params = { params: Promise<{ appointmentId: string }> };

/** Replanifie un RDV diagnostic (client propriétaire uniquement) vers un nouveau créneau. */
export async function POST(request: Request, { params }: Params) {
  const { appointmentId } = await params;
  const id = String(appointmentId ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const appointment = await getAppointmentById(id);
  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const accessToken = bearer(request);
  const user = accessToken ? await getUserFromAccessToken(accessToken) : null;
  const isOwner =
    Boolean(user) &&
    (user!.id === appointment.userId ||
      (user!.email && user!.email.toLowerCase() === appointment.email.toLowerCase()));

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { startsAt?: string };
  const startsAt = String(body.startsAt ?? "").trim();
  if (!startsAt) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await rescheduleAppointment(id, startsAt);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await notifyAppointmentRescheduled({
    appointment: result.appointment,
    previousStartsAt: appointment.startsAt,
    changedBy: "client",
  });

  return NextResponse.json({ appointment: result.appointment });
}
