"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import type { SupportMessage } from "@/lib/connectors/support-chat";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { getSession } from "@/lib/infrastructure/supabase/auth";
import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";

/** Widget flottant de chat support, repliable, avec messages en temps réel via Supabase Realtime. */
export function SupportChatWidget() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { locked: pending, run } = useActionLock();
  const [open, setOpen] = useState(false);
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
    if (!open || !user) return;
    void load();
  }, [load, open, user]);

  useEffect(() => {
    if (!open || !conversationId || !user) return;
    const supabase = createSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`support-${conversationId}`)
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
  }, [conversationId, open, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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

  if (loading) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 lg:bottom-4">
      {open ? (
        <div className="flex h-[28rem] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-serif text-lg text-primary">
              {t("support.chat.title")}
            </p>
            <button
              type="button"
              className="text-sm text-muted"
              onClick={() => setOpen(false)}
            >
              {t("support.chat.close")}
            </button>
          </div>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
              <p className="text-sm text-muted">{t("support.chat.loginRequired")}</p>
              <Button href="/compte/connexion" size="md">
                {t("auth.loginSubmit")}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
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
              <div className="border-t border-border p-3">
                <div className="flex gap-2">
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
                    size="md"
                    pending={pending}
                    disabled={!draft.trim()}
                    onClick={send}
                  >
                    {t("support.chat.send")}
                  </Button>
                </div>
                <Link
                  href="/compte/messages"
                  className="mt-2 inline-block text-xs text-accent"
                >
                  {t("support.chat.openFull")}
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-sm font-medium text-background shadow-lg"
      >
        {open ? t("support.chat.close") : t("support.chat.open")}
      </button>
    </div>
  );
}
