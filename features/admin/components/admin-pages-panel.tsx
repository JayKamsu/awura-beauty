"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import {
  PAGE_FIELD_KEYS,
  PAGE_LOCALES,
  type PageFieldKey,
  type PageLayout,
  type PageLocale,
  type PageSectionConfig,
  type PageSectionFields,
} from "@/lib/domain";

const PAGE_KEYS = ["home", "about"] as const;

function emptyFields(): PageSectionFields {
  return {
    title: "",
    subtitle: "",
    body: "",
    image_url: "",
    cta_label: "",
  };
}

function normalizeSection(section: PageSectionConfig): PageSectionConfig {
  const fieldsByLocale = { ...(section.fieldsByLocale ?? {}) };
  for (const locale of PAGE_LOCALES) {
    fieldsByLocale[locale] = {
      ...emptyFields(),
      ...(fieldsByLocale[locale] ?? {}),
    };
  }
  return { ...section, fieldsByLocale };
}

export function AdminPagesPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const { locked: pending, run } = useActionLock();
  const [pageKey, setPageKey] = useState<(typeof PAGE_KEYS)[number]>("home");
  const [editLocale, setEditLocale] = useState<PageLocale>("fr");
  const [sections, setSections] = useState<PageSectionConfig[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("[]");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await adminFetch("/api/admin/pages");
    const json = (await response.json()) as { layouts?: PageLayout[] };
    const layout =
      json.layouts?.find((item) => item.pageKey === pageKey) ??
      json.layouts?.[0];
    const next = (layout?.sections ?? []).map(normalizeSection);
    setSections(next);
    setSavedSnapshot(JSON.stringify(next));
    setExpanded(null);
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

  const updateField = (
    index: number,
    fieldKey: PageFieldKey,
    value: string,
  ) => {
    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== index) return section;
        const fieldsByLocale = { ...(section.fieldsByLocale ?? {}) };
        const current = {
          ...emptyFields(),
          ...(fieldsByLocale[editLocale] ?? {}),
        };
        current[fieldKey] = value;
        fieldsByLocale[editLocale] = current;
        return { ...section, fieldsByLocale };
      }),
    );
  };

  const uploadImage = async (index: number, file: File) => {
    const key = `${index}-${editLocale}`;
    setUploadingKey(key);
    setFeedback(null);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "pages");
    const response = await adminFetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    setUploadingKey(null);
    if (!response.ok) {
      setFeedback({ tone: "error", message: t("admin.uploadError") });
      return;
    }
    const json = (await response.json()) as { url?: string };
    if (json.url) updateField(index, "image_url", json.url);
  };

  const save = () => {
    void run(async () => {
      setFeedback(null);
      const response = await adminFetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, sections }),
      });
      if (!response.ok) {
        setFeedback({ tone: "error", message: t("admin.saveError") });
        return;
      }
      setSavedSnapshot(JSON.stringify(sections));
      setFeedback({ tone: "success", message: t("admin.saveSuccess") });
    });
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

      <div className="flex flex-wrap gap-2">
        {PAGE_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setEditLocale(locale)}
            className={`inline-flex min-h-10 items-center rounded-xl px-3 text-sm transition ${
              editLocale === locale
                ? "bg-accent text-background"
                : "border border-border text-muted hover:border-accent"
            }`}
          >
            {t(`admin.pages.locales.${locale}`)}
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
          {sections.map((section, index) => {
            const open = expanded === section.id;
            const fields = {
              ...emptyFields(),
              ...(section.fieldsByLocale?.[editLocale] ?? {}),
            };
            return (
              <li
                key={`${section.id}-${index}`}
                className="rounded-2xl border border-border px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() =>
                        setExpanded(open ? null : section.id)
                      }
                    >
                      {open
                        ? t("admin.pages.hideDetails")
                        : t("admin.pages.editDetails")}
                    </Button>
                  </div>
                </div>

                {open ? (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    {PAGE_FIELD_KEYS.map((fieldKey) => (
                      <label
                        key={fieldKey}
                        className="block space-y-1 text-sm text-muted"
                      >
                        <span>{t(`admin.pages.fields.${fieldKey}`)}</span>
                        {fieldKey === "body" ? (
                          <textarea
                            className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-primary"
                            value={fields[fieldKey] ?? ""}
                            onChange={(e) =>
                              updateField(index, fieldKey, e.target.value)
                            }
                          />
                        ) : (
                          <input
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-primary"
                            value={fields[fieldKey] ?? ""}
                            onChange={(e) =>
                              updateField(index, fieldKey, e.target.value)
                            }
                          />
                        )}
                      </label>
                    ))}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-accent">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadImage(index, file);
                            e.target.value = "";
                          }}
                        />
                        {uploadingKey === `${index}-${editLocale}`
                          ? t("admin.uploading")
                          : t("admin.pages.uploadImage")}
                      </label>
                      {fields.image_url ? (
                        <span className="truncate text-xs text-muted">
                          {fields.image_url}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:left-60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {dirty ? t("admin.unsavedChanges") : t("admin.allSaved")}
          </p>
          <Button type="button" pending={pending} disabled={!dirty} onClick={save}>
            {pending ? t("admin.saving") : t("admin.pages.save")}
          </Button>
        </div>
      </div>
    </main>
  );
}
