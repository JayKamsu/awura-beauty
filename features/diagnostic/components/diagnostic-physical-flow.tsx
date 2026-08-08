"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DiagnosticProgress } from "@/features/diagnostic/components/diagnostic-progress";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { formatPrice } from "@/lib/format/price";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type {
  DiagnosticAnswerMap,
  DiagnosticQuestion,
  DiagnosticSettings,
  DiagnosticSlot,
} from "@/lib/domain/diagnostic";

type Phase = "quiz" | "slot" | "contact";

type DiagnosticPhysicalFlowProps = {
  settings: DiagnosticSettings;
};

export function DiagnosticPhysicalFlow({
  settings: initialSettings,
}: DiagnosticPhysicalFlowProps) {
  const { t, i18n } = useTranslation();
  const { user, session } = useAuth();
  const { locked: pending, run } = useActionLock();
  const [phase, setPhase] = useState<Phase>("quiz");
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [settings, setSettings] = useState(initialSettings);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosticAnswerMap>({});
  const [slots, setSlots] = useState<DiagnosticSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/diagnostic/questionnaire?channel=physical_pre&locale=${encodeURIComponent(i18n.language)}`,
      );
      const json = (await res.json()) as {
        questions?: DiagnosticQuestion[];
        settings?: DiagnosticSettings;
      };
      if (cancelled) return;
      setQuestions(json.questions ?? []);
      if (json.settings) setSettings(json.settings);
      setLoadingQuiz(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  useEffect(() => {
    if (phase !== "slot") return;
    let cancelled = false;
    void (async () => {
      const from = new Date().toISOString();
      const to = new Date();
      to.setDate(to.getDate() + 21);
      const res = await fetch(
        `/api/diagnostic/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to.toISOString())}`,
      );
      const json = (await res.json()) as {
        slots?: DiagnosticSlot[];
        settings?: DiagnosticSettings;
      };
      if (cancelled) return;
      setSlots(json.slots ?? []);
      if (json.settings) setSettings(json.settings);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const step = questions[stepIndex];
  const selected = step ? answers[step.questionKey] : undefined;

  const slotsByDay = useMemo(() => {
    const map = new Map<string, DiagnosticSlot[]>();
    for (const slot of slots) {
      const day = new Date(slot.startsAt).toLocaleDateString(
        toIntlLocale(i18n.language),
        { weekday: "long", day: "numeric", month: "long" },
      );
      const list = map.get(day) ?? [];
      list.push(slot);
      map.set(day, list);
    }
    return [...map.entries()];
  }, [slots, i18n.language]);

  const goNextQuiz = () => {
    if (!selected) return;
    if (stepIndex < questions.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    setPhase("slot");
  };

  const onBook = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSlot) return;
    setError(null);
    void run(async () => {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/diagnostic/appointments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          fullName,
          phone,
          startsAt: selectedSlot,
          answers,
        }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? t("diagnostic.physical.bookError"));
        return;
      }
      window.location.href = json.url;
    });
  };

  if (loadingQuiz) {
    return <p className="text-muted">{t("diagnostic.loading")}</p>;
  }

  if (phase === "quiz" && questions.length > 0) {
    return (
      <div className="space-y-8">
        <DiagnosticProgress
          stepIndex={stepIndex}
          totalSteps={questions.length}
        />
        <div className="space-y-3">
          <h2 className="font-serif text-3xl text-primary">{step.title}</h2>
          {step.subtitle ? (
            <p className="text-muted">{step.subtitle}</p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {step.options.map((option) => {
            const isActive = selected === option.valueKey;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [step.questionKey]: option.valueKey,
                  }))
                }
                className={`rounded-2xl border px-5 py-4 text-left transition ${
                  isActive
                    ? "border-primary bg-primary text-background"
                    : "border-border hover:border-accent"
                }`}
              >
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            {t("diagnostic.back")}
          </Button>
          <Button type="button" size="lg" disabled={!selected} onClick={goNextQuiz}>
            {stepIndex === questions.length - 1
              ? t("diagnostic.physical.chooseSlot")
              : t("diagnostic.next")}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "slot") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-serif text-3xl text-primary">
            {t("diagnostic.physical.slotsTitle")}
          </h2>
          <p className="text-muted">{t("diagnostic.physical.slotsSubtitle")}</p>
          <p className="text-sm text-muted">
            {t("diagnostic.physical.priceLabel", {
              price: formatPrice(
                settings.physicalPriceCents / 100,
                settings.currency,
                i18n.language,
              ),
              compare: formatPrice(
                settings.physicalCompareCents / 100,
                settings.currency,
                i18n.language,
              ),
            })}
          </p>
        </div>
        {slots.length === 0 ? (
          <p className="rounded-2xl bg-background-alt p-6 text-muted">
            {t("diagnostic.physical.noSlots")}
          </p>
        ) : (
          <div className="space-y-6">
            {slotsByDay.map(([day, daySlots]) => (
              <div key={day} className="space-y-3">
                <p className="text-sm font-medium capitalize text-primary">
                  {day}
                </p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const label = new Intl.DateTimeFormat(
                      toIntlLocale(i18n.language),
                      { hour: "2-digit", minute: "2-digit" },
                    ).format(new Date(slot.startsAt));
                    const active = selectedSlot === slot.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => setSelectedSlot(slot.startsAt)}
                        className={`min-h-11 rounded-xl px-3 text-sm transition ${
                          active
                            ? "bg-primary text-background"
                            : "border border-border text-muted hover:border-accent"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => setPhase("quiz")}>
            {t("diagnostic.back")}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!selectedSlot}
            onClick={() => setPhase("contact")}
          >
            {t("diagnostic.next")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onBook} className="space-y-5">
      <h2 className="font-serif text-3xl text-primary">
        {t("diagnostic.physical.contactTitle")}
      </h2>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">{t("checkout.fullName")}</span>
        <input
          required
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">{t("checkout.email")}</span>
        <input
          required
          type="email"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">{t("checkout.phone")}</span>
        <input
          required
          type="tel"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      {settings.physicalLocationText ? (
        <p className="text-sm text-muted">{settings.physicalLocationText}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setPhase("slot")}>
          {t("diagnostic.back")}
        </Button>
        <Button type="submit" size="lg" pending={pending}>
          {t("diagnostic.physical.payCta", {
            price: formatPrice(
              settings.physicalPriceCents / 100,
              settings.currency,
              i18n.language,
            ),
          })}
        </Button>
      </div>
    </form>
  );
}
