import { NextResponse } from "next/server";
import { broadcastPush } from "@/lib/connectors/firebase";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import { listAllPushTokens } from "@/lib/infrastructure/supabase/push-subscriptions";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const tokens = await listAllPushTokens();
  return NextResponse.json({ subscriberCount: tokens.length });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    title?: string;
    body?: string;
    link?: string;
  };

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: "title and body required" },
      { status: 400 },
    );
  }

  const result = await broadcastPush({
    title: body.title.trim(),
    body: body.body.trim(),
    link: body.link?.trim() || undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Send failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    count: result.count,
    stub: result.stub ?? false,
  });
}
