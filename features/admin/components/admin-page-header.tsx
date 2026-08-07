"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          {t("admin.eyebrow")}
        </p>
        <h1 className="font-serif text-3xl text-primary md:text-4xl">{title}</h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm text-muted md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
