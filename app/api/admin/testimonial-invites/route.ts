import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  adminListInvites,
  createInviteToken,
  insertTestimonialInvite,
} from "@/lib/infrastructure/supabase/site-testimonials";
import { getSiteUrl } from "@/lib/site";

/** Liste les invitations témoignage — admin uniquement. */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const invites = await adminListInvites();
  return NextResponse.json({ invites });
}

/** Crée un lien d'invitation à envoyer au client. Le jeton n'est renvoyé qu'une fois. */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as { note?: string };
  const { token, tokenHash } = createInviteToken();
  const invite = await insertTestimonialInvite({
    tokenHash,
    note: String(body.note ?? "").trim().slice(0, 200),
  });
  if (!invite) {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
  const url = `${getSiteUrl()}/temoignages/nouveau?token=${encodeURIComponent(token)}`;
  return NextResponse.json({ invite, url });
}
