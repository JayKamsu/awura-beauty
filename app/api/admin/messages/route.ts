import { NextResponse } from "next/server";
import {
  adminListConversations,
  adminListMessages,
  adminSendMessage,
  adminSetConversationStatus,
} from "@/lib/connectors/support-chat";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");

  if (conversationId) {
    const messages = await adminListMessages(conversationId);
    return NextResponse.json({ messages });
  }

  const conversations = await adminListConversations();
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    conversationId?: string;
    body?: string;
    status?: "open" | "closed";
  };

  if (!body.conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }

  if (body.status) {
    const ok = await adminSetConversationStatus(body.conversationId, body.status);
    return NextResponse.json({ ok });
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const result = await adminSendMessage({
    conversationId: body.conversationId,
    adminUserId: auth.user.id,
    body: body.body,
  });

  if (!result.message) {
    return NextResponse.json(
      { error: result.error ?? "Send failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: result.message });
}
