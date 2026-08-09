"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/** Synchronise `<html lang>` avec la locale i18n (WCAG 3.1.1). */
export function DocumentLang() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = (i18n.language || "fr").slice(0, 2).toLowerCase();
    document.documentElement.lang = lang;
  }, [i18n.language]);

  return null;
}
