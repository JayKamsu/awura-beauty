"use client";

import { I18nextProvider } from "react-i18next";
import type { ReactNode } from "react";
import i18n from "@/lib/i18n/config";
import { PreferencesProvider } from "@/components/providers/preferences-provider";

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <PreferencesProvider>{children}</PreferencesProvider>
    </I18nextProvider>
  );
}
