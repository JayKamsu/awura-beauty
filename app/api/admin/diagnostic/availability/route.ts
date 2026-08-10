import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  deleteSlotOverride,
  listAvailabilityRules,
  listSlotOverrides,
  replaceAvailabilityRules,
  upsertSlotOverride,
} from "@/lib/infrastructure/supabase/diagnostic-admin";

/** Règles de disponibilité récurrentes + exceptions ponctuelles sur 60 jours (admin). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const now = new Date();
  const to = new Date(now);
  to.setDate(to.getDate() + 60);
  const [rules, overrides] = await Promise.all([
    listAvailabilityRules(),
    listSlotOverrides(now.toISOString(), to.toISOString()),
  ]);
  return NextResponse.json({ rules, overrides });
}

/** Remplace l'ensemble des règles de disponibilité hebdomadaires (admin). */
export async function PUT(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as {
    rules?: Array<{
      weekday: number;
      startTime: string;
      endTime: string;
      enabled: boolean;
    }>;
  };
  if (!body.rules) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const ok = await replaceAvailabilityRules(body.rules);
  if (!ok) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
  const rules = await listAvailabilityRules();
  return NextResponse.json({ rules });
}

/** Crée ou met à jour une exception ponctuelle (créneau ouvert ou bloqué) (admin). */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as {
    id?: string;
    startsAt: string;
    endsAt: string;
    kind: "open" | "blocked";
    note?: string;
  };
  if (!body.startsAt || !body.endsAt || !body.kind) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const override = await upsertSlotOverride(body);
  if (!override) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
  return NextResponse.json({ override });
}

/** Supprime une exception de créneau par id (admin). */
export async function DELETE(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const ok = await deleteSlotOverride(id);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
