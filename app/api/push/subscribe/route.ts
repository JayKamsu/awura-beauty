import { NextResponse } from "next/server";
import {
  getUserFromAccessToken,
  isAdminUser,
} from "@/lib/infrastructure/supabase/admin-auth";
import { upsertPushSubscription } from "@/lib/infrastructure/supabase/push-subscriptions";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    userAgent?: string;
  };

  if (!body.token || body.token.length < 20) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const user = await getUserFromAccessToken(accessToken);

  const result = await upsertPushSubscription({
    token: body.token,
    userId: user?.id ?? null,
    userAgent: body.userAgent,
    isAdmin: isAdminUser(user),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Subscribe failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, isAdmin: isAdminUser(user) });
}
