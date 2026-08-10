"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { DiagnosticAppointment } from "@/lib/domain/diagnostic";

/** Confirme un rendez-vous diagnostic après paiement et propose l'accès à la visio si applicable. */
export function DiagnosticAppointmentSuccess() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId") ?? undefined;
  const sessionId = searchParams.get("session_id") ?? undefined;
  const [appointment, setAppointment] = useState<DiagnosticAppointment | null>(
    null,
  );
  const [videoPath, setVideoPath] = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentId) return;
    void fetch("/api/diagnostic/appointments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, sessionId }),
    })
      .then((r) => r.json())
      .then(
        (json: {
          appointment?: DiagnosticAppointment;
          videoPath?: string | null;
        }) => {
          setAppointment(json.appointment ?? null);
          setVideoPath(json.videoPath ?? null);
        },
      );
  }, [appointmentId, sessionId]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
      <h1 className="font-serif text-4xl text-primary">
        {t("diagnostic.physical.successTitle")}
      </h1>
      <p className="text-muted">{t("diagnostic.physical.successBody")}</p>
      {appointment ? (
        <div className="w-full rounded-2xl border border-border p-5 text-left text-sm">
          <p className="font-medium text-primary">
            {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
              dateStyle: "full",
              timeStyle: "short",
            }).format(new Date(appointment.startsAt))}
          </p>
          <p className="mt-2 text-muted">
            {t(`diagnostic.physical.status.${appointment.status}`, {
              defaultValue: appointment.status,
            })}
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        {videoPath ? (
          <Button href={videoPath} size="lg">
            {t("diagnostic.video.joinCta")}
          </Button>
        ) : null}
        <Button
          href="/compte#diagnostics"
          size="lg"
          variant={videoPath ? "primary-outline" : "primary"}
        >
          {t("diagnostic.result.accountCta")}
        </Button>
        <Button href="/boutique" variant="ghost" size="lg">
          {t("cart.continueShopping")}
        </Button>
      </div>
      <p className="text-sm text-muted">
        <Link
          href="/diagnostic-capillaire"
          className="text-accent hover:text-accent-light"
        >
          {t("diagnostic.backToHub")}
        </Link>
      </p>
    </main>
  );
}
