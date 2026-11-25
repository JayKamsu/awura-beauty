import { NextResponse } from "next/server";
import {
  calendarOrganizerEmail,
  calendarSyncEmail,
} from "@/lib/application/diagnostic/ics";
import { calendarFeedUrl } from "@/lib/infrastructure/security/calendar-feed";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";

/** Lien d'abonnement Google Agenda et adresses organisateur / agenda fusionné (admin). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  return NextResponse.json({
    organizerEmail: calendarOrganizerEmail(),
    syncEmail: calendarSyncEmail(),
    subscribeUrl: calendarFeedUrl(),
  });
}
