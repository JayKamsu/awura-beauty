"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DiagnosticProgress } from "@/features/diagnostic/components/diagnostic-progress";
import { DiagnosticResult } from "@/features/diagnostic/components/diagnostic-result";
import {
  DIAGNOSTIC_STEPS,
  getOptionsForStep,
  type DiagnosticStepId,
} from "@/features/diagnostic/engine/recommend";
import { buildDiagnosticResult } from "@/features/diagnostic/engine/recommend";
import {
  getProductsBySlugs,
  saveHairDiagnostic,
  type DiagnosticAnswers,
  type DiagnosticProfile,
  type ProductRow,
} from "@/lib/infrastructure/supabase";

type AnswersState = Partial<DiagnosticAnswers>;

export function DiagnosticWizard() {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [profile, setProfile] = useState<DiagnosticProfile | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [saved, setSaved] = useState(false);
  const [linkedToUser, setLinkedToUser] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const step = DIAGNOSTIC_STEPS[stepIndex] as DiagnosticStepId;
  const options = useMemo(() => getOptionsForStep(step), [step]);
  const selected = answers[step];

  const selectOption = (value: (typeof options)[number]) => {
    setAnswers((prev) => ({ ...prev, [step]: value }));
  };

  const goNext = () => {
    if (!selected) return;

    const nextAnswers = { ...answers, [step]: selected } as AnswersState;

    if (stepIndex < DIAGNOSTIC_STEPS.length - 1) {
      setAnswers(nextAnswers);
      setStepIndex((index) => index + 1);
      return;
    }

    const completeAnswers = nextAnswers as DiagnosticAnswers;
    setAnswers(completeAnswers);

    startTransition(async () => {
      const result = buildDiagnosticResult(completeAnswers);
      const recommended = await getProductsBySlugs(result.recommendedProductSlugs);
      const persist = await saveHairDiagnostic({
        answers: completeAnswers,
        profile: result.profile,
        recommendedProductSlugs: result.recommendedProductSlugs,
      });

      setProfile(result.profile);
      setProducts(recommended);
      setSaved(persist.saved);
      setLinkedToUser(persist.linkedToUser);
      setDone(true);
    });
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((index) => index - 1);
  };

  const restart = () => {
    setStepIndex(0);
    setAnswers({});
    setProfile(null);
    setProducts([]);
    setSaved(false);
    setLinkedToUser(false);
    setDone(false);
  };

  if (done && profile) {
    return (
      <DiagnosticResult
        profile={profile}
        products={products}
        saved={saved}
        linkedToUser={linkedToUser}
        onRestart={restart}
      />
    );
  }

  return (
    <div className="space-y-8">
      <DiagnosticProgress
        stepIndex={stepIndex}
        totalSteps={DIAGNOSTIC_STEPS.length}
      />

      <div className="space-y-3">
        <h2 className="font-serif text-3xl text-primary sm:text-4xl">
          {t(`diagnostic.steps.${step}.title`)}
        </h2>
        <p className="text-muted">{t(`diagnostic.steps.${step}.subtitle`)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isActive = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => selectOption(option)}
              className={`rounded-2xl border px-5 py-4 text-left transition ${
                isActive
                  ? "border-primary bg-primary text-background"
                  : "border-border bg-background hover:border-accent"
              }`}
            >
              <span className="block font-medium">
                {t(`diagnostic.options.${step}.${option}.label`)}
              </span>
              <span
                className={`mt-1 block text-sm ${
                  isActive ? "text-background/80" : "text-muted"
                }`}
              >
                {t(`diagnostic.options.${step}.${option}.hint`)}
              </span>
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
            : stepIndex === DIAGNOSTIC_STEPS.length - 1
              ? t("diagnostic.seeResult")
              : t("diagnostic.next")}
        </Button>
      </div>
    </div>
  );
}
