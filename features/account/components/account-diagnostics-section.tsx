"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  AccountSection,
  accountPanelClass,
} from "@/features/account/components/account-section";
import { useAuth } from "@/features/auth/context/auth-provider";
import { DiagnosticContentBlocks } from "@/features/diagnostic/components/diagnostic-content-blocks";
import { RescheduleAppointmentPicker } from "@/features/diagnostic/components/reschedule-appointment-picker";
import { DiagnosticTestimonialForm } from "@/features/diagnostic/components/diagnostic-testimonial-form";
import { downloadAppointmentIcsAuthenticated } from "@/lib/application/diagnostic/download-ics";
import { downloadDiagnosticResultPdf } from "@/lib/application/diagnostic/download-result-pdf";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type {
  DiagnosticAppointment,
  DiagnosticRecord,
  DiagnosticSlot,
} from "@/lib/domain/diagnostic";

type AppointmentRow = DiagnosticAppointment & { videoPath?: string | null };

const RESCHEDULABLE_STATUSES = new Set(["pending_payment", "confirmed"]);

/** Section Mon compte listant les diagnostics capillaires et rendez-vous physiques du client. */
export function AccountDiagnosticsSection() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [items, setItems] = useState<DiagnosticRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!session?.access_token) {
        if (mounted) {
          setItems([]);
          setAppointments([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [diagRes, apptRes] = await Promise.all([
        fetch("/api/account/diagnostic", { headers }),
        fetch("/api/account/diagnostic/appointments", { headers }),
      ]);

      let nextItems: DiagnosticRecord[] = [];
      let nextAppointments: AppointmentRow[] = [];

      if (diagRes.ok) {
        const json = (await diagRes.json()) as {
          diagnostics?: DiagnosticRecord[];
        };
        nextItems = json.diagnostics ?? [];
      }
      if (apptRes.ok) {
        const json = (await apptRes.json()) as {
          appointments?: AppointmentRow[];
        };
        nextAppointments = json.appointments ?? [];
      }

      if (!mounted) return;
      setItems(nextItems);
      setAppointments(nextAppointments);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [session?.access_token]);

  const empty = !loading && items.length === 0 && appointments.length === 0;

  return (
    <AccountSection
      id="diagnostics"
      title={t("account.diagnosticsTitle")}
      action={
        <Button href="/diagnostic-capillaire" variant="primary-outline" size="md">
          {t("account.diagnosticsNew")}
        </Button>
      }
    >
      {loading ? (
        <p className="text-muted">{t("account.diagnosticsLoading")}</p>
      ) : empty ? (
        <div className={`${accountPanelClass} p-8 text-center`}>
          <p className="text-muted">{t("account.diagnosticsEmpty")}</p>
          <Button href="/diagnostic-capillaire" className="mt-4">
            {t("account.diagnosticsNew")}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {appointments.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-serif text-xl text-primary">
                {t("account.diagnosticsAppointments")}
              </h3>
              <ul className="space-y-3">
                {appointments.map((a) => (
                  <li
                    key={a.id}
                    className={accountPanelClass}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="font-medium text-primary">
                          {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                            dateStyle: "full",
                            timeStyle: "short",
                          }).format(new Date(a.startsAt))}
                        </p>
                        <p className="text-sm text-muted">
                          {t(`account.diagnosticsApptStatus.${a.status}`, {
                            defaultValue: a.status,
                          })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {a.videoPath ? (
                            <Button
                              href={a.videoPath}
                              size="md"
                              variant="primary-outline"
                            >
                              {t("account.diagnosticsJoinVideo")}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="md"
                            variant="ghost"
                            onClick={() => {
                              if (!session?.access_token) return;
                              void downloadAppointmentIcsAuthenticated(
                                a.id,
                                session.access_token,
                              );
                            }}
                          >
                            {t("account.diagnosticsAddToCalendar")}
                          </Button>
                          {RESCHEDULABLE_STATUSES.has(a.status) ? (
                            <Button
                              type="button"
                              size="md"
                              variant="ghost"
                              onClick={() =>
                                setReschedulingId((prev) => (prev === a.id ? null : a.id))
                              }
                            >
                              {t("diagnostic.reschedule.cta")}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-xs text-primary">
                        {t("account.diagnosticsPhysical")}
                      </span>
                    </div>

                    {reschedulingId === a.id ? (
                      <div className="mt-4 border-t border-border/60 pt-4">
                        <RescheduleAppointmentPicker
                          currentStartsAt={a.startsAt}
                          fetchSlots={async (from, to) => {
                            const res = await fetch(
                              `/api/diagnostic/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
                            );
                            if (!res.ok) return [];
                            const json = (await res.json()) as { slots?: DiagnosticSlot[] };
                            return json.slots ?? [];
                          }}
                          onConfirm={async (startsAt) => {
                            if (!session?.access_token) {
                              return { ok: false, error: t("diagnostic.reschedule.error") };
                            }
                            const res = await fetch(
                              `/api/diagnostic/appointments/${a.id}/reschedule`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${session.access_token}`,
                                },
                                body: JSON.stringify({ startsAt }),
                              },
                            );
                            const json = (await res.json()) as {
                              appointment?: AppointmentRow;
                              error?: string;
                            };
                            if (!res.ok || !json.appointment) {
                              return { ok: false, error: json.error };
                            }
                            setAppointments((prev) =>
                              prev.map((row) =>
                                row.id === a.id ? { ...row, ...json.appointment } : row,
                              ),
                            );
                            setReschedulingId(null);
                            return { ok: true };
                          }}
                          onCancel={() => setReschedulingId(null)}
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-serif text-xl text-primary">
                {t("account.diagnosticsResults")}
              </h3>
              <ul className="space-y-4">
                {items.map((item) => {
                  const title = item.profile.title || t(item.profile.titleKey);
                  const summary =
                    item.profile.detailedFeedback ||
                    item.profile.summary ||
                    t(item.profile.summaryKey);
                  return (
                    <li key={item.id} className={`${accountPanelClass} space-y-3`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-serif text-xl text-primary">
                            {title}
                          </p>
                          <p className="text-sm text-muted">
                            {new Intl.DateTimeFormat(
                              toIntlLocale(i18n.language),
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            ).format(new Date(item.created_at))}
                          </p>
                        </div>
                        <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-xs text-primary">
                          {item.channel === "physical"
                            ? t("account.diagnosticsPhysical")
                            : t("account.diagnosticsOnline")}
                        </span>
                      </div>

                      {item.profile.scalpAnalysis ? (
                        <div className="space-y-1 rounded-xl bg-background-alt p-4">
                          <p className="text-sm font-medium text-primary">
                            {t("account.diagnosticsScalpAnalysis")}
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-muted">
                            {item.profile.scalpAnalysis}
                          </p>
                        </div>
                      ) : null}

                      {item.profile.content?.length ? (
                        <>
                          <DiagnosticContentBlocks blocks={item.profile.content} />
                          <Button
                            type="button"
                            size="md"
                            variant="ghost"
                            onClick={() => {
                              if (!session?.access_token) return;
                              void downloadDiagnosticResultPdf(
                                item.id,
                                session.access_token,
                              );
                            }}
                          >
                            {t("account.diagnosticsDownloadPdf")}
                          </Button>
                          {session?.access_token ? (
                            <DiagnosticTestimonialForm
                              diagnosticId={item.id}
                              accessToken={session.access_token}
                            />
                          ) : null}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm text-muted">
                          {summary}
                        </p>
                      )}

                      {item.profile.processSteps?.length ? (
                        <ol className="space-y-2 text-sm text-muted">
                          {item.profile.processSteps.map((step) => (
                            <li key={`${item.id}-p-${step.order}`}>
                              <span className="font-medium text-primary">
                                {step.title}
                              </span>
                              {" — "}
                              {step.body}
                            </li>
                          ))}
                        </ol>
                      ) : null}

                      {item.routine?.length ? (
                        <ol className="space-y-2 text-sm text-muted">
                          {item.routine.map((step) => (
                            <li key={`${item.id}-${step.order}`}>
                              <span className="font-medium text-primary">
                                {step.order}. {step.title}
                              </span>
                              {step.usage ? ` — ${step.usage}` : ""}
                              {step.productSlug ? (
                                <>
                                  {" · "}
                                  <Link
                                    href={`/boutique/${step.productSlug}`}
                                    className="text-accent underline-offset-2 hover:underline"
                                  >
                                    {t("account.diagnosticsBuy")}
                                  </Link>
                                </>
                              ) : null}
                            </li>
                          ))}
                        </ol>
                      ) : null}

                      {item.recommended_product_slugs.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-primary">
                            {t("account.diagnosticsRecommendations")}
                          </p>
                          <ul className="flex flex-wrap gap-2">
                            {item.recommended_product_slugs.map((slug) => (
                              <li key={slug}>
                                <Link
                                  href={`/boutique/${slug}`}
                                  className="inline-flex rounded-xl border border-border px-3 py-1 text-xs text-accent hover:border-accent"
                                >
                                  {slug.replaceAll("-", " ")}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </AccountSection>
  );
}
