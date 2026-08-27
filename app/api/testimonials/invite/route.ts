import { NextResponse } from "next/server";
import { findValidInvite } from "@/lib/infrastructure/supabase/site-testimonials";

/** Vérifie qu'un jeton d'invitation témoignage est encore valide. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }
  const invite = await findValidInvite(token);
  if (!invite) {
    return NextResponse.json({ error: "invalid" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, expiresAt: invite.expiresAt });
}
