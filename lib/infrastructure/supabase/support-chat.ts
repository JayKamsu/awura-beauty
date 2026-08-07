import {
  createAdminSupabaseClient,
  createSupabaseClient,
  getSupabaseEnv,
} from "@/lib/infrastructure/supabase/client";
import { createClient } from "@supabase/supabase-js";

export type SupportConversation = {
  id: string;
  user_id: string;
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
  last_message?: string | null;
  customer_email?: string | null;
};

export type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_role: "customer" | "admin";
  body: string;
  created_at: string;
};

function mapConversation(row: Record<string, unknown>): SupportConversation {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    status: row.status === "closed" ? "closed" : "open",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    last_message:
      row.last_message != null ? String(row.last_message) : undefined,
    customer_email:
      row.customer_email != null ? String(row.customer_email) : undefined,
  };
}

function mapMessage(row: Record<string, unknown>): SupportMessage {
  return {
    id: String(row.id),
    conversation_id: String(row.conversation_id),
    sender_id: row.sender_id ? String(row.sender_id) : null,
    sender_role: row.sender_role === "admin" ? "admin" : "customer",
    body: String(row.body),
    created_at: String(row.created_at),
  };
}

function clientWithToken(accessToken: string) {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured || !url || !anonKey) return null;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function userIdFromToken(accessToken: string): Promise<string | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function getOrCreateMyConversation(
  accessToken: string,
): Promise<{ conversation: SupportConversation | null; error: string | null }> {
  const userId = await userIdFromToken(accessToken);
  if (!userId) return { conversation: null, error: "Unauthorized" };

  const supabase = createAdminSupabaseClient() ?? clientWithToken(accessToken);
  if (!supabase) return { conversation: null, error: "Supabase not configured" };

  const { data: existing } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      conversation: mapConversation(existing as Record<string, unknown>),
      error: null,
    };
  }

  const { data: created, error } = await supabase
    .from("support_conversations")
    .insert({ user_id: userId, status: "open" })
    .select("*")
    .maybeSingle();

  if (error || !created) {
    return {
      conversation: null,
      error: error?.message ?? "Unable to create conversation",
    };
  }

  return {
    conversation: mapConversation(created as Record<string, unknown>),
    error: null,
  };
}

export async function listMyMessages(
  accessToken: string,
  conversationId: string,
): Promise<SupportMessage[]> {
  const userId = await userIdFromToken(accessToken);
  if (!userId) return [];

  const supabase = createAdminSupabaseClient() ?? clientWithToken(accessToken);
  if (!supabase) return [];

  const { data: conversation } = await supabase
    .from("support_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conversation) return [];

  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapMessage(row as Record<string, unknown>));
}

export async function sendCustomerMessage(input: {
  accessToken: string;
  conversationId: string;
  body: string;
}): Promise<{ message: SupportMessage | null; error: string | null }> {
  const userId = await userIdFromToken(input.accessToken);
  if (!userId) return { message: null, error: "Unauthorized" };

  const supabase = createAdminSupabaseClient() ?? clientWithToken(input.accessToken);
  if (!supabase) return { message: null, error: "Supabase not configured" };

  const text = input.body.trim();
  if (!text) return { message: null, error: "Empty message" };

  const { data: conversation } = await supabase
    .from("support_conversations")
    .select("id")
    .eq("id", input.conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conversation) {
    return { message: null, error: "Conversation not found" };
  }

  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: userId,
      sender_role: "customer",
      body: text,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { message: null, error: error?.message ?? "Send failed" };
  }

  await supabase
    .from("support_conversations")
    .update({ updated_at: new Date().toISOString(), status: "open" })
    .eq("id", input.conversationId);

  return { message: mapMessage(data as Record<string, unknown>), error: null };
}

export async function adminListConversations(): Promise<SupportConversation[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("support_conversations")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  const conversations = data.map((row) =>
    mapConversation(row as Record<string, unknown>),
  );

  const enriched = await Promise.all(
    conversations.map(async (conversation) => {
      const { data: last } = await supabase
        .from("support_messages")
        .select("body")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: user } = await supabase.auth.admin.getUserById(
        conversation.user_id,
      );

      return {
        ...conversation,
        last_message: last ? String((last as { body: string }).body) : null,
        customer_email: user.user?.email ?? null,
      };
    }),
  );

  return enriched;
}

export async function adminListMessages(
  conversationId: string,
): Promise<SupportMessage[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapMessage(row as Record<string, unknown>));
}

export async function adminSendMessage(input: {
  conversationId: string;
  adminUserId: string;
  body: string;
}): Promise<{ message: SupportMessage | null; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return { message: null, error: "Supabase not configured" };

  const text = input.body.trim();
  if (!text) return { message: null, error: "Empty message" };

  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.adminUserId === "dev-admin" ? null : input.adminUserId,
      sender_role: "admin",
      body: text,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { message: null, error: error?.message ?? "Send failed" };
  }

  await supabase
    .from("support_conversations")
    .update({ updated_at: new Date().toISOString(), status: "open" })
    .eq("id", input.conversationId);

  return { message: mapMessage(data as Record<string, unknown>), error: null };
}

export async function adminSetConversationStatus(
  conversationId: string,
  status: "open" | "closed",
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("support_conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return !error;
}
