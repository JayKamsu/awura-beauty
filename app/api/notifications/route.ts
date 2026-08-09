import { NextResponse } from "next/server";
import { getUserFromAccessToken } from "@/lib/infrastructure/supabase/admin-auth";
import {
  countUnreadInbox,
  deleteAllInbox,
  deleteInboxNotification,
  listInboxNotifications,
  markAllInboxRead,
  markInboxRead,
} from "@/lib/infrastructure/supabase/notifications-inbox";

function bearer(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : null;
}

export async function GET(request: Request) {
  const user = await getUserFromAccessToken(bearer(request));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unread] = await Promise.all([
    listInboxNotifications(user.id),
    countUnreadInbox(user.id),
  ]);

  return NextResponse.json({ notifications, unread });
}

export async function PATCH(request: Request) {
  const user = await getUserFromAccessToken(bearer(request));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; all?: boolean };
  if (body.all) {
    const ok = await markAllInboxRead(user.id);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "update failed" }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const ok = await markInboxRead(user.id, body.id);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "update failed" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const user = await getUserFromAccessToken(bearer(request));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all") === "1";

  if (all) {
    const ok = await deleteAllInbox(user.id);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "delete failed" }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const ok = await deleteInboxNotification(user.id, id);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "delete failed" }, { status: 400 });
}
