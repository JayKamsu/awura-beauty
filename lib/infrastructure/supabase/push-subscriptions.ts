import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";

export type PushSubscriptionRow = {
  id: string;
  fcm_token: string;
  user_id: string | null;
  user_agent: string;
  is_admin: boolean;
};

export async function upsertPushSubscription(input: {
  token: string;
  userId?: string | null;
  userAgent?: string;
  isAdmin?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  // service_role pour upsert fiable (insert + update last_seen / user_id)
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured" };

  const now = new Date().toISOString();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      fcm_token: input.token,
      user_id: input.userId ?? null,
      user_agent: input.userAgent ?? "",
      is_admin: Boolean(input.isAdmin),
      last_seen_at: now,
    },
    { onConflict: "fcm_token" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listAllPushTokens(): Promise<string[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("fcm_token");

  if (error || !data) return [];
  return data
    .map((row) => String((row as { fcm_token: string }).fcm_token))
    .filter(Boolean);
}

export async function listPushTokensForUser(userId: string): Promise<string[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("fcm_token")
    .eq("user_id", userId);

  if (error || !data) return [];
  return data
    .map((row) => String((row as { fcm_token: string }).fcm_token))
    .filter(Boolean);
}

export async function listAdminPushTokens(): Promise<string[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("fcm_token")
    .eq("is_admin", true);

  if (error || !data) return [];
  return data
    .map((row) => String((row as { fcm_token: string }).fcm_token))
    .filter(Boolean);
}

export async function listPushUserIds(): Promise<string[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("user_id")
    .not("user_id", "is", null);
  if (error || !data) return [];
  return Array.from(
    new Set(
      data
        .map((row) => (row as { user_id: string | null }).user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
}

export async function listAdminPushUserIds(): Promise<string[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("user_id")
    .eq("is_admin", true)
    .not("user_id", "is", null);
  if (error || !data) return [];
  return Array.from(
    new Set(
      data
        .map((row) => (row as { user_id: string | null }).user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
}

export async function deletePushTokens(tokens: string[]): Promise<void> {
  if (!tokens.length) return;
  const supabase = createAdminSupabaseClient();
  if (!supabase) return;
  await supabase.from("push_subscriptions").delete().in("fcm_token", tokens);
}
