import { NextResponse } from "next/server";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { listDiagnosticsForUserId } from "@/lib/infrastructure/supabase/diagnostics";

/** Diagnostics du client connecté (Bearer). */
export async function GET(request: Request) {
  const userId = await userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const diagnostics = await listDiagnosticsForUserId(userId);
  return NextResponse.json({ diagnostics });
}
