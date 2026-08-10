import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";

/** Notification en boîte de réception utilisateur (in-app), distincte des push notifications. */
export type InboxNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): InboxNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    link: String(row.link ?? ""),
    readAt: row.read_at ? String(row.read_at) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

/** Mémoire démo sans Supabase. */
let demoStore: InboxNotification[] = [];

/** Crée une notification pour plusieurs utilisateurs. Bascule sur un store en mémoire (démo) si Supabase n'est pas configuré. */
export async function createInboxNotifications(input: {
  userIds: string[];
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  const unique = Array.from(new Set(input.userIds.filter(Boolean)));
  if (!unique.length) return;

  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const rows = unique.map((userId) => ({
      user_id: userId,
      title: input.title,
      body: input.body,
      link: input.link ?? "",
    }));
    await supabase.from("notifications").insert(rows);
    return;
  }

  const now = new Date().toISOString();
  demoStore = [
    ...unique.map((userId, index) => ({
      id: `demo-${Date.now()}-${index}`,
      userId,
      title: input.title,
      body: input.body,
      link: input.link ?? "",
      readAt: null,
      createdAt: now,
    })),
    ...demoStore,
  ].slice(0, 200);
}

/** Notifications d'un utilisateur, les plus récentes d'abord. */
export async function listInboxNotifications(
  userId: string,
  limit = 40,
): Promise<InboxNotification[]> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("notifications")
      .select("id,user_id,title,body,link,read_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => mapRow(row as Record<string, unknown>));
  }
  return demoStore
    .filter((item) => item.userId === userId)
    .slice(0, limit);
}

/** Nombre de notifications non lues d'un utilisateur (badge). */
export async function countUnreadInbox(userId: string): Promise<number> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) return 0;
    return count ?? 0;
  }
  return demoStore.filter((item) => item.userId === userId && !item.readAt)
    .length;
}

/** Marque une notification comme lue. Scopée par userId pour empêcher un utilisateur de modifier la notif d'un autre. */
export async function markInboxRead(
  userId: string,
  id: string,
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    return !error;
  }
  demoStore = demoStore.map((item) =>
    item.id === id && item.userId === userId
      ? { ...item, readAt: new Date().toISOString() }
      : item,
  );
  return true;
}

/** Marque toutes les notifications non lues d'un utilisateur comme lues. */
export async function markAllInboxRead(userId: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
    return !error;
  }
  const now = new Date().toISOString();
  demoStore = demoStore.map((item) =>
    item.userId === userId && !item.readAt ? { ...item, readAt: now } : item,
  );
  return true;
}

/** Supprime une notification. Scopée par userId pour empêcher un utilisateur de supprimer la notif d'un autre. */
export async function deleteInboxNotification(
  userId: string,
  id: string,
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    return !error;
  }
  demoStore = demoStore.filter(
    (item) => !(item.id === id && item.userId === userId),
  );
  return true;
}

/** Supprime toutes les notifications d'un utilisateur (vider la boîte de réception). */
export async function deleteAllInbox(userId: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);
    return !error;
  }
  demoStore = demoStore.filter((item) => item.userId !== userId);
  return true;
}
