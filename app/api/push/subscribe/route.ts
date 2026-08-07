import { NextResponse } from "next/server";
import { upsertPushSubscription } from "@/lib/infrastructure/supabase/push-subscriptions";
import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    userAgent?: string;
  };

  if (!body.token || body.token.length < 20) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  let userId: string | null = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const accessToken = authHeader.slice("Bearer ".length);
    const supabase = createSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser(accessToken);
      userId = data.user?.id ?? null;
    }
  }

  const result = await upsertPushSubscription({
    token: body.token,
    userId,
    userAgent: body.userAgent,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Subscribe failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
