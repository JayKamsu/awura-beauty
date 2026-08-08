"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DiagnosticPhysicalFlow } from "@/features/diagnostic/components/diagnostic-physical-flow";
import { DiagnosticWizard } from "@/features/diagnostic/components/diagnostic-wizard";
import { formatPrice } from "@/lib/format/price";
import type { DiagnosticSettings } from "@/lib/domain/diagnostic";

type Mode = "hub" | "online" | "physical";

const DEFAULT_SETTINGS: DiagnosticSettings = {
  onlinePriceCents: 0,
  onlineCompareCents: 9000,
  physicalPriceCents: 3980,
  physicalCompareCents: 15000,
  slotDurationMinutes: 45,
  physicalLocationText: "",
  currency: "EUR",
};

const ONLINE_INCLUDES = [
  "diagnostic.online.includes.1",
  "diagnostic.online.includes.2",
  "diagnostic.online.includes.3",
  "diagnostic.online.includes.4",
] as const;

const PHYSICAL_INCLUDES = [
  "diagnostic.physical.includes.1",
  "diagnostic.physical.includes.2",
  "diagnostic.physical.includes.3",
  "diagnostic.physical.includes.4",
] as const;

export function DiagnosticPageContent() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const initialMode = useMemo<Mode>(() => {
    const m = searchParams.get("mode");
    if (m === "online" || m === "physical") return m;
    return "hub";
  }, [searchParams]);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/diagnostic/questionnaire?channel=online")
      .then((r) => r.json())
      .then((json: { settings?: DiagnosticSettings }) => {
        if (!cancelled && json.settings) setSettings(json.settings);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onlinePrice = formatPrice(
    settings.onlinePriceCents / 100,
    settings.currency,
    i18n.language,
  );
  const onlineCompare = formatPrice(
    settings.onlineCompareCents / 100,
    settings.currency,
    i18n.language,
  );
  const physicalPrice = formatPrice(
    settings.physicalPriceCents / 100,
    settings.currency,
    i18n.language,
  );
  const physicalCompare = formatPrice(
    settings.physicalCompareCents / 100,
    settings.currency,
    i18n.language,
  );

  if (mode === "online") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 md:px-6 lg:max-w-5xl">
        <button
          type="button"
          onClick={() => setMode("hub")}
          className="self-start text-sm text-accent hover:text-accent-light"
        >
          {t("diagnostic.backToHub")}
        </button>
        <header className="max-w-2xl space-y-4">
          <p className="text-sm uppercase tracking-[0.18em] text-accent">
            {t("diagnostic.online.eyebrow")}
          </p>
          <h1 className="font-serif text-4xl text-primary sm:text-5xl">
            {t("diagnostic.online.title")}
          </h1>
          <p className="leading-relaxed text-muted">
            {t("diagnostic.online.subtitle")}
          </p>
          <p className="text-sm text-muted">
            {t("diagnostic.online.meta", {
              duration: t("diagnostic.online.duration"),
              price: onlinePrice,
              compare: onlineCompare,
            })}
          </p>
        </header>
        <DiagnosticWizard />
      </main>
    );
  }

  if (mode === "physical") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 md:px-6 lg:max-w-5xl">
        <button
          type="button"
          onClick={() => setMode("hub")}
          className="self-start text-sm text-accent hover:text-accent-light"
        >
          {t("diagnostic.backToHub")}
        </button>
        <header className="max-w-2xl space-y-4">
          <p className="text-sm uppercase tracking-[0.18em] text-accent">
            {t("diagnostic.physical.eyebrow")}
          </p>
          <h1 className="font-serif text-4xl text-primary sm:text-5xl">
            {t("diagnostic.physical.title")}
          </h1>
          <p className="leading-relaxed text-muted">
            {t("diagnostic.physical.subtitle")}
          </p>
          <p className="text-sm text-muted">
            {t("diagnostic.physical.meta", {
              duration: settings.slotDurationMinutes,
              price: physicalPrice,
              compare: physicalCompare,
            })}
          </p>
        </header>
        <DiagnosticPhysicalFlow settings={settings} />
      </main>
    );
  }

  return (
    <main className="relative flex w-full flex-1 flex-col">
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background-alt to-accent/10"
        />
        <div
          aria-hidden
          className="absolute -right-24 top-10 size-72 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl space-y-6 px-4 py-16 md:px-6 md:py-24">
          <p className="text-sm uppercase tracking-[0.18em] text-accent">
            {t("diagnostic.eyebrow")}
          </p>
          <h1 className="max-w-3xl font-serif text-4xl text-primary sm:text-6xl">
            {t("diagnostic.hubTitle")}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">
            {t("diagnostic.hubSubtitle")}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            {t("diagnostic.hubPromise")}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl space-y-8 px-4 py-14 md:px-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.16em] text-accent">
            {t("diagnostic.offersEyebrow")}
          </p>
          <h2 className="font-serif text-3xl text-primary sm:text-4xl">
            {t("diagnostic.offersTitle")}
          </h2>
          <p className="max-w-2xl text-muted">{t("diagnostic.offersSubtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-[2rem] border border-border bg-background p-8">
            <p className="text-sm uppercase tracking-[0.16em] text-accent">
              {t("diagnostic.online.badge")}
            </p>
            <h3 className="mt-3 font-serif text-3xl text-primary">
              {t("diagnostic.online.cardTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t("diagnostic.online.cardBody")}
            </p>
            <dl className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
              <div>
                <dt className="uppercase tracking-wide text-xs">
                  {t("diagnostic.meta.duration")}
                </dt>
                <dd className="mt-1 font-medium text-primary">
                  {t("diagnostic.online.duration")}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-xs">
                  {t("diagnostic.meta.price")}
                </dt>
                <dd className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="font-serif text-2xl text-primary">
                    {onlinePrice}
                  </span>
                  <span className="line-through">{onlineCompare}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                    {t("diagnostic.price.free")}
                  </span>
                </dd>
              </div>
            </dl>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              {ONLINE_INCLUDES.map((key) => (
                <li key={key} className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ·
                  </span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button type="button" size="lg" onClick={() => setMode("online")}>
                {t("diagnostic.online.cta")}
              </Button>
            </div>
          </article>

          <article className="flex flex-col rounded-[2rem] border border-border bg-background-alt p-8">
            <p className="text-sm uppercase tracking-[0.16em] text-accent">
              {t("diagnostic.physical.badge")}
            </p>
            <h3 className="mt-3 font-serif text-3xl text-primary">
              {t("diagnostic.physical.cardTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t("diagnostic.physical.cardBody")}
            </p>
            <dl className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
              <div>
                <dt className="uppercase tracking-wide text-xs">
                  {t("diagnostic.meta.duration")}
                </dt>
                <dd className="mt-1 font-medium text-primary">
                  {t("diagnostic.physical.duration", {
                    minutes: settings.slotDurationMinutes,
                  })}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide text-xs">
                  {t("diagnostic.meta.price")}
                </dt>
                <dd className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="font-serif text-2xl text-primary">
                    {physicalPrice}
                  </span>
                  <span className="line-through">{physicalCompare}</span>
                </dd>
              </div>
            </dl>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              {PHYSICAL_INCLUDES.map((key) => (
                <li key={key} className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ·
                  </span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            {settings.physicalLocationText ? (
              <p className="mt-4 text-xs text-muted">
                {t("diagnostic.physical.locationLabel")}:{" "}
                {settings.physicalLocationText}
              </p>
            ) : null}
            <div className="mt-8">
              <Button
                type="button"
                size="lg"
                variant="primary-outline"
                onClick={() => setMode("physical")}
              >
                {t("diagnostic.physical.cta")}
              </Button>
            </div>
          </article>
        </div>

        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          {t("diagnostic.expertiseNote")}
        </p>
      </section>
    </main>
  );
}
