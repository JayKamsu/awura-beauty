import { NextResponse } from "next/server";
import {
  getOrCreateMyConversation,
  listMyMessages,
  sendCustomerMessage,
} from "@/lib/connectors/support-chat";

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export async function GET(request: Request) {
  const token = bearer(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getOrCreateMyConversation(token);
  if (!result.conversation) {
    return NextResponse.json(
      { error: result.error ?? "Failed" },
      { status: result.error === "Unauthorized" ? 401 : 400 },
    );
  }

  const messages = await listMyMessages(token, result.conversation.id);
  return NextResponse.json({
    conversation: result.conversation,
    messages,
  });
}

export async function POST(request: Request) {
  const token = bearer(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    conversationId?: string;
    body?: string;
  };

  if (!body.conversationId || !body.body?.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await sendCustomerMessage({
    accessToken: token,
    conversationId: body.conversationId,
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
