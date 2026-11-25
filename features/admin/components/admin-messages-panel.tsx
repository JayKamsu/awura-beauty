"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import type {
  SupportConversation,
  SupportMessage,
} from "@/lib/connectors/support-chat";
import { useActionLock } from "@/lib/hooks/use-action-lock";

function threadOf(active: SupportConversation | null): SupportMessage[] {
  if (!active) return [];
  if (active.messages && active.messages.length > 0) return active.messages;
  const preview = active.last_message?.trim();
  if (!preview) return [];
  return [
    {
      id: `${active.id}-last`,
      conversation_id: active.id,
      sender_id: null,
      sender_role: "customer",
      body: preview,
      created_at: active.updated_at,
    },
  ];
}

/** Panneau admin de messagerie support : liste des conversations et échange de messages en quasi temps réel. */
export function AdminMessagesPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const { locked: pending, run } = useActionLock();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await adminFetch("/api/admin/messages", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { conversations?: SupportConversation[] };
    setConversations(json.conversations ?? []);
  }, [adminFetch]);

  useEffect(() => {
    void loadConversations();
    const timer = window.setInterval(() => void loadConversations(), 4000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  const send = () => {
    if (!activeId || !draft.trim()) return;
    void run(async () => {
      const res = await adminFetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, body: draft }),
      });
      if (!res.ok) return;
      setDraft("");
      await loadConversations();
    });
  };

  const setStatus = async (status: "open" | "closed") => {
    if (!activeId) return;
    await adminFetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, status }),
    });
    await loadConversations();
  };

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const thread = threadOf(active);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, thread.length]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:px-6">
      <AdminPageHeader
        title={t("admin.messagesTitle")}
        subtitle={t("admin.messagesSubtitle")}
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <ul className="space-y-2">
          {conversations.length === 0 ? (
            <AdminEmptyState message={t("admin.messages.empty")} />
          ) : (
            conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    activeId === conversation.id
                      ? "border-accent bg-background-alt"
                      : "border-border hover:border-accent"
                  }`}
                >
                  <p className="truncate text-sm font-medium text-primary">
                    {conversation.customer_email ?? t("admin.messages.customer")}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {conversation.last_message?.trim()
                      ? conversation.last_message
                      : t("admin.messages.noPreview")}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex h-[32rem] min-h-0 flex-col overflow-hidden rounded-2xl border border-border">
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <p className="text-muted">{t("admin.messages.select")}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <p className="font-medium text-primary">
                    {active.customer_email ?? t("admin.messages.customer")}
                  </p>
                  <p className="text-xs text-muted">
                    {active.status === "open"
                      ? t("admin.messages.statusOpen")
                      : t("admin.messages.statusClosed")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() =>
                    void setStatus(active.status === "open" ? "closed" : "open")
                  }
                >
                  {active.status === "open"
                    ? t("admin.messages.close")
                    : t("admin.messages.open")}
                </Button>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {thread.length === 0 ? (
                  <p className="text-sm text-muted">
                    {t("admin.messages.threadEmpty")}
                  </p>
                ) : (
                  thread.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[80%] rounded-2xl border px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                        message.sender_role === "admin"
                          ? "ml-auto border-primary bg-primary text-background"
                          : "border-border bg-background-alt text-primary"
                      }`}
                    >
                      <p className="mb-1 text-[10px] uppercase opacity-70">
                        {message.sender_role === "admin"
                          ? t("admin.messages.you")
                          : t("admin.messages.customer")}
                      </p>
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
                  placeholder={t("admin.messages.placeholder")}
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
                  {t("admin.messages.reply")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
