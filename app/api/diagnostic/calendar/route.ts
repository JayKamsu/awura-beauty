import { NextResponse } from "next/server";
import { buildCalendarIcs, type IcsEventInput } from "@/lib/application/diagnostic/ics";
import { diagnosticVideoAbsoluteUrl } from "@/lib/application/diagnostic/video";
import { calendarFeedAuthorized } from "@/lib/infrastructure/security/calendar-feed";
import {
  getDiagnosticSettings,
  listAllAppointments,
} from "@/lib/infrastructure/supabase/diagnostic-admin";

/** Flux iCal privé des RDV confirmés, à abonner dans Google Agenda. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!calendarFeedAuthorized(token)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [appointments, settings] = await Promise.all([
    listAllAppointments(),
    getDiagnosticSettings(),
  ]);

  const events: IcsEventInput[] = appointments
    .filter((item) => item.status === "confirmed" || item.status === "completed")
    .map((item) => {
      const online = item.channel === "online";
      return {
        uid: `diagnostic-${item.id}@awurabeauty.com`,
        title: online
          ? `Diagnostic visio — ${item.fullName}`
          : `Diagnostic — ${item.fullName}`,
        description: [item.email, item.phone, item.notes].filter(Boolean).join("\n"),
        location: online
          ? diagnosticVideoAbsoluteUrl(item.id, item.email)
          : settings.physicalLocationText || undefined,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        sequence: item.rescheduledCount ?? 0,
        status: "CONFIRMED" as const,
      };
    });

  return new NextResponse(buildCalendarIcs(events), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="awura-diagnostics.ics"',
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
