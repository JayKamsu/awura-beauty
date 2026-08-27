"use client";

import { useTranslation } from "react-i18next";
import { getPublicCompanyProfile } from "@/lib/site";

type FieldKey = "tradeName" | "director" | "email";

const FIELD_KEYS: FieldKey[] = ["tradeName", "director", "email"];

/** Carte d’identité légale : marque, publication et contact. */
export function CompanyCard() {
  const { t } = useTranslation();
  const profile = getPublicCompanyProfile();
  const values: Record<FieldKey, string> = {
    tradeName: profile.tradeName,
    director: profile.director,
    email: profile.email,
  };

  return (
    <section className="rounded-3xl bg-background-alt px-6 py-8">
      <p className="text-sm uppercase tracking-[0.18em] text-accent">
        {t("legal.company.cardEyebrow")}
      </p>
      <h2 className="mt-2 font-serif text-2xl text-primary sm:text-3xl">
        {t("legal.company.cardTitle")}
      </h2>
      <p className="mt-3 max-w-xl text-sm text-muted">
        {t("legal.company.cardIntro")}
      </p>
      <dl className="mt-8 grid gap-5 sm:grid-cols-2">
        {FIELD_KEYS.map((key) => (
          <div key={key}>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">
              {t(`legal.company.fields.${key}`)}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-primary">
              {key === "email" ? (
                <a
                  href={`mailto:${profile.email}`}
                  className="underline decoration-accent decoration-2 underline-offset-4 transition hover:text-accent"
                >
                  {profile.email}
                </a>
              ) : (
                values[key]
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
