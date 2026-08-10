"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DuafeMark } from "@/components/brand/duafe-mark";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import type { QrDefaultMode, SiteBrandSettings } from "@/lib/domain/site-brand";
import { DEFAULT_SITE_BRAND } from "@/lib/domain/site-brand";

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

/** Panneau admin pour configurer l'identité de marque : logos, QR code par défaut et univers enfant. */
export function AdminBrandPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const [form, setForm] = useState<SiteBrandSettings>(DEFAULT_SITE_BRAND);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/brand");
    const json = (await res.json()) as { settings?: SiteBrandSettings };
    if (res.ok && json.settings) setForm(json.settings);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    const res = await adminFetch("/api/admin/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = (await res.json()) as {
      settings?: SiteBrandSettings;
      error?: string;
    };
    setSaving(false);
    if (!res.ok) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.saveError"),
      });
      return;
    }
    if (json.settings) setForm(json.settings);
    setFeedback({ tone: "success", message: t("admin.saveSuccess") });
  };

  const uploadField = async (
    field: keyof Pick<
      SiteBrandSettings,
      "duafeUrl" | "logoLightUrl" | "logoDarkUrl" | "logoAccentUrl"
    >,
    file: File | null,
  ) => {
    if (!file) return;
    setUploading(field);
    const body = new FormData();
    body.append("file", file);
    body.append("folder", "brand");
    const res = await adminFetch("/api/admin/upload", {
      method: "POST",
      body,
    });
    const json = (await res.json()) as { url?: string; error?: string };
    setUploading(null);
    if (!res.ok || !json.url) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.saveError"),
      });
      return;
    }
    setForm((prev) => ({ ...prev, [field]: json.url! }));
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-muted">{t("admin.loading")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6">
      <AdminPageHeader
        title={t("admin.brandTitle")}
        subtitle={t("admin.brandSubtitle")}
      />
      {feedback ? (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      ) : null}

      <section className="space-y-4 rounded-2xl border border-border p-5">
        <h2 className="font-serif text-2xl text-primary">
          {t("admin.brandDuafe")}
        </h2>
        <div className="flex items-center gap-4 text-primary">
          <DuafeMark src={form.duafeUrl || null} className="size-16 text-accent" />
          <p className="text-sm text-muted">{t("admin.brandDuafeHint")}</p>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{t("admin.fields.duafe_url")}</span>
          <input
            className={fieldClass}
            value={form.duafeUrl}
            onChange={(e) => setForm({ ...form, duafeUrl: e.target.value })}
          />
        </label>
        <input
          type="file"
          accept="image/*"
          disabled={uploading === "duafeUrl"}
          onChange={(e) => void uploadField("duafeUrl", e.target.files?.[0] ?? null)}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-border p-5">
        <h2 className="font-serif text-2xl text-primary">
          {t("admin.brandLogos")}
        </h2>
        <p className="text-sm text-muted">{t("admin.brandLogosHint")}</p>
        {(
          [
            ["logoLightUrl", "logo_light_url"],
            ["logoDarkUrl", "logo_dark_url"],
            ["logoAccentUrl", "logo_accent_url"],
          ] as const
        ).map(([field, labelKey]) => (
          <div key={field} className="space-y-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted">{t(`admin.fields.${labelKey}`)}</span>
              <input
                className={fieldClass}
                value={form[field]}
                onChange={(e) =>
                  setForm({ ...form, [field]: e.target.value })
                }
              />
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={uploading === field}
              onChange={(e) =>
                void uploadField(field, e.target.files?.[0] ?? null)
              }
            />
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border border-border p-5">
        <h2 className="font-serif text-2xl text-primary">
          {t("admin.brandQr")}
        </h2>
        <p className="text-sm text-muted">{t("admin.brandQrHint")}</p>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">{t("admin.fields.qr_default_mode")}</span>
          <select
            className={fieldClass}
            value={form.qrDefaultMode}
            onChange={(e) =>
              setForm({
                ...form,
                qrDefaultMode: e.target.value as QrDefaultMode,
              })
            }
          >
            <option value="tutorials">{t("admin.qrMode.tutorials")}</option>
            <option value="product">{t("admin.qrMode.product")}</option>
            <option value="diagnostic">{t("admin.qrMode.diagnostic")}</option>
            <option value="custom">{t("admin.qrMode.custom")}</option>
          </select>
        </label>
        {form.qrDefaultMode === "custom" ? (
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{t("admin.fields.qr_custom_url")}</span>
            <input
              className={fieldClass}
              value={form.qrCustomUrl}
              onChange={(e) =>
                setForm({ ...form, qrCustomUrl: e.target.value })
              }
            />
          </label>
        ) : null}
        <p className="text-xs text-muted">{t("admin.brandQrOverrideHint")}</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-border p-5">
        <h2 className="font-serif text-2xl text-primary">
          {t("admin.brandUniverse")}
        </h2>
        <p className="text-sm text-muted">{t("admin.brandUniverseHint")}</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.childUniverseEnabled}
            onChange={(e) =>
              setForm({ ...form, childUniverseEnabled: e.target.checked })
            }
          />
          <span className="text-muted">{t("admin.brandChildEnabled")}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.showDuafePattern}
            onChange={(e) =>
              setForm({ ...form, showDuafePattern: e.target.checked })
            }
          />
          <span className="text-muted">{t("admin.brandShowPattern")}</span>
        </label>
      </section>

      <Button type="button" pending={saving} onClick={() => void save()}>
        {t("admin.save")}
      </Button>
    </main>
  );
}
