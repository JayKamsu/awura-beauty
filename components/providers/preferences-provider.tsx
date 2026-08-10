"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import {
  type AppCurrency,
  type AppLocale,
  supportedCurrencies,
  supportedLocales,
} from "@/lib/i18n/config";

const LOCALE_KEY = "awura-locale";
const CURRENCY_KEY = "awura-currency";

type PreferencesContextValue = {
  locale: AppLocale;
  currency: AppCurrency;
  setLocale: (locale: AppLocale) => void;
  setCurrency: (currency: AppCurrency) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function isLocale(value: string): value is AppLocale {
  return (supportedLocales as readonly string[]).includes(value);
}

function isCurrency(value: string): value is AppCurrency {
  return (supportedCurrencies as readonly string[]).includes(value);
}

/** Fournit et persiste les préférences utilisateur (langue, devise) en localStorage. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState<AppLocale>("fr");
  const [currency, setCurrencyState] = useState<AppCurrency>("EUR");

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(LOCALE_KEY);
    const storedCurrency = window.localStorage.getItem(CURRENCY_KEY);

    if (storedLocale && isLocale(storedLocale)) {
      setLocaleState(storedLocale);
      void i18n.changeLanguage(storedLocale);
    }

    if (storedCurrency && isCurrency(storedCurrency)) {
      setCurrencyState(storedCurrency);
    }
  }, [i18n]);

  const setLocale = useCallback(
    (next: AppLocale) => {
      setLocaleState(next);
      window.localStorage.setItem(LOCALE_KEY, next);
      void i18n.changeLanguage(next);
      document.documentElement.lang = next;
    },
    [i18n],
  );

  const setCurrency = useCallback((next: AppCurrency) => {
    setCurrencyState(next);
    window.localStorage.setItem(CURRENCY_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ locale, currency, setLocale, setCurrency }),
    [locale, currency, setLocale, setCurrency],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

/** Accède à la langue et à la devise courantes ainsi qu'à leurs mutateurs. */
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
