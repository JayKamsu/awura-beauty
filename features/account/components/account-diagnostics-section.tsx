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
import { listMyDiagnostics } from "@/lib/infrastructure/supabase/diagnostics";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type {
  DiagnosticAppointment,
  DiagnosticRecord,
} from "@/lib/domain/diagnostic";

type AppointmentRow = DiagnosticAppointment & { videoPath?: string | null };

export function AccountDiagnosticsSection() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [items, setItems] = useState<DiagnosticRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const diagnostics = await listMyDiagnostics();
      let nextAppointments: AppointmentRow[] = [];
      if (session?.access_token) {
        const res = await fetch("/api/account/diagnostic/appointments", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const json = (await res.json()) as {
            appointments?: AppointmentRow[];
          };
          nextAppointments = json.appointments ?? [];
        }
      }
      if (!mounted) return;
      setItems(diagnostics);
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
        <>
          {appointments.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-serif text-xl text-primary">
                {t("account.diagnosticsAppointments")}
              </h3>
              <ul className="space-y-3">
                {appointments.map((a) => (
                  <li
                    key={a.id}
                    className={`flex flex-wrap items-start justify-between gap-3 ${accountPanelClass}`}
                  >
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
                      {a.videoPath ? (
                        <Button href={a.videoPath} size="md" variant="primary-outline">
                          {t("account.diagnosticsJoinVideo")}
                        </Button>
                      ) : null}
                    </div>
                    <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-xs text-primary">
                      {t("account.diagnosticsPhysical")}
                    </span>
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
                        <div>
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

                      <p className="whitespace-pre-wrap text-sm text-muted">
                        {summary}
                      </p>

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
        </>
      )}
    </AccountSection>
  );
}
