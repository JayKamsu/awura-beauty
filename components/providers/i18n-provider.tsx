"use client";

import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n/config";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { AuthProvider } from "@/features/auth/context/auth-provider";
import { CartProvider } from "@/features/cart/context/cart-provider";

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <PreferencesProvider>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </PreferencesProvider>
    </I18nextProvider>
  );
}
