import { NextResponse } from "next/server";
import {
  canJoinDiagnosticVideoNow,
  createVideoAccessToken,
  diagnosticVideoPath,
  isVideoEligibleStatus,
  JITSI_DOMAIN,
  jitsiJoinUrl,
  jitsiRoomName,
  VIDEO_CALL_MAX_MINUTES,
  verifyVideoAccessToken,
  videoCallEndsAt,
  videoJoinWindowStartsAt,
} from "@/lib/application/diagnostic/video";
import {
  getUserFromAccessToken,
  isAdminUser,
} from "@/lib/infrastructure/supabase/admin-auth";
import { getAppointmentById } from "@/lib/infrastructure/supabase/diagnostic-admin";

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

type Params = { params: Promise<{ appointmentId: string }> };

/** Accès salle visio Jitsi pour un RDV (client token / session, ou admin). */
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

  if (!isVideoEligibleStatus(appointment.status)) {
    return NextResponse.json(
      { error: "Appointment not ready for video" },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const accessToken = bearer(request);
  const user = accessToken ? await getUserFromAccessToken(accessToken) : null;
  const isAdmin = isAdminUser(user);

  const tokenOk =
    Boolean(token) &&
    verifyVideoAccessToken(appointmentId, appointment.email, token);
  const userOk =
    Boolean(user) &&
    (user!.id === appointment.userId ||
      (user!.email &&
        user!.email.toLowerCase() === appointment.email.toLowerCase()));

  if (!tokenOk && !userOk && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const displayName = isAdmin
    ? "Awura Beauty"
    : appointment.fullName || user?.email || "Cliente Awura";

  return NextResponse.json({
    appointmentId: appointment.id,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    status: appointment.status,
    domain: JITSI_DOMAIN,
    roomName: jitsiRoomName(appointment.id),
    joinUrl: jitsiJoinUrl(appointment.id, displayName),
    displayName,
    videoPath: diagnosticVideoPath(appointment.id, appointment.email),
    accessToken: createVideoAccessToken(appointment.id, appointment.email),
    isAdmin,
    canJoinNow: canJoinDiagnosticVideoNow(appointment.status, appointment.startsAt),
    joinWindowStartsAt: videoJoinWindowStartsAt(appointment.startsAt),
    callEndsAt: videoCallEndsAt(appointment.startsAt),
    callMaxMinutes: VIDEO_CALL_MAX_MINUTES,
  });
}
