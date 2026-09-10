import { NextResponse } from "next/server";
import {
  diagnosticVideoPath,
  isVideoEligibleStatus,
} from "@/lib/application/diagnostic/video";
import { getUserFromAccessToken } from "@/lib/infrastructure/supabase/admin-auth";
import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import type { DiagnosticAppointment } from "@/lib/domain/diagnostic";
import { parseExternalProductLinks } from "@/lib/domain/diagnostic";

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

function mapRow(row: Record<string, unknown>): DiagnosticAppointment {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    email: String(row.email ?? ""),
    fullName: String(row.full_name ?? ""),
    phone: String(row.phone ?? ""),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    status: row.status as DiagnosticAppointment["status"],
    channel: (row.channel as DiagnosticAppointment["channel"]) || "physical",
    answers: (row.answers as Record<string, string>) ?? {},
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? "EUR"),
    stripeSessionId: row.stripe_session_id
      ? String(row.stripe_session_id)
      : null,
    notes: String(row.notes ?? ""),
    externalProductLinks: parseExternalProductLinks(row.external_product_links),
    resultDraft: null,
    createdAt: String(row.created_at),
  };
}

/** RDV diagnostic du client connecté (par user_id ou e-mail du compte). */
export async function GET(request: Request) {
  const token = bearer(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserFromAccessToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ appointments: [] });
  }

  const email = (user.email || "").trim().toLowerCase();
  const byUser = await supabase
    .from("diagnostic_appointments")
    .select("*")
    .eq("user_id", user.id)
    .order("starts_at", { ascending: false })
    .limit(50);

  let byEmail: { data: Record<string, unknown>[] | null } = { data: [] };
  if (email) {
    byEmail = await supabase
      .from("diagnostic_appointments")
      .select("*")
      .ilike("email", email)
      .order("starts_at", { ascending: false })
      .limit(50);
  }

  const merged = new Map<string, DiagnosticAppointment>();
  for (const row of [...(byUser.data ?? []), ...(byEmail.data ?? [])]) {
    const mapped = mapRow(row as Record<string, unknown>);
    merged.set(mapped.id, mapped);
  }

  const appointments = [...merged.values()].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );

  const payload = appointments.map((a) => ({
    ...a,
    videoPath:
      a.channel === "online" && isVideoEligibleStatus(a.status)
        ? diagnosticVideoPath(a.id, a.email)
        : null,
  }));

  return NextResponse.json({ appointments: payload });
}
