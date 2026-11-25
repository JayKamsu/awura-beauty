import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  getAdminDashboardStats,
  resolveDashboardWindow,
} from "@/lib/infrastructure/supabase/admin-dashboard";

/** Statistiques agrégées du tableau de bord admin, filtrables par période (`from` / `to`). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const resolved = resolveDashboardWindow(
    url.searchParams.get("from"),
    url.searchParams.get("to"),
  );
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const stats = await getAdminDashboardStats(5, resolved.window);
  return NextResponse.json(stats);
}
