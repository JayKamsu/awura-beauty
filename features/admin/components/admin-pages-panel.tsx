"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import type { PageLayout, PageSectionConfig } from "@/lib/domain";

const PAGE_KEYS = ["home", "about"] as const;

export function AdminPagesPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const [pageKey, setPageKey] = useState<(typeof PAGE_KEYS)[number]>("home");
  const [sections, setSections] = useState<PageSectionConfig[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await adminFetch("/api/admin/pages");
    const json = (await response.json()) as { layouts?: PageLayout[] };
    const layout =
      json.layouts?.find((item) => item.pageKey === pageKey) ??
      json.layouts?.[0];
    setSections(layout?.sections ?? []);
    setLoading(false);
  }, [adminFetch, pageKey]);

  useEffect(() => {
    void load();
  }, [load]);

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
    setMessage(null);
    const response = await adminFetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageKey, sections }),
    });
    if (!response.ok) {
      setMessage(t("admin.saveError"));
      return;
    }
    setMessage(t("admin.saveSuccess"));
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6">
      <header className="space-y-2">
        <h1 className="font-serif text-4xl text-primary">{t("admin.pagesTitle")}</h1>
        <p className="text-muted">{t("admin.pagesSubtitle")}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PAGE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPageKey(key)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              pageKey === key
                ? "bg-primary text-background"
                : "border border-border text-muted hover:border-accent"
            }`}
          >
            {t(`admin.pages.keys.${key}`)}
          </button>
        ))}
      </div>

      {message ? (
        <p className="rounded-xl bg-background-alt px-4 py-3 text-sm text-primary">
          {message}
        </p>
      ) : null}

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

      <Button type="button" onClick={() => void save()}>
        {t("admin.pages.save")}
      </Button>
    </main>
  );
}
