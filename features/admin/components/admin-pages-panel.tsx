"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import type { PageLayout, PageSectionConfig } from "@/lib/domain";

const PAGE_KEYS = ["home", "about"] as const;

export function AdminPagesPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const [pageKey, setPageKey] = useState<(typeof PAGE_KEYS)[number]>("home");
  const [sections, setSections] = useState<PageSectionConfig[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("[]");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await adminFetch("/api/admin/pages");
    const json = (await response.json()) as { layouts?: PageLayout[] };
    const layout =
      json.layouts?.find((item) => item.pageKey === pageKey) ??
      json.layouts?.[0];
    const next = layout?.sections ?? [];
    setSections(next);
    setSavedSnapshot(JSON.stringify(next));
    setLoading(false);
  }, [adminFetch, pageKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(
    () => JSON.stringify(sections) !== savedSnapshot,
    [savedSnapshot, sections],
  );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const toggle = (index: number) => {
    setSections((prev) =>
      prev.map((section, i) =>
        i === index ? { ...section, enabled: !section.enabled } : section,
      ),
    );
  };

  const save = async () => {
    setPending(true);
    setFeedback(null);
    const response = await adminFetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageKey, sections }),
    });
    setPending(false);
    if (!response.ok) {
      setFeedback({ tone: "error", message: t("admin.saveError") });
      return;
    }
    setSavedSnapshot(JSON.stringify(sections));
    setFeedback({ tone: "success", message: t("admin.saveSuccess") });
  };

  return (
    <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 pb-28 md:px-6">
      <AdminPageHeader
        title={t("admin.pagesTitle")}
        subtitle={t("admin.pagesSubtitle")}
      />

      <div className="flex flex-wrap gap-2">
        {PAGE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPageKey(key)}
            className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm transition ${
              pageKey === key
                ? "bg-primary text-background"
                : "border border-border text-muted hover:border-accent"
            }`}
          >
            {t(`admin.pages.keys.${key}`)}
          </button>
        ))}
      </div>

      {dirty ? (
        <p className="text-sm text-accent" role="status">
          {t("admin.unsavedChanges")}
        </p>
      ) : null}

      {feedback ? <AdminFeedback tone={feedback.tone} message={feedback.message} /> : null}

      {loading ? (
        <p className="text-muted">{t("admin.loading")}</p>
      ) : (
        <ul className="space-y-3">
          {sections.map((section, index) => (
            <li
              key={`${section.id}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
            >
              <div>
                <p className="font-medium text-primary">
                  {t(`admin.pages.sections.${section.id}`)}
                </p>
                <p className="text-xs text-muted">{section.id}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  {t("admin.pages.moveUp")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  disabled={index === sections.length - 1}
                  onClick={() => move(index, 1)}
                >
                  {t("admin.pages.moveDown")}
                </Button>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => toggle(index)}
                  />
                  {section.enabled
                    ? t("admin.pages.visible")
                    : t("admin.pages.hidden")}
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:left-60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {dirty ? t("admin.unsavedChanges") : t("admin.allSaved")}
          </p>
          <Button type="button" disabled={pending || !dirty} onClick={() => void save()}>
            {pending ? t("admin.saving") : t("admin.pages.save")}
          </Button>
        </div>
      </div>
    </main>
  );
}
