"use client";

import { useTranslation } from "react-i18next";

type AdminSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function AdminSearchField({
  value,
  onChange,
  placeholder,
}: AdminSearchFieldProps) {
  const { t } = useTranslation();

  return (
    <label className="block w-full max-w-md space-y-1.5 text-sm">
      <span className="sr-only">{t("admin.searchLabel")}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("admin.searchPlaceholder")}
        className="min-h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition placeholder:text-muted focus:border-accent"
      />
    </label>
  );
}
