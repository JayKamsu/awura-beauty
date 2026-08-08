import { NextResponse } from "next/server";
import { getUserFromAccessToken } from "@/lib/infrastructure/supabase/admin-auth";
import {
  ensureReferralCode,
  getLoyaltyProfile,
  listLoyaltyLedger,
} from "@/lib/infrastructure/supabase/loyalty";
import { absoluteUrl } from "@/lib/site";

function bearer(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : null;
}

/** Solde + historique + code parrain. */
export async function GET(request: Request) {
  const user = await getUserFromAccessToken(bearer(request));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = await ensureReferralCode(user.id);
  const profile = await getLoyaltyProfile(user.id);
  const ledger = await listLoyaltyLedger(user.id, 40);

  return NextResponse.json({
    balance: profile?.loyalty_points ?? 0,
    referralCode: code,
    referredBy: profile?.referred_by ?? null,
    referralRewardedAt: profile?.referral_rewarded_at ?? null,
    referralLink: code
      ? absoluteUrl(`/compte/inscription?ref=${encodeURIComponent(code)}`)
      : null,
    ledger,
  });
}
