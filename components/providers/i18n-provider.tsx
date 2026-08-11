"use client";

import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n/config";
import { DocumentLang } from "@/components/a11y/document-lang";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { AuthProvider } from "@/features/auth/context/auth-provider";
import { CartProvider } from "@/features/cart/context/cart-provider";
import { FavoritesProvider } from "@/features/favorites/context/favorites-provider";

type I18nProviderProps = {
  children: ReactNode;
};

/** Fournit l'internationalisation ainsi que les contextes préférences, auth, favoris et panier à l'application. */
export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <DocumentLang />
      <PreferencesProvider>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>{children}</CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </PreferencesProvider>
    </I18nextProvider>
  );
}
