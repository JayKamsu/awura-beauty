import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { applyLoyaltyDelta } from "@/lib/infrastructure/supabase/loyalty";

/** Ajustement manuel de points (admin). */
export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    userId?: string;
    delta?: number;
    note?: string;
  };
  const userId = String(body.userId ?? "").trim();
  const delta = Math.trunc(Number(body.delta));
  if (!userId || !Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await applyLoyaltyDelta({
    userId,
    delta,
    reason: "admin_adjust",
    meta: { note: String(body.note ?? "").slice(0, 200), by: auth.user.id },
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Adjust failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, balance: result.balance });
}
