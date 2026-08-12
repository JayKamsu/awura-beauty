"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import { toIntlLocale } from "@/lib/i18n/intl-locale";

type VideoPayload = {
  joinUrl: string;
  roomName: string;
  domain: string;
  displayName: string;
  startsAt: string;
  status: string;
  canJoinNow: boolean;
  joinWindowStartsAt: string;
  callEndsAt: string;
  callMaxMinutes: number;
};

type DiagnosticVideoRoomProps = {
  appointmentId: string;
  token?: string | null;
};

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Salle de visioconférence (Jitsi) pour le rendez-vous diagnostic à distance : ouverture 5 min avant, minuteur 1h max. */
export function DiagnosticVideoRoom({
  appointmentId,
  token,
}: DiagnosticVideoRoomProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [data, setData] = useState<VideoPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      setError(null);
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch(
        `/api/diagnostic/video/${appointmentId}${qs}`,
        { headers },
      );
      const json = (await res.json()) as VideoPayload & { error?: string };
      if (!mounted) return;
      if (!res.ok) {
        setError(json.error ?? t("diagnostic.video.error"));
        setData(null);
        setLoading(false);
        return;
      }
      setData(json);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [appointmentId, token, session?.access_token, t]);

  // Tick chaque seconde pour le compte à rebours / minuteur.
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const timing = useMemo(() => {
    if (!data) return null;
    const windowStart = new Date(data.joinWindowStartsAt).getTime();
    const starts = new Date(data.startsAt).getTime();
    const callEnd = new Date(data.callEndsAt).getTime();
    if (now < windowStart) {
      return { phase: "before" as const, msUntilOpen: windowStart - now };
    }
    if (now > callEnd) {
      return { phase: "over" as const };
    }
    return {
      phase: "live" as const,
      msRemaining: callEnd - now,
      lateStart: now > starts,
    };
  }, [data, now]);

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-14 md:px-6">
        <p className="text-muted">{t("diagnostic.video.loading")}</p>
      </main>
    );
  }

  if (error || !data || !timing) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-14 md:px-6">
        <h1 className="font-serif text-3xl text-primary">
          {t("diagnostic.video.title")}
        </h1>
        <p className="text-muted">{error ?? t("diagnostic.video.error")}</p>
        <Button href="/compte#diagnostics" variant="primary-outline">
          {t("diagnostic.result.accountCta")}
        </Button>
      </main>
    );
  }

  const formattedDate = new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(data.startsAt));

  // RDV pas encore ouvert : compte à rebours avant ouverture de la salle.
  if (timing.phase === "before") {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-6 px-4 py-16 text-center md:px-6">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          {t("diagnostic.video.eyebrow")}
        </p>
        <h1 className="font-serif text-3xl text-primary sm:text-4xl">
          {t("diagnostic.video.title")}
        </h1>
        <p className="text-muted">
          {t("diagnostic.video.subtitle", { date: formattedDate })}
        </p>
        <div className="w-full rounded-2xl border border-border bg-background-alt p-8">
          <p className="text-sm text-muted">{t("diagnostic.video.opensIn")}</p>
          <p className="mt-2 font-serif text-5xl tabular-nums text-primary">
            {formatCountdown(timing.msUntilOpen)}
          </p>
          <p className="mt-3 text-xs text-muted">
            {t("diagnostic.video.opensHint", {
              minutes: 5,
            })}
          </p>
        </div>
        <Button href="/compte#diagnostics" variant="primary-outline">
          {t("diagnostic.result.accountCta")}
        </Button>
      </main>
    );
  }

  // Fenêtre dépassée (1h après l'heure prévue) : entretien terminé.
  if (timing.phase === "over") {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-6 px-4 py-16 text-center md:px-6">
        <h1 className="font-serif text-3xl text-primary">
          {t("diagnostic.video.title")}
        </h1>
        <p className="text-muted">{t("diagnostic.video.over")}</p>
        <Button href="/compte#diagnostics" variant="primary-outline">
          {t("diagnostic.result.accountCta")}
        </Button>
      </main>
    );
  }

  const hash = new URLSearchParams({
    "userInfo.displayName": data.displayName,
    "config.prejoinConfig.enabled": "true",
    "config.disableDeepLinking": "true",
  }).toString();
  const embedSrc = `https://${data.domain}/${data.roomName}#${hash}`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 md:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.18em] text-accent">
            {t("diagnostic.video.eyebrow")}
          </p>
          <h1 className="font-serif text-3xl text-primary sm:text-4xl">
            {t("diagnostic.video.title")}
          </h1>
          <p className="text-muted">
            {t("diagnostic.video.subtitle", { date: formattedDate })}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background-alt px-5 py-3 text-center">
          <p className="text-xs uppercase tracking-wide text-muted">
            {t("diagnostic.video.timeRemaining")}
          </p>
          <p
            className={`font-serif text-3xl tabular-nums ${
              timing.msRemaining < 5 * 60_000 ? "text-accent" : "text-primary"
            }`}
            aria-live="polite"
          >
            {formatCountdown(timing.msRemaining)}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <a
          href={data.joinUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-medium uppercase tracking-[0.08em] text-background transition hover:bg-primary/90"
        >
          {t("diagnostic.video.openExternal")}
        </a>
        <Button href="/compte#diagnostics" variant="primary-outline" size="lg">
          {t("diagnostic.result.accountCta")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-background-alt">
        <iframe
          title={t("diagnostic.video.title")}
          src={embedSrc}
          className="h-[min(70vh,720px)] w-full bg-background"
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          allowFullScreen
        />
      </div>

      <p className="text-xs text-muted">{t("diagnostic.video.hint")}</p>
    </main>
  );
}
