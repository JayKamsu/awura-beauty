"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { useActionLock } from "@/lib/hooks/use-action-lock";

export function AdminNotificationsPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const { locked: pending, run } = useActionLock();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const loadCount = useCallback(async () => {
    const res = await adminFetch("/api/admin/notifications");
    if (!res.ok) return;
    const json = (await res.json()) as { subscriberCount?: number };
    setCount(json.subscriberCount ?? 0);
  }, [adminFetch]);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  const send = () => {
    void run(async () => {
      setFeedback(null);
      const res = await adminFetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, link }),
      });
      if (!res.ok) {
        setFeedback({ tone: "error", message: t("admin.notifications.error") });
        return;
      }
      const json = (await res.json()) as {
        count?: number;
        stub?: boolean;
      };
      setFeedback({
        tone: "success",
        message: json.stub
          ? t("admin.notifications.stub")
          : t("admin.notifications.success", { count: json.count ?? 0 }),
      });
      setTitle("");
      setBody("");
      setLink("");
      void loadCount();
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 md:px-6">
      <AdminPageHeader
        title={t("admin.notificationsTitle")}
        subtitle={t("admin.notificationsSubtitle")}
      />

      <p className="text-sm text-muted">
        {count > 0
          ? t("admin.notifications.subscribers", { count })
          : t("admin.notifications.emptyTokens")}
      </p>

      {feedback ? <AdminFeedback tone={feedback.tone} message={feedback.message} /> : null}

      <div className="space-y-4">
        <label className="block space-y-1 text-sm text-muted">
          <span>{t("admin.notifications.title")}</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-primary"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm text-muted">
          <span>{t("admin.notifications.body")}</span>
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-primary"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm text-muted">
          <span>{t("admin.notifications.link")}</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-primary"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/boutique"
          />
        </label>
        <Button
          type="button"
          pending={pending}
          disabled={!title.trim() || !body.trim()}
          onClick={send}
        >
          {pending
            ? t("admin.notifications.sending")
            : t("admin.notifications.send")}
        </Button>
      </div>
    </main>
  );
}
