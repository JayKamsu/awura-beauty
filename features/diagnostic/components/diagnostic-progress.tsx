"use client";

import { useTranslation } from "react-i18next";

type DiagnosticProgressProps = {
  stepIndex: number;
  totalSteps: number;
};

export function DiagnosticProgress({
  stepIndex,
  totalSteps,
}: DiagnosticProgressProps) {
  const { t } = useTranslation();
  const percent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {t("diagnostic.progress", {
            current: stepIndex + 1,
            total: totalSteps,
          })}
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("diagnostic.progressLabel")}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
