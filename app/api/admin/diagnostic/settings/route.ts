import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  getDiagnosticSettings,
  updateDiagnosticSettings,
} from "@/lib/infrastructure/supabase/diagnostic-admin";
import type { DiagnosticSettings } from "@/lib/domain/diagnostic";

/** Récupère les réglages du module diagnostic (admin). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const settings = await getDiagnosticSettings();
  return NextResponse.json({ settings });
}

/** Met à jour les réglages du module diagnostic (admin). */
export async function PUT(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as Partial<DiagnosticSettings>;
  const settings = await updateDiagnosticSettings(body);
  if (!settings) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ settings });
}
