import { NextResponse } from "next/server";
import { buildAppointmentIcs } from "@/lib/application/diagnostic/ics";
import {
  getUserFromAccessToken,
  isAdminUser,
} from "@/lib/infrastructure/supabase/admin-auth";
import {
  getAppointmentById,
  getDiagnosticSettings,
} from "@/lib/infrastructure/supabase/diagnostic-admin";

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

type Params = { params: Promise<{ appointmentId: string }> };

/** Fichier .ics du rendez-vous diagnostic (client propriétaire ou admin) — compatible Calendrier iOS/Android. */
export async function GET(request: Request, { params }: Params) {
  const { appointmentId: rawId } = await params;
  const appointmentId = String(rawId ?? "").trim();
  if (!appointmentId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const accessToken = bearer(request);
  const user = accessToken ? await getUserFromAccessToken(accessToken) : null;
  const isAdmin = isAdminUser(user);
  const isOwner =
    Boolean(user) &&
    (user!.id === appointment.userId ||
      (user!.email && user!.email.toLowerCase() === appointment.email.toLowerCase()));

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getDiagnosticSettings();

  const isOnline = appointment.channel === "online";
  const ics = buildAppointmentIcs({
    uid: `diagnostic-${appointment.id}@awurabeauty.com`,
    title: isOnline
      ? "Diagnostic capillaire Awura Beauty (visio)"
      : "Diagnostic capillaire Awura Beauty",
    description: isOnline
      ? "Rendez-vous visio de diagnostic capillaire Awura Beauty. Le lien de connexion est disponible dans votre compte."
      : "Rendez-vous de diagnostic capillaire présentiel Awura Beauty. Merci de ne pas se laver les cheveux dans les 48 heures précédant le rendez-vous.",
    location: isOnline ? undefined : settings.physicalLocationText || undefined,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="diagnostic-awura-${appointment.id}.ics"`,
    },
  });
}
