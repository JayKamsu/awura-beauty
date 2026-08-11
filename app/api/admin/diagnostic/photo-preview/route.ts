import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { getSignedDiagnosticPhotoUrl } from "@/lib/infrastructure/supabase/storage";

/** URL signée temporaire vers une photo de diagnostic privée (aperçu admin). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const result = await getSignedDiagnosticPhotoUrl(path);
  if (!result.url) {
    return NextResponse.json(
      { error: result.error ?? "Unable to sign photo URL" },
      { status: 404 },
    );
  }

  return NextResponse.json({ url: result.url });
}
