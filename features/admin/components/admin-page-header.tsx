"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: AdminPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {/* Titre déjà dans le header mobile du shell */}
        <p className="hidden text-xs uppercase tracking-[0.18em] text-accent lg:block">
          {t("admin.eyebrow")}
        </p>
        <h1 className="hidden font-serif text-3xl text-primary lg:block md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm text-muted md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
