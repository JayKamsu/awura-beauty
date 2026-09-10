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
import {
  isSafeHttpUrl,
  parseDiagnosticResultDraft,
  parseExternalProductLinks,
  type DiagnosticAppointmentStatus,
  type DiagnosticExternalProductLink,
} from "@/lib/domain/diagnostic";

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

const MAX_RESULT_DRAFT_BYTES = 200_000;

/** Met à jour le statut, les notes, les liens produits, le brouillon de bilan, ou replanifie un rendez-vous diagnostic (admin). */
export async function PATCH(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as {
    id?: string;
    status?: DiagnosticAppointmentStatus;
    notes?: string;
    externalProductLinks?: unknown;
    resultDraft?: unknown;
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

  let resultDraft:
    | ReturnType<typeof parseDiagnosticResultDraft>
    | null
    | undefined;
  if ("resultDraft" in body) {
    if (body.resultDraft === null) {
      resultDraft = null;
    } else {
      const parsed = parseDiagnosticResultDraft(body.resultDraft);
      if (!parsed) {
        return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
      }
      if (JSON.stringify(parsed).length > MAX_RESULT_DRAFT_BYTES) {
        return NextResponse.json({ error: "Draft too large" }, { status: 400 });
      }
      resultDraft = { ...parsed, appointmentId: body.id };
    }
  }

  let externalProductLinks: DiagnosticExternalProductLink[] | undefined;
  if ("externalProductLinks" in body) {
    if (!Array.isArray(body.externalProductLinks)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    for (const item of body.externalProductLinks) {
      const url =
        item && typeof item === "object"
          ? String((item as { url?: unknown }).url ?? "").trim()
          : "";
      if (url && !isSafeHttpUrl(url)) {
        return NextResponse.json(
          { error: "Invalid product link" },
          { status: 400 },
        );
      }
    }
    externalProductLinks = parseExternalProductLinks(body.externalProductLinks);
  }

  const appointment = await updateAppointment(body.id, {
    status: body.status,
    notes: body.notes,
    externalProductLinks,
    resultDraft,
  });
  if (!appointment) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ appointment });
}
