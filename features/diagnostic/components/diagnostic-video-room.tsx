"use client";

import { useEffect, useState } from "react";
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
};

type DiagnosticVideoRoomProps = {
  appointmentId: string;
  token?: string | null;
};

export function DiagnosticVideoRoom({
  appointmentId,
  token,
}: DiagnosticVideoRoomProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [data, setData] = useState<VideoPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-14 md:px-6">
        <p className="text-muted">{t("diagnostic.video.loading")}</p>
      </main>
    );
  }

  if (error || !data) {
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

  const hash = new URLSearchParams({
    "userInfo.displayName": data.displayName,
    "config.prejoinConfig.enabled": "true",
    "config.disableDeepLinking": "true",
  }).toString();
  const embedSrc = `https://${data.domain}/${data.roomName}#${hash}`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 md:px-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          {t("diagnostic.video.eyebrow")}
        </p>
        <h1 className="font-serif text-3xl text-primary sm:text-4xl">
          {t("diagnostic.video.title")}
        </h1>
        <p className="text-muted">
          {t("diagnostic.video.subtitle", {
            date: new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
              dateStyle: "full",
              timeStyle: "short",
            }).format(new Date(data.startsAt)),
          })}
        </p>
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
