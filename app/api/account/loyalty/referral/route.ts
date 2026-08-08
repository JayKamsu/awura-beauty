import { NextResponse } from "next/server";
import { getUserFromAccessToken } from "@/lib/infrastructure/supabase/admin-auth";
import {
  attachReferrer,
  findProfileByReferralCode,
} from "@/lib/infrastructure/supabase/loyalty";

function bearer(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : null;
}

/** Attache un code parrain (une seule fois). */
export async function POST(request: Request) {
  const user = await getUserFromAccessToken(bearer(request));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { code?: string };
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  const referrer = await findProfileByReferralCode(code);
  if (!referrer) {
    return NextResponse.json({ error: "invalid_code" }, { status: 404 });
  }

  const result = await attachReferrer({
    userId: user.id,
    referrerId: referrer.id,
  });

  if (!result.ok) {
    const status =
      result.error === "already_referred" || result.error === "self_referral"
        ? 409
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
