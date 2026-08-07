import type { ResourceLanguage } from "i18next";

import frLayout from "@/locales/fr/layout.json";
import frHome from "@/locales/fr/home.json";
import frShop from "@/locales/fr/shop.json";
import frAbout from "@/locales/fr/about.json";
import frDiagnostic from "@/locales/fr/diagnostic.json";
import frBlog from "@/locales/fr/blog.json";
import frAuth from "@/locales/fr/auth.json";
import frCart from "@/locales/fr/cart.json";
import frCheckout from "@/locales/fr/checkout.json";
import frAccount from "@/locales/fr/account.json";
import frAdmin from "@/locales/fr/admin.json";
import frContact from "@/locales/fr/contact.json";

import enLayout from "@/locales/en/layout.json";
import enHome from "@/locales/en/home.json";
import enShop from "@/locales/en/shop.json";
import enAbout from "@/locales/en/about.json";
import enDiagnostic from "@/locales/en/diagnostic.json";
import enBlog from "@/locales/en/blog.json";
import enAuth from "@/locales/en/auth.json";
import enCart from "@/locales/en/cart.json";
import enCheckout from "@/locales/en/checkout.json";
import enAccount from "@/locales/en/account.json";
import enAdmin from "@/locales/en/admin.json";
import enContact from "@/locales/en/contact.json";

import esLayout from "@/locales/es/layout.json";
import esHome from "@/locales/es/home.json";
import esShop from "@/locales/es/shop.json";
import esAbout from "@/locales/es/about.json";
import esDiagnostic from "@/locales/es/diagnostic.json";
import esBlog from "@/locales/es/blog.json";
import esAuth from "@/locales/es/auth.json";
import esCart from "@/locales/es/cart.json";
import esCheckout from "@/locales/es/checkout.json";
import esAccount from "@/locales/es/account.json";
import esAdmin from "@/locales/es/admin.json";
import esContact from "@/locales/es/contact.json";

function mergeLocale(...parts: Record<string, unknown>[]): ResourceLanguage {
  return Object.assign({}, ...parts) as ResourceLanguage;
}

export const localeResources = {
  fr: {
    translation: mergeLocale(
      frLayout,
      frHome,
      frShop,
      frAbout,
      frDiagnostic,
      frBlog,
      frAuth,
      frCart,
      frCheckout,
      frAccount,
      frAdmin,
      frContact,
    ),
  },
  en: {
    translation: mergeLocale(
      enLayout,
      enHome,
      enShop,
      enAbout,
      enDiagnostic,
      enBlog,
      enAuth,
      enCart,
      enCheckout,
      enAccount,
      enAdmin,
      enContact,
    ),
  },
  es: {
    translation: mergeLocale(
      esLayout,
      esHome,
      esShop,
      esAbout,
      esDiagnostic,
      esBlog,
      esAuth,
      esCart,
      esCheckout,
      esAccount,
      esAdmin,
      esContact,
    ),
  },
} as const;
