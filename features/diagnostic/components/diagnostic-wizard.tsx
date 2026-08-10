"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DiagnosticProgress } from "@/features/diagnostic/components/diagnostic-progress";
import { DiagnosticResult } from "@/features/diagnostic/components/diagnostic-result";
import { useAuth } from "@/features/auth/context/auth-provider";
import type {
  DiagnosticAnswerMap,
  DiagnosticProfile,
  DiagnosticQuestion,
  DiagnosticRoutineStep,
  DiagnosticSettings,
} from "@/lib/domain/diagnostic";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Questionnaire diagnostic en ligne, envoie les réponses puis affiche le résultat une fois soumis. */
export function DiagnosticWizard() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [settings, setSettings] = useState<DiagnosticSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosticAnswerMap>({});
  const [profile, setProfile] = useState<DiagnosticProfile | null>(null);
  const [routine, setRoutine] = useState<DiagnosticRoutineStep[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [saved, setSaved] = useState(false);
  const [linkedToUser, setLinkedToUser] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/diagnostic/questionnaire?channel=online&locale=${encodeURIComponent(i18n.language)}`,
      );
      const json = (await res.json()) as {
        questions?: DiagnosticQuestion[];
        settings?: DiagnosticSettings;
      };
      if (cancelled) return;
      setQuestions(json.questions ?? []);
      setSettings(json.settings ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const step = questions[stepIndex];
  const selected = step ? answers[step.questionKey] : undefined;

  const selectOption = (valueKey: string) => {
    if (!step) return;
    setAnswers((prev) => ({ ...prev, [step.questionKey]: valueKey }));
  };

  const goNext = () => {
    if (!step || !selected) return;
    if (stepIndex < questions.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }

    startTransition(async () => {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/diagnostic/submit", {
        method: "POST",
        headers,
        body: JSON.stringify({ answers, locale: i18n.language }),
      });
      const json = (await res.json()) as {
        profile?: DiagnosticProfile;
        routine?: DiagnosticRoutineStep[];
        products?: ProductRow[];
        saved?: boolean;
        linkedToUser?: boolean;
      };
      if (!res.ok || !json.profile) return;
      setProfile(json.profile);
      setRoutine(json.routine ?? []);
      setProducts(json.products ?? []);
      setSaved(Boolean(json.saved));
      setLinkedToUser(Boolean(json.linkedToUser));
      setDone(true);
    });
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  };

  const restart = () => {
    setStepIndex(0);
    setAnswers({});
    setProfile(null);
    setRoutine([]);
    setProducts([]);
    setSaved(false);
    setLinkedToUser(false);
    setDone(false);
  };

  if (loading) {
    return <p className="text-muted">{t("diagnostic.loading")}</p>;
  }

  if (!questions.length) {
    return <p className="text-muted">{t("diagnostic.emptyQuestions")}</p>;
  }

  if (done && profile) {
    return (
      <DiagnosticResult
        profile={profile}
        products={products}
        routine={routine}
        saved={saved}
        linkedToUser={linkedToUser}
        settings={settings}
        onRestart={restart}
      />
    );
  }

  return (
    <div className="space-y-8">
      <DiagnosticProgress stepIndex={stepIndex} totalSteps={questions.length} />

      <div className="space-y-3">
        <h2 className="font-serif text-3xl text-primary sm:text-4xl">
          {step.title}
        </h2>
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
              onClick={() => selectOption(option.valueKey)}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                isActive
                  ? "border-primary bg-primary text-background"
                  : "border-border bg-background hover:border-accent"
              }`}
            >
              <span className="block font-medium">{option.label}</span>
              {option.hint ? (
                <span
                  className={`mt-1 block text-sm ${
                    isActive ? "text-background/80" : "text-muted"
                  }`}
                >
                  {option.hint}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={stepIndex === 0 || pending}
        >
          {t("diagnostic.back")}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={goNext}
          disabled={!selected || pending}
        >
          {pending
            ? t("diagnostic.loading")
            : stepIndex === questions.length - 1
              ? t("diagnostic.seeResult")
              : t("diagnostic.next")}
        </Button>
      </div>
    </div>
  );
}
