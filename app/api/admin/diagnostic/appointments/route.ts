import { NextResponse } from "next/server";
import { rescheduleAppointment } from "@/lib/application/diagnostic/reschedule";
import { notifyAppointmentRescheduled } from "@/lib/application/notifications/appointment-notify";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  getAppointmentById,
  listAllAppointments,
  listAllHairDiagnostics,
  updateAppointment,
} from "@/lib/infrastructure/supabase/diagnostic-admin";
import type { DiagnosticAppointmentStatus } from "@/lib/domain/diagnostic";

/** Liste les rendez-vous diagnostic, ou l'historique si `kind=history` (admin). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") || "appointments";
  if (kind === "history") {
    const diagnostics = await listAllHairDiagnostics();
    return NextResponse.json({ diagnostics });
  }
  const appointments = await listAllAppointments();
  return NextResponse.json({ appointments });
}

/** Met à jour le statut, les notes, ou replanifie un rendez-vous diagnostic (admin). */
export async function PATCH(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as {
    id?: string;
    status?: DiagnosticAppointmentStatus;
    notes?: string;
    startsAt?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (body.startsAt) {
    const previous = await getAppointmentById(body.id);
    if (!previous) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const result = await rescheduleAppointment(body.id, body.startsAt);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    await notifyAppointmentRescheduled({
      appointment: result.appointment,
      previousStartsAt: previous.startsAt,
      changedBy: "admin",
    });
    return NextResponse.json({ appointment: result.appointment });
  }

  const appointment = await updateAppointment(body.id, {
    status: body.status,
    notes: body.notes,
  });
  if (!appointment) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ appointment });
}
