import { NextResponse } from "next/server";
import { broadcastPush } from "@/lib/connectors/firebase";
import { firebaseNotificationAdapter } from "@/lib/connectors/firebase";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  listAllPushTokens,
  listPushTokensForUser,
} from "@/lib/infrastructure/supabase/push-subscriptions";

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
    userId?: string;
  };

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: "title and body required" },
      { status: 400 },
    );
  }

  const title = body.title.trim();
  const message = body.body.trim();
  const link = body.link?.trim() || undefined;
  const userId = body.userId?.trim() || undefined;

  if (userId) {
    const tokens = await listPushTokensForUser(userId);
    const result = await firebaseNotificationAdapter.send({
      userId,
      title,
      body: message,
      channel: "push",
      data: link ? { link } : undefined,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Send failed" },
        { status: 400 },
      );
    }
    return NextResponse.json({
      ok: true,
      count: tokens.length,
      stub: result.stub ?? false,
    });
  }

  const result = await broadcastPush({ title, body: message, link });

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
