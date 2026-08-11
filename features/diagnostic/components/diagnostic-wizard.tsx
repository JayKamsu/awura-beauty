"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DiagnosticOptionGrid } from "@/features/diagnostic/components/diagnostic-option-grid";
import { DiagnosticPhotoUpload } from "@/features/diagnostic/components/diagnostic-photo-upload";
import { DiagnosticProgress } from "@/features/diagnostic/components/diagnostic-progress";
import { DiagnosticResult } from "@/features/diagnostic/components/diagnostic-result";
import { useAuth } from "@/features/auth/context/auth-provider";
import type {
  DiagnosticAnswerMap,
  DiagnosticPhoto,
  DiagnosticProfile,
  DiagnosticQuestion,
  DiagnosticRoutineStep,
  DiagnosticSettings,
} from "@/lib/domain/diagnostic";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

const textareaClass =
  "w-full min-h-28 rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 sm:text-sm";

/** Questionnaire diagnostic en ligne, envoie les réponses puis affiche le résultat une fois soumis. */
export function DiagnosticWizard() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [sessionId] = useState(
    () => `diag-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [settings, setSettings] = useState<DiagnosticSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosticAnswerMap>({});
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<DiagnosticPhoto[]>([]);
  const [showExtras, setShowExtras] = useState(false);
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

  const step = showExtras ? undefined : questions[stepIndex];
  const selected = step ? answers[step.questionKey] : undefined;
  const canSkip = Boolean(step?.allowUnknown);

  const selectOption = (valueKey: string) => {
    if (!step) return;
    setAnswers((prev) => ({ ...prev, [step.questionKey]: valueKey }));
  };

  const submit = () => {
    startTransition(async () => {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/diagnostic/submit", {
        method: "POST",
        headers,
        body: JSON.stringify({
          answers,
          locale: i18n.language,
          notes: notes.trim() || undefined,
          photos,
        }),
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

  const goNext = (valueKeyOverride?: string) => {
    if (showExtras) {
      submit();
      return;
    }
    const value = valueKeyOverride ?? selected;
    if (!step || !value) return;
    if (stepIndex < questions.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    setShowExtras(true);
  };

  const goBack = () => {
    if (showExtras) {
      setShowExtras(false);
      return;
    }
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  };

  const restart = () => {
    setStepIndex(0);
    setAnswers({});
    setNotes("");
    setPhotos([]);
    setShowExtras(false);
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

  if (showExtras) {
    return (
      <div className="space-y-8">
        <DiagnosticProgress stepIndex={questions.length} totalSteps={questions.length + 1} />

        <div className="space-y-3">
          <h2 className="font-serif text-3xl text-primary sm:text-4xl">
            {t("diagnostic.extras.title")}
          </h2>
          <p className="text-muted">{t("diagnostic.extras.subtitle")}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="diagnostic-notes" className="block text-sm font-medium text-foreground">
            {t("diagnostic.extras.notesLabel")}
          </label>
          <textarea
            id="diagnostic-notes"
            className={textareaClass}
            placeholder={t("diagnostic.extras.notesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t("diagnostic.extras.photosLabel")}
          </p>
          <p className="text-sm text-muted">{t("diagnostic.extras.photosHint")}</p>
          <DiagnosticPhotoUpload sessionId={sessionId} onChange={setPhotos} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={goBack} disabled={pending}>
            {t("diagnostic.back")}
          </Button>
          <Button type="button" size="lg" onClick={() => goNext()} disabled={pending}>
            {pending ? t("diagnostic.loading") : t("diagnostic.seeResult")}
          </Button>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="space-y-8">
      <DiagnosticProgress stepIndex={stepIndex} totalSteps={questions.length + 1} />

      <div className="space-y-3">
        <h2 className="font-serif text-3xl text-primary sm:text-4xl">
          {step.title}
        </h2>
        {step.subtitle ? (
          <p className="text-muted">{step.subtitle}</p>
        ) : null}
      </div>

      <DiagnosticOptionGrid
        options={step.options}
        selected={selected}
        onSelect={selectOption}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={stepIndex === 0 || pending}
        >
          {t("diagnostic.back")}
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          {canSkip && !selected ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                selectOption("dont_know");
                goNext("dont_know");
              }}
              disabled={pending}
            >
              {t("diagnostic.dontKnow")}
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            onClick={() => goNext()}
            disabled={!selected || pending}
          >
            {pending ? t("diagnostic.loading") : t("diagnostic.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
