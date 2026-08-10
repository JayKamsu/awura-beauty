import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
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

/** Met à jour le statut ou les notes d'un rendez-vous diagnostic (admin). */
export async function PATCH(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as {
    id?: string;
    status?: DiagnosticAppointmentStatus;
    notes?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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
