"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminDiagnosticQuestionsEditor } from "@/features/admin/components/admin-diagnostic-questions-editor";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { AWURA_PRODUCT_SLUGS } from "@/lib/application/diagnostic/recommend";
import type {
  DiagnosticAppointment,
  DiagnosticAppointmentStatus,
  DiagnosticAvailabilityRule,
  DiagnosticPhoto,
  DiagnosticQuestion,
  DiagnosticSettings,
  DiagnosticSlotOverride,
} from "@/lib/domain/diagnostic";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { AdminDiagnosticListItem } from "@/lib/infrastructure/supabase/diagnostic-admin";

const PHOTO_ANGLE_LABELS: Record<string, string> = {
  face: "Face",
  profil_gauche: "Profil G.",
  profil_droit: "Profil D.",
  arriere: "Arrière",
  pointes: "Pointes",
};

/** Miniatures des photos jointes à un diagnostic/RDV — charge les URLs signées à la demande. */
function DiagnosticPhotosStrip({
  photos,
  adminFetch,
}: {
  photos: DiagnosticPhoto[];
  adminFetch: ReturnType<typeof useAdminFetch>;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadUrls = async () => {
    setLoading(true);
    const entries = await Promise.all(
      photos.map(async (p) => {
        const res = await adminFetch(
          `/api/admin/diagnostic/photo-preview?path=${encodeURIComponent(p.path)}`,
        );
        const json = (await res.json()) as { url?: string };
        return [p.path, json.url ?? ""] as const;
      }),
    );
    setUrls(Object.fromEntries(entries));
    setLoading(false);
    setLoaded(true);
  };

  if (!photos.length) return null;

  if (!loaded) {
    return (
      <button
        type="button"
        onClick={() => void loadUrls()}
        className="mt-2 text-xs text-accent underline hover:text-accent-light"
        disabled={loading}
      >
        {loading ? "…" : `Voir les photos (${photos.length})`}
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {photos.map((p) => (
        <a
          key={p.path}
          href={urls[p.path] || undefined}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1"
        >
          {urls[p.path] ? (
            <img
              src={urls[p.path]}
              alt={p.angle}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-background-alt text-xs text-muted">
              —
            </span>
          )}
          <span className="text-[0.65rem] text-muted">
            {PHOTO_ANGLE_LABELS[p.angle] ?? p.angle}
          </span>
        </a>
      ))}
    </div>
  );
}

type Tab = "results" | "appointments" | "sendResult" | "settings";
type SettingsTab = "questions" | "pricing" | "availability";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;

const APPOINTMENT_STATUS_TONE: Record<DiagnosticAppointmentStatus, string> = {
  pending_payment: "bg-accent/15 text-accent",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-background-alt text-muted",
  cancelled: "bg-background-alt text-muted line-through",
};

function formatDateTime(locale: string, iso: string) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Panneau admin du diagnostic capillaire : résultats, rendez-vous, envoi de résultat et réglages. */
export function AdminDiagnosticPanel() {
  const { t, i18n } = useTranslation();
  const adminFetch = useAdminFetch();
  const [tab, setTab] = useState<Tab>("results");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("questions");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [settings, setSettings] = useState<DiagnosticSettings | null>(null);
  const [rules, setRules] = useState<DiagnosticAvailabilityRule[]>([]);
  const [overrides, setOverrides] = useState<DiagnosticSlotOverride[]>([]);
  const [appointments, setAppointments] = useState<DiagnosticAppointment[]>([]);
  const [history, setHistory] = useState<AdminDiagnosticListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideForm, setOverrideForm] = useState({
    startsAt: "",
    endsAt: "",
    kind: "blocked" as "open" | "blocked",
    note: "",
  });
  const [resultForm, setResultForm] = useState({
    appointmentId: "",
    title: "",
    summary: "",
    scalpAnalysis: "",
    detailedFeedback: "",
    slugs: [] as string[],
    notifyClient: true,
  });
  const [sendingResult, setSendingResult] = useState(false);
  const [preparingFor, setPreparingFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [qRes, sRes, aRes, apRes, hRes] = await Promise.all([
      adminFetch("/api/admin/diagnostic/questions"),
      adminFetch("/api/admin/diagnostic/settings"),
      adminFetch("/api/admin/diagnostic/availability"),
      adminFetch("/api/admin/diagnostic/appointments"),
      adminFetch("/api/admin/diagnostic/appointments?kind=history"),
    ]);
    const qJson = (await qRes.json()) as { questions?: DiagnosticQuestion[] };
    const sJson = (await sRes.json()) as { settings?: DiagnosticSettings };
    const aJson = (await aRes.json()) as {
      rules?: DiagnosticAvailabilityRule[];
      overrides?: DiagnosticSlotOverride[];
    };
    const apJson = (await apRes.json()) as {
      appointments?: DiagnosticAppointment[];
    };
    const hJson = (await hRes.json()) as {
      diagnostics?: AdminDiagnosticListItem[];
    };
    setQuestions(qJson.questions ?? []);
    setSettings(sJson.settings ?? null);
    setRules(aJson.rules ?? []);
    setOverrides(aJson.overrides ?? []);
    setAppointments(apJson.appointments ?? []);
    setHistory(hJson.diagnostics ?? []);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSettings = async () => {
    if (!settings) return;
    setFeedback(null);
    const res = await adminFetch("/api/admin/diagnostic/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const json = (await res.json()) as {
      settings?: DiagnosticSettings;
      error?: string;
    };
    if (!res.ok || !json.settings) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.saveError"),
      });
      return;
    }
    setSettings(json.settings);
    setFeedback({ tone: "success", message: t("admin.saveSuccess") });
  };

  const saveRules = async () => {
    const res = await adminFetch("/api/admin/diagnostic/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rules: rules.map((r) => ({
          weekday: r.weekday,
          startTime: r.startTime,
          endTime: r.endTime,
          enabled: r.enabled,
        })),
      }),
    });
    if (!res.ok) {
      setFeedback({ tone: "error", message: t("admin.saveError") });
      return;
    }
    setFeedback({ tone: "success", message: t("admin.saveSuccess") });
    await load();
  };

  const addOverride = async () => {
    if (!overrideForm.startsAt || !overrideForm.endsAt) return;
    await adminFetch("/api/admin/diagnostic/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: new Date(overrideForm.startsAt).toISOString(),
        endsAt: new Date(overrideForm.endsAt).toISOString(),
        kind: overrideForm.kind,
        note: overrideForm.note,
      }),
    });
    setOverrideForm({ startsAt: "", endsAt: "", kind: "blocked", note: "" });
    await load();
  };

  const updateAppointmentStatus = async (
    id: string,
    status: DiagnosticAppointment["status"],
  ) => {
    await adminFetch("/api/admin/diagnostic/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  };

  const prepareResultFor = (appointment: DiagnosticAppointment) => {
    setResultForm((prev) => ({
      ...prev,
      appointmentId: appointment.id,
      title:
        prev.title ||
        t("admin.diagnostic.defaultPhysicalTitle", {
          name: appointment.fullName,
        }),
    }));
    setPreparingFor(appointment.fullName);
    setTab("sendResult");
  };

  const sendResult = async () => {
    if (!resultForm.title.trim() || !resultForm.summary.trim()) {
      setFeedback({
        tone: "error",
        message: t("admin.diagnostic.resultRequired"),
      });
      return;
    }
    setSendingResult(true);
    setFeedback(null);
    const res = await adminFetch("/api/admin/diagnostic/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: resultForm.appointmentId ? "physical" : "online",
        appointmentId: resultForm.appointmentId || undefined,
        title: resultForm.title,
        summary: resultForm.summary,
        scalpAnalysis: resultForm.scalpAnalysis,
        detailedFeedback: resultForm.detailedFeedback || resultForm.summary,
        recommendedProductSlugs: resultForm.slugs,
        notifyClient: resultForm.notifyClient,
        markAppointmentCompleted: Boolean(resultForm.appointmentId),
        locale: i18n.language,
      }),
    });
    setSendingResult(false);
    const json = (await res.json()) as {
      error?: string;
      linkedToUser?: boolean;
    };
    if (!res.ok) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.saveError"),
      });
      return;
    }
    setResultForm({
      appointmentId: "",
      title: "",
      summary: "",
      scalpAnalysis: "",
      detailedFeedback: "",
      slugs: [],
      notifyClient: true,
    });
    setPreparingFor(null);
    setFeedback({
      tone: "success",
      message: json.linkedToUser
        ? t("admin.diagnostic.resultSent")
        : t("admin.diagnostic.resultSentNoAccount"),
    });
    await load();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "results", label: t("admin.diagnostic.tabs.results") },
    { id: "appointments", label: t("admin.diagnostic.tabs.appointments") },
    { id: "sendResult", label: t("admin.diagnostic.tabs.sendResult") },
    { id: "settings", label: t("admin.diagnostic.tabs.settings") },
  ];

  const onlineHistory = history.filter((row) => row.channel === "online");
  const physicalHistory = history.filter((row) => row.channel !== "online");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-8 md:px-6">
      <AdminPageHeader
        title={t("admin.diagnosticTitle")}
        subtitle={t("admin.diagnosticSubtitle")}
      />
      {feedback ? (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm transition ${
              tab === item.id
                ? "bg-primary text-background"
                : "border border-border text-muted hover:border-accent"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">{t(`admin.diagnostic.tabHints.${tab}`)}</p>

      {loading ? <p className="text-muted">{t("admin.loading")}</p> : null}

      {!loading && tab === "results" ? (
        <div className="space-y-6">
          <p className="text-sm text-muted">{t("admin.diagnostic.onlineHint")}</p>

          <section className="space-y-3">
            <h2 className="font-serif text-xl text-primary">
              {t("admin.diagnostic.onlineSection", {
                count: onlineHistory.length,
              })}
            </h2>
            {onlineHistory.length === 0 ? (
              <AdminEmptyState message={t("admin.diagnostic.historyEmpty")} />
            ) : (
              <ul className="space-y-3">
                {onlineHistory.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-2xl border border-border p-4 text-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-primary">
                          {row.profile.title || t(row.profile.titleKey)}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDateTime(i18n.language, row.created_at)}
                          {row.customerEmail
                            ? ` · ${row.customerEmail}`
                            : row.user_id
                              ? ` · ${t("admin.diagnostic.linkedAccount")}`
                              : ` · ${t("admin.diagnostic.anonymous")}`}
                          {row.customerName ? ` · ${row.customerName}` : ""}
                        </p>
                      </div>
                      <span className="inline-flex w-fit rounded-xl bg-primary/10 px-2.5 py-1 text-xs text-primary">
                        {t("admin.diagnostic.channel.online")}
                      </span>
                    </div>
                    <p className="mt-2 text-muted">
                      {row.profile.detailedFeedback ||
                        row.profile.summary ||
                        t(row.profile.summaryKey)}
                    </p>
                    {row.recommended_product_slugs.length > 0 ? (
                      <p className="mt-2 text-xs text-muted">
                        {row.recommended_product_slugs.join(", ")}
                      </p>
                    ) : null}
                    {row.notes ? (
                      <p className="mt-2 rounded-lg bg-background-alt px-3 py-2 text-xs text-muted">
                        {row.notes}
                      </p>
                    ) : null}
                    {row.photos?.length ? (
                      <DiagnosticPhotosStrip photos={row.photos} adminFetch={adminFetch} />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <h2 className="font-serif text-xl text-primary">
              {t("admin.diagnostic.physicalResultsSection", {
                count: physicalHistory.length,
              })}
            </h2>
            {physicalHistory.length === 0 ? (
              <AdminEmptyState message={t("admin.diagnostic.historyEmpty")} />
            ) : (
              <ul className="space-y-3">
                {physicalHistory.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-2xl border border-border p-4 text-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium text-primary">
                          {row.profile.title || t(row.profile.titleKey)}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDateTime(i18n.language, row.created_at)}
                          {row.customerEmail ? ` · ${row.customerEmail}` : ""}
                        </p>
                      </div>
                      <span className="inline-flex w-fit rounded-xl bg-primary/10 px-2.5 py-1 text-xs text-primary">
                        {t("admin.diagnostic.channel.physical")}
                      </span>
                    </div>
                    {row.profile.scalpAnalysis ? (
                      <p className="mt-2 text-sm text-primary">
                        {t("admin.diagnostic.scalpAnalysis")}:{" "}
                        {row.profile.scalpAnalysis}
                      </p>
                    ) : null}
                    <p className="mt-1 text-muted">
                      {row.profile.detailedFeedback ||
                        row.profile.summary ||
                        t(row.profile.summaryKey)}
                    </p>
                    {row.notes ? (
                      <p className="mt-2 rounded-lg bg-background-alt px-3 py-2 text-xs text-muted">
                        {row.notes}
                      </p>
                    ) : null}
                    {row.photos?.length ? (
                      <DiagnosticPhotosStrip photos={row.photos} adminFetch={adminFetch} />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      {!loading && tab === "appointments" ? (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <AdminEmptyState message={t("admin.diagnostic.appointmentsEmpty")} />
          ) : (
            <ul className="space-y-3">
              {appointments.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl border border-border p-4 text-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-primary">{a.fullName}</p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${APPOINTMENT_STATUS_TONE[a.status]}`}
                        >
                          {t(`admin.diagnostic.appointmentStatus.${a.status}`)}
                        </span>
                      </div>
                      <p className="text-xs text-muted">{a.email}</p>
                      <p className="text-xs text-muted">
                        {formatDateTime(i18n.language, a.startsAt)}
                      </p>
                      {a.notes ? (
                        <p className="mt-1 rounded-lg bg-background-alt px-3 py-2 text-xs text-muted">
                          {a.notes}
                        </p>
                      ) : null}
                      {a.photos?.length ? (
                        <DiagnosticPhotosStrip photos={a.photos} adminFetch={adminFetch} />
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="md"
                      variant="primary-outline"
                      onClick={() => prepareResultFor(a)}
                    >
                      {t("admin.diagnostic.prepareResult")}
                    </Button>
                    {a.status === "confirmed" || a.status === "completed" ? (
                      <Button
                        href={`/diagnostic-capillaire/visio/${a.id}`}
                        size="md"
                        variant="primary-outline"
                      >
                        {t("admin.diagnostic.joinVideo")}
                      </Button>
                    ) : null}
                    {a.status === "confirmed" ? (
                      <Button
                        type="button"
                        size="md"
                        variant="ghost"
                        onClick={() => void updateAppointmentStatus(a.id, "completed")}
                      >
                        {t("admin.diagnostic.markCompleted")}
                      </Button>
                    ) : null}
                    {a.status === "pending_payment" || a.status === "confirmed" ? (
                      <Button
                        type="button"
                        size="md"
                        variant="ghost"
                        onClick={() => void updateAppointmentStatus(a.id, "cancelled")}
                      >
                        {t("admin.diagnostic.cancel")}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {!loading && tab === "sendResult" ? (
        <div className="max-w-2xl space-y-4 rounded-2xl border border-border p-4 sm:p-5">
          <div>
            <h2 className="font-medium text-primary">
              {t("admin.diagnostic.sendResultTitle")}
            </h2>
            <p className="text-sm text-muted">{t("admin.diagnostic.sendResultHint")}</p>
          </div>

          {preparingFor ? (
            <p className="rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent">
              {t("admin.diagnostic.preparingFor", { name: preparingFor })}
            </p>
          ) : null}

          <label className="block space-y-1 text-sm">
            <span className="text-muted">{t("admin.diagnostic.linkAppointment")}</span>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={resultForm.appointmentId}
              onChange={(e) => {
                setResultForm({ ...resultForm, appointmentId: e.target.value });
                if (!e.target.value) setPreparingFor(null);
              }}
            >
              <option value="">{t("admin.diagnostic.noAppointment")}</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} — {formatDateTime(i18n.language, a.startsAt)} (
                  {t(`admin.diagnostic.appointmentStatus.${a.status}`)})
                </option>
              ))}
            </select>
            <span className="block text-xs text-muted">
              {t("admin.diagnostic.linkAppointmentHint")}
            </span>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{t("admin.diagnostic.resultTitle")}</span>
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={resultForm.title}
              onChange={(e) => setResultForm({ ...resultForm, title: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{t("admin.diagnostic.scalpAnalysis")}</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2"
              placeholder={t("admin.diagnostic.scalpAnalysisHint")}
              value={resultForm.scalpAnalysis}
              onChange={(e) =>
                setResultForm({ ...resultForm, scalpAnalysis: e.target.value })
              }
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{t("admin.diagnostic.resultSummary")}</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2"
              placeholder={t("admin.diagnostic.resultSummaryHint")}
              value={resultForm.summary}
              onChange={(e) => setResultForm({ ...resultForm, summary: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted">{t("admin.diagnostic.detailedFeedback")}</span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2"
              placeholder={t("admin.diagnostic.detailedFeedbackHint")}
              value={resultForm.detailedFeedback}
              onChange={(e) =>
                setResultForm({ ...resultForm, detailedFeedback: e.target.value })
              }
            />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm text-muted">
              {t("admin.diagnostic.resultProducts")}
            </legend>
            <p className="text-xs text-muted">
              {t("admin.diagnostic.resultProductsHint")}
            </p>
            <div className="flex flex-wrap gap-2">
              {AWURA_PRODUCT_SLUGS.map((slug) => {
                const checked = resultForm.slugs.includes(slug);
                return (
                  <label
                    key={slug}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                      checked
                        ? "border-accent bg-accent/10 text-primary"
                        : "border-border text-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        setResultForm({
                          ...resultForm,
                          slugs: checked
                            ? resultForm.slugs.filter((s) => s !== slug)
                            : [...resultForm.slugs, slug],
                        });
                      }}
                    />
                    {slug.replaceAll("-", " ")}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={resultForm.notifyClient}
              onChange={(e) =>
                setResultForm({ ...resultForm, notifyClient: e.target.checked })
              }
            />
            {t("admin.diagnostic.notifyClient")}
          </label>
          <Button
            type="button"
            pending={sendingResult}
            onClick={() => void sendResult()}
            className="w-full sm:w-auto"
          >
            {t("admin.diagnostic.sendResult")}
          </Button>
        </div>
      ) : null}

      {!loading && tab === "settings" ? (
        <div className="space-y-5">
          <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["questions", "pricing", "availability"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSettingsTab(key)}
                className={`inline-flex min-h-9 shrink-0 items-center rounded-lg px-3 text-sm transition ${
                  settingsTab === key
                    ? "bg-accent text-background"
                    : "border border-border text-muted hover:border-accent"
                }`}
              >
                {t(`admin.diagnostic.settingsTabs.${key}`)}
              </button>
            ))}
          </div>

          {settingsTab === "questions" ? (
            <AdminDiagnosticQuestionsEditor questions={questions} onReload={load} />
          ) : null}

          {settingsTab === "pricing" && settings ? (
            <div className="max-w-xl space-y-4">
              <p className="text-sm text-muted">{t("admin.diagnostic.pricingHint")}</p>
              {(
                [
                  ["onlinePriceCents", "onlineCompareCents", "online"],
                  ["physicalPriceCents", "physicalCompareCents", "physical"],
                ] as const
              ).map(([priceKey, compareKey, labelKey]) => (
                <fieldset
                  key={labelKey}
                  className="space-y-3 rounded-2xl border border-border p-4"
                >
                  <legend className="px-1 font-medium text-primary">
                    {t(`admin.diagnostic.price.${labelKey}`)}
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1 text-sm">
                      <span className="text-muted">
                        {t("admin.diagnostic.priceEuros")}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2"
                        value={settings[priceKey] / 100}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            [priceKey]: Math.round(Number(e.target.value) * 100),
                          })
                        }
                      />
                    </label>
                    <label className="block space-y-1 text-sm">
                      <span className="text-muted">
                        {t("admin.diagnostic.compareEuros")}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2"
                        value={settings[compareKey] / 100}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            [compareKey]: Math.round(Number(e.target.value) * 100),
                          })
                        }
                      />
                    </label>
                  </div>
                </fieldset>
              ))}
              <label className="block space-y-1 text-sm">
                <span className="text-muted">{t("admin.diagnostic.slotDuration")}</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  value={settings.slotDurationMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      slotDurationMinutes: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-muted">{t("admin.diagnostic.location")}</span>
                <textarea
                  className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2"
                  value={settings.physicalLocationText}
                  onChange={(e) =>
                    setSettings({ ...settings, physicalLocationText: e.target.value })
                  }
                />
              </label>
              <Button type="button" onClick={() => void saveSettings()}>
                {t("admin.save")}
              </Button>
            </div>
          ) : null}

          {settingsTab === "availability" ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-medium text-primary">
                  {t("admin.diagnostic.weeklyRules")}
                </h3>
                <p className="text-sm text-muted">
                  {t("admin.diagnostic.weeklyRulesHint")}
                </p>
                <div className="space-y-2">
                  {WEEKDAYS.map((weekday) => {
                    const rule = rules.find((r) => r.weekday === weekday) ?? {
                      id: `new-${weekday}`,
                      weekday,
                      startTime: "10:00",
                      endTime: "18:00",
                      enabled: false,
                    };
                    return (
                      <div
                        key={weekday}
                        className="flex flex-col gap-2 rounded-xl border border-border p-3 text-sm sm:flex-row sm:items-center sm:gap-3"
                      >
                        <label className="inline-flex min-w-32 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={(e) => {
                              const next = rules.filter((r) => r.weekday !== weekday);
                              next.push({ ...rule, enabled: e.target.checked });
                              setRules(next.sort((a, b) => a.weekday - b.weekday));
                            }}
                          />
                          {t(`admin.diagnostic.weekday.${weekday}`)}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={rule.startTime}
                            onChange={(e) => {
                              const next = rules.filter((r) => r.weekday !== weekday);
                              next.push({
                                ...rule,
                                startTime: e.target.value,
                                enabled: true,
                              });
                              setRules(next);
                            }}
                            className="w-full rounded-lg border border-border px-2 py-1.5"
                          />
                          <span className="text-muted">→</span>
                          <input
                            type="time"
                            value={rule.endTime}
                            onChange={(e) => {
                              const next = rules.filter((r) => r.weekday !== weekday);
                              next.push({
                                ...rule,
                                endTime: e.target.value,
                                enabled: true,
                              });
                              setRules(next);
                            }}
                            className="w-full rounded-lg border border-border px-2 py-1.5"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button type="button" onClick={() => void saveRules()}>
                  {t("admin.save")}
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-5">
                <h3 className="font-medium text-primary">
                  {t("admin.diagnostic.overrides")}
                </h3>
                <p className="text-sm text-muted">
                  {t("admin.diagnostic.overridesHint")}
                </p>
                <div className="space-y-2 rounded-xl border border-border p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block space-y-1 text-xs text-muted">
                      {t("admin.diagnostic.overrideFrom")}
                      <input
                        type="datetime-local"
                        value={overrideForm.startsAt}
                        onChange={(e) =>
                          setOverrideForm({ ...overrideForm, startsAt: e.target.value })
                        }
                        className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                    <label className="block space-y-1 text-xs text-muted">
                      {t("admin.diagnostic.overrideTo")}
                      <input
                        type="datetime-local"
                        value={overrideForm.endsAt}
                        onChange={(e) =>
                          setOverrideForm({ ...overrideForm, endsAt: e.target.value })
                        }
                        className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={overrideForm.kind}
                      onChange={(e) =>
                        setOverrideForm({
                          ...overrideForm,
                          kind: e.target.value as "open" | "blocked",
                        })
                      }
                      className="rounded-xl border border-border px-3 py-2 text-sm sm:flex-1"
                    >
                      <option value="blocked">
                        {t("admin.diagnostic.overrideBlocked")}
                      </option>
                      <option value="open">{t("admin.diagnostic.overrideOpen")}</option>
                    </select>
                    <Button
                      type="button"
                      onClick={() => void addOverride()}
                      className="sm:w-auto"
                    >
                      {t("admin.diagnostic.addOverride")}
                    </Button>
                  </div>
                </div>
                {overrides.length === 0 ? (
                  <AdminEmptyState message={t("admin.diagnostic.noOverrides")} />
                ) : (
                  <ul className="space-y-2 text-sm">
                    {overrides.map((o) => (
                      <li
                        key={o.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                      >
                        <span className="text-muted">
                          {t(`admin.diagnostic.override${o.kind === "blocked" ? "Blocked" : "Open"}`)}{" "}
                          · {formatDateTime(i18n.language, o.startsAt)}
                        </span>
                        <Button
                          type="button"
                          size="md"
                          variant="ghost"
                          onClick={() =>
                            void adminFetch(
                              `/api/admin/diagnostic/availability?id=${encodeURIComponent(o.id)}`,
                              { method: "DELETE" },
                            ).then(() => load())
                          }
                        >
                          {t("admin.delete")}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
