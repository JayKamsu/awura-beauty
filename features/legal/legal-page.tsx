"use client";

import { JsonLd } from "@/components/seo/json-ld";
import { CompanyCard } from "@/features/legal/company-card";
import { LegalNav } from "@/features/legal/legal-nav";
import {
  LEGAL_PAGES,
  LEGAL_UPDATED_ISO,
  type LegalSlug,
} from "@/lib/legal/pages";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import {
  HOSTING_ADDRESS,
  HOSTING_PROVIDER,
  HOSTING_WEBSITE,
  getPublicCompanyProfile,
  getSiteUrl,
} from "@/lib/site";
import { useTranslation } from "react-i18next";

const SECTION_KEYS: Record<LegalSlug, readonly string[]> = {
  "informations-entreprise": ["purpose", "correspondence", "contact"],
  "mentions-legales": ["editor", "host", "ip", "data", "law"],
  "conditions-utilisation": [
    "purpose",
    "account",
    "products",
    "orders",
    "prices",
    "payment",
    "delivery",
    "withdrawal",
    "diagnostic",
    "ip",
    "liability",
    "law",
  ],
  "politique-de-retour": [
    "withdrawal",
    "cosmetics",
    "process",
    "refund",
    "defect",
    "pickup",
    "diagnostic",
  ],
  confidentialite: [
    "controller",
    "data",
    "purposes",
    "basis",
    "processors",
    "cookies",
    "retention",
    "rights",
    "transfers",
    "contact",
  ],
};

function interpolate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

function interpolationVars() {
  const company = getPublicCompanyProfile();
  return {
    siteName: company.tradeName,
    legalName: company.legalName,
    director: company.director,
    email: company.email,
    siteUrl: getSiteUrl(),
    hostName: HOSTING_PROVIDER,
    hostAddress: HOSTING_ADDRESS,
    hostUrl: HOSTING_WEBSITE,
  };
}

/** Page légale : titre, navigation, fiche entreprise le cas échéant, et sections i18n. */
export function LegalPage({ slug }: { slug: LegalSlug }) {
  const { t, i18n } = useTranslation();
  const page = LEGAL_PAGES[slug];
  const ns = page.i18nKey;
  const vars = interpolationVars();
  const updated = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "long",
  }).format(new Date(`${LEGAL_UPDATED_ISO}T00:00:00`));

  const paragraphsFor = (sectionKey: string) => {
    const body = t(`legal.${ns}.sections.${sectionKey}.body`, {
      returnObjects: true,
      ...vars,
    });
    if (Array.isArray(body)) return body.map((item) => interpolate(String(item), vars));
    if (typeof body === "string") return [interpolate(body, vars)];
    return [];
  };

  const showCompanyFirst = slug === "informations-entreprise";
  const showCompanyAfter = slug === "mentions-legales";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: page.titleFr, path: `/${slug}` },
        ])}
      />
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          {t(`legal.${ns}.eyebrow`)}
        </p>
        <h1 className="font-serif text-4xl text-primary sm:text-5xl">
          {t(`legal.${ns}.title`)}
        </h1>
        <p className="max-w-xl text-muted">{t(`legal.${ns}.intro`, vars)}</p>
        <p className="text-xs text-muted">
          {t("legal.updated", { date: updated })}
        </p>
      </header>

      <LegalNav current={slug} />

      {showCompanyFirst ? <CompanyCard /> : null}

      <div className="space-y-10">
        {SECTION_KEYS[slug].map((sectionKey) => (
          <section key={sectionKey} className="space-y-3">
            <h2 className="font-serif text-2xl text-primary">
              {t(`legal.${ns}.sections.${sectionKey}.title`)}
            </h2>
            {paragraphsFor(sectionKey).map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      {showCompanyAfter ? <CompanyCard /> : null}
    </main>
  );
}
