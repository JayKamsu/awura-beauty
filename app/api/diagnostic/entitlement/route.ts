import { NextResponse } from "next/server";
import { userIdFromRequest } from "@/lib/application/checkout/request-user";
import { countAvailableDiagnosticEntitlements } from "@/lib/infrastructure/supabase/diagnostic-entitlements";

/** Entitlements diagnostic offerts (ex. après achat gamme complète). */
export async function GET(request: Request) {
  const userId = await userIdFromRequest(request);
  const email = new URL(request.url).searchParams.get("email")?.trim() ?? "";

  if (!userId && !email) {
    return NextResponse.json({ available: 0 });
  }

  const available = await countAvailableDiagnosticEntitlements({
    userId,
    email: email || undefined,
  });

  return NextResponse.json({ available });
}
