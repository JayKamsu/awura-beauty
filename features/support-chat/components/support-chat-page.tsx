"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import type { SupportMessage } from "@/lib/connectors/support-chat";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { getSession } from "@/lib/infrastructure/supabase/auth";
import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";

export function SupportChatPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { locked: pending, run } = useActionLock();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const authHeaders = useCallback(async () => {
    const session = await getSession();
    if (!session?.access_token) return null;
    return {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const load = useCallback(async () => {
    const headers = await authHeaders();
    if (!headers) return;
    const res = await fetch("/api/support/conversation", { headers });
    if (!res.ok) return;
    const json = (await res.json()) as {
      conversation?: { id: string };
      messages?: SupportMessage[];
    };
    if (json.conversation?.id) setConversationId(json.conversation.id);
    setMessages(json.messages ?? []);
  }, [authHeaders]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [load, user]);

  useEffect(() => {
    if (!conversationId || !user) return;
    const supabase = createSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`support-page-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as SupportMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!conversationId || !draft.trim()) return;
    void run(async () => {
      const headers = await authHeaders();
      if (!headers) return;
      const res = await fetch("/api/support/conversation", {
        method: "POST",
        headers,
        body: JSON.stringify({ conversationId, body: draft }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { message?: SupportMessage };
      if (json.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === json.message!.id)
            ? prev
            : [...prev, json.message!],
        );
      }
      setDraft("");
    });
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-16 md:px-6">
        <p className="text-muted">{t("account.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-primary">
          {t("support.chat.title")}
        </h1>
        <p className="text-muted">{t("support.chat.loginRequired")}</p>
        <Button href="/compte/connexion">{t("auth.loginSubmit")}</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12 md:px-6">
      <div>
        <h1 className="font-serif text-3xl text-primary">
          {t("support.chat.title")}
        </h1>
        <p className="mt-2 text-muted">{t("support.chat.pageSubtitle")}</p>
      </div>

      <div className="flex min-h-[24rem] flex-col rounded-2xl border border-border">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted">{t("support.chat.empty")}</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  message.sender_role === "customer"
                    ? "ml-auto bg-primary text-background"
                    : "bg-background-alt text-primary"
                }`}
              >
                {message.body}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 border-t border-border p-3">
          <input
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("support.chat.placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
          />
          <Button
            type="button"
            pending={pending}
            disabled={!draft.trim()}
            onClick={send}
          >
            {t("support.chat.send")}
          </Button>
        </div>
      </div>
    </main>
  );
}
