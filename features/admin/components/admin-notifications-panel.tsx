"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import type { AdminCustomer } from "@/lib/infrastructure/supabase/admin-dashboard";

const TEMPLATE_KEYS = [
  "promo",
  "newProduct",
  "restock",
  "diagnostic",
  "orderShipped",
] as const;

type TemplateKey = (typeof TEMPLATE_KEYS)[number] | "custom";
type Audience = "all" | "one";

export function AdminNotificationsPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const { locked: pending, run } = useActionLock();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [templateKey, setTemplateKey] = useState<TemplateKey>("custom");
  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [audience, setAudience] = useState<Audience>("all");
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  const loadCount = useCallback(async () => {
    const res = await adminFetch("/api/admin/notifications");
    if (!res.ok) return;
    const json = (await res.json()) as { subscriberCount?: number };
    setCount(json.subscriberCount ?? 0);
  }, [adminFetch]);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  useEffect(() => {
    if (audience !== "one" || customersLoaded) return;
    void (async () => {
      const res = await adminFetch("/api/admin/customers");
      if (!res.ok) return;
      const json = (await res.json()) as { customers?: AdminCustomer[] };
      setCustomers(json.customers ?? []);
      setCustomersLoaded(true);
    })();
  }, [adminFetch, audience, customersLoaded]);

  const filteredCustomers = useMemo(() => {
    const q = recipientQuery.trim().toLowerCase();
    const withAccount = customers.filter((c) => c.userId);
    if (!q) return withAccount.slice(0, 20);
    return withAccount
      .filter((c) =>
        [c.email, c.fullName ?? ""].join(" ").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [customers, recipientQuery]);

  const applyTemplate = (key: TemplateKey) => {
    setTemplateKey(key);
    if (key === "custom") {
      setTitle("");
      setBody("");
      setLink("");
      return;
    }
    setTitle(t(`admin.notifications.templates.${key}.title`));
    setBody(t(`admin.notifications.templates.${key}.body`));
    setLink(t(`admin.notifications.templates.${key}.link`));
  };

  const send = () => {
    void run(async () => {
      setFeedback(null);
      const res = await adminFetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          link,
          userId: audience === "one" ? selected?.userId ?? undefined : undefined,
        }),
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
          : audience === "one" && selected
            ? t("admin.notifications.successOne", {
                name: selected.fullName ?? selected.email,
              })
            : t("admin.notifications.success", { count: json.count ?? 0 }),
      });
      setTitle("");
      setBody("");
      setLink("");
      setTemplateKey("custom");
      setSelected(null);
      void loadCount();
    });
  };

  const canSend =
    title.trim() && body.trim() && (audience === "all" || Boolean(selected?.userId));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6">
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

      <section className="space-y-3 rounded-2xl border border-border p-5">
        <div>
          <h2 className="font-serif text-xl text-primary">
            {t("admin.notifications.templatesLabel")}
          </h2>
          <p className="text-sm text-muted">{t("admin.notifications.templatesHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyTemplate("custom")}
            className={`inline-flex min-h-10 items-center rounded-xl px-3.5 text-sm transition ${
              templateKey === "custom"
                ? "bg-primary text-background"
                : "border border-border text-muted hover:border-accent"
            }`}
          >
            {t("admin.notifications.templateCustom")}
          </button>
          {TEMPLATE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => applyTemplate(key)}
              className={`inline-flex min-h-10 items-center rounded-xl px-3.5 text-sm transition ${
                templateKey === key
                  ? "bg-primary text-background"
                  : "border border-border text-muted hover:border-accent"
              }`}
            >
              {t(`admin.notifications.templates.${key}.label`)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border p-5">
        <h2 className="font-serif text-xl text-primary">
          {t("admin.notifications.audienceLabel")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setAudience("all")}
            className={`rounded-2xl border p-4 text-left transition ${
              audience === "all"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/60"
            }`}
          >
            <p className="font-medium text-primary">
              {t("admin.notifications.audienceAll")}
            </p>
            <p className="text-xs text-muted">{t("admin.notifications.audienceAllHint")}</p>
          </button>
          <button
            type="button"
            onClick={() => setAudience("one")}
            className={`rounded-2xl border p-4 text-left transition ${
              audience === "one"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/60"
            }`}
          >
            <p className="font-medium text-primary">
              {t("admin.notifications.audienceOne")}
            </p>
            <p className="text-xs text-muted">{t("admin.notifications.audienceOneHint")}</p>
          </button>
        </div>

        {audience === "one" ? (
          <div className="space-y-3 border-t border-border pt-4">
            {selected ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background-alt px-4 py-3">
                <div>
                  <p className="text-xs text-muted">
                    {t("admin.notifications.recipientSelected")}
                  </p>
                  <p className="font-medium text-primary">
                    {selected.fullName ?? selected.email}
                  </p>
                  {selected.fullName ? (
                    <p className="text-xs text-muted">{selected.email}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setSelected(null)}
                >
                  {t("admin.notifications.recipientChange")}
                </Button>
              </div>
            ) : (
              <>
                <AdminSearchField
                  value={recipientQuery}
                  onChange={setRecipientQuery}
                  placeholder={t("admin.notifications.recipientSearchPlaceholder")}
                />
                {!customersLoaded ? (
                  <p className="text-sm text-muted">{t("admin.loading")}</p>
                ) : filteredCustomers.length === 0 ? (
                  <AdminEmptyState message={t("admin.notifications.recipientNoResults")} />
                ) : (
                  <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border">
                    {filteredCustomers.map((customer) => (
                      <li key={customer.email}>
                        <button
                          type="button"
                          onClick={() => setSelected(customer)}
                          className="flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left text-sm transition hover:bg-background-alt"
                        >
                          <span className="font-medium text-primary">
                            {customer.fullName ?? customer.email}
                          </span>
                          {customer.fullName ? (
                            <span className="text-xs text-muted">{customer.email}</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {selected && !selected.userId ? (
              <p className="text-xs text-accent">
                {t("admin.notifications.recipientNoPush")}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-border p-5">
        <label className="block space-y-1 text-sm text-muted">
          <span>{t("admin.notifications.title")}</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-primary"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTemplateKey("custom");
            }}
          />
        </label>
        <label className="block space-y-1 text-sm text-muted">
          <span>{t("admin.notifications.body")}</span>
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-primary"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setTemplateKey("custom");
            }}
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
        <Button type="button" pending={pending} disabled={!canSend} onClick={send}>
          {pending ? t("admin.notifications.sending") : t("admin.notifications.send")}
        </Button>
      </section>
    </main>
  );
}
