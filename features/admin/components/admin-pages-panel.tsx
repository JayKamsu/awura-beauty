"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import {
  SECTION_EDITABLE_FIELDS,
  SECTION_USES_BLOCKS,
} from "@/features/cms/context/page-cms-context";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import {
  type PageFieldKey,
  type PageLayout,
  type PageLocale,
  type PageSectionConfig,
  type PageSectionFields,
  type PageSectionId,
  PAGE_LOCALES,
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

function isRemoteOrLocalImage(src: string): boolean {
  return (
    src.startsWith("/") ||
    src.startsWith("https://") ||
    src.startsWith("http://")
  );
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

  const uploadImage = async (
    index: number,
    file: File,
    mode: "field" | "append_block",
  ) => {
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
    if (!json.url) return;

    if (mode === "append_block") {
      const section = sections[index];
      const current =
        section?.fieldsByLocale?.[editLocale]?.body?.trim() ?? "";
      const line = `image:${json.url}`;
      const nextBody = current ? `${current}\n${line}` : line;
      updateField(index, "body", nextBody);
      setFeedback({
        tone: "success",
        message: t("admin.pages.imageAppended"),
      });
      return;
    }

    updateField(index, "image_url", json.url);
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

      <p className="rounded-2xl bg-background-alt px-4 py-3 text-sm text-muted">
        {t("admin.pages.help")}
      </p>

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

      {feedback ? (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      ) : null}

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
            const editable =
              SECTION_EDITABLE_FIELDS[section.id as PageSectionId] ?? [];
            const usesBlocks = Boolean(
              SECTION_USES_BLOCKS[section.id as PageSectionId],
            );
            const showImageField = editable.includes("image_url");

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
                    <p className="text-xs text-muted">
                      {t(`admin.pages.sectionHints.${section.id}`, {
                        defaultValue: "",
                      })}
                    </p>
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
                      onClick={() => setExpanded(open ? null : section.id)}
                    >
                      {open
                        ? t("admin.pages.hideDetails")
                        : t("admin.pages.editDetails")}
                    </Button>
                  </div>
                </div>

                {open ? (
                  <div className="mt-4 space-y-4 border-t border-border pt-4">
                    {usesBlocks ? (
                      <p className="rounded-xl bg-background-alt px-3 py-2 text-xs text-muted">
                        {t("admin.pages.blocksHint")}
                      </p>
                    ) : null}

                    {editable
                      .filter((fieldKey) => fieldKey !== "image_url")
                      .map((fieldKey) => (
                        <label
                          key={fieldKey}
                          className="block space-y-1 text-sm text-muted"
                        >
                          <span>{t(`admin.pages.fields.${fieldKey}`)}</span>
                          {fieldKey === "body" ? (
                            <textarea
                              className="min-h-32 w-full rounded-xl border border-border bg-background px-3 py-2 text-primary"
                              value={fields[fieldKey] ?? ""}
                              onChange={(e) =>
                                updateField(index, fieldKey, e.target.value)
                              }
                              placeholder={
                                usesBlocks
                                  ? t("admin.pages.blocksPlaceholder")
                                  : undefined
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

                    {showImageField ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted">
                          {t("admin.pages.fields.image_url")}
                        </p>
                        {fields.image_url &&
                        isRemoteOrLocalImage(fields.image_url) ? (
                          <div className="relative h-36 w-full max-w-sm overflow-hidden rounded-2xl bg-background-alt">
                            <Image
                              src={fields.image_url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="320px"
                              unoptimized={fields.image_url.startsWith("http")}
                            />
                          </div>
                        ) : null}
                        <input
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary"
                          value={fields.image_url ?? ""}
                          onChange={(e) =>
                            updateField(index, "image_url", e.target.value)
                          }
                          placeholder="https://… ou /images/…"
                        />
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex cursor-pointer items-center rounded-xl border border-accent px-3 py-2 text-sm text-accent">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void uploadImage(index, file, "field");
                                e.target.value = "";
                              }}
                            />
                            {uploadingKey === `${index}-${editLocale}`
                              ? t("admin.uploading")
                              : t("admin.pages.uploadImage")}
                          </label>
                          {fields.image_url ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="md"
                              onClick={() => updateField(index, "image_url", "")}
                            >
                              {t("admin.pages.clearImage")}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {usesBlocks ? (
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center rounded-xl border border-accent px-3 py-2 text-sm text-accent">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void uploadImage(index, file, "append_block");
                              }
                              e.target.value = "";
                            }}
                          />
                          {uploadingKey === `${index}-${editLocale}`
                            ? t("admin.uploading")
                            : t("admin.pages.uploadImageToBlock")}
                        </label>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:bottom-0 lg:left-60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {dirty ? t("admin.unsavedChanges") : t("admin.allSaved")}
          </p>
          <Button
            type="button"
            pending={pending}
            disabled={!dirty}
            onClick={save}
          >
            {pending ? t("admin.saving") : t("admin.pages.save")}
          </Button>
        </div>
      </div>
    </main>
  );
}
