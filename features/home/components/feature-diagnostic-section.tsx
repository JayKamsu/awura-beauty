"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { HOME_IMAGES } from "@/features/home/data/content";

const SELECT_FIELDS = [
  "hairType",
  "concern",
  "goal",
] as const;

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hairType: string;
  concern: string;
  goal: string;
  slot: string;
};

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  hairType: "",
  concern: "",
  goal: "",
  slot: "",
};

export function FeatureDiagnosticSection() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent";

  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
        <div className="relative flex flex-col justify-between gap-10 bg-primary px-6 py-14 text-background md:px-10 lg:py-16">
          <div className="relative z-10 max-w-md space-y-5">
            <p className="text-sm uppercase tracking-[0.2em] text-accent-light">
              {t("home.feature.eyebrow")}
            </p>
            <h2 className="font-serif text-3xl text-accent-light sm:text-4xl">
              {t("home.feature.title")}
            </h2>
            <p className="leading-relaxed text-background/85">
              {t("home.feature.description")}
            </p>
            <Button
              href="/boutique/lotion-repousse"
              variant="accent-outline"
              className="border-accent-light text-accent-light hover:bg-accent-light/10"
            >
              {t("home.feature.cta")}
            </Button>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-xs">
            <div className="relative aspect-square overflow-hidden rounded-full border-4 border-background/20">
              <Image
                src={HOME_IMAGES.feature}
                alt={t("home.feature.imageAlt")}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -left-10 size-56 rounded-full bg-background/5"
          />
        </div>

        <div className="relative bg-background-alt px-6 py-14 md:px-10 lg:py-16">
          <div className="relative z-10 mx-auto max-w-xl space-y-8">
            <div className="space-y-2">
              <h2 className="font-serif text-3xl text-primary sm:text-4xl">
                {t("home.diagnostic.title")}
              </h2>
              <p className="text-muted">{t("home.diagnostic.subtitle")}</p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted">{t("home.diagnostic.fields.firstName")}</span>
                  <input
                    required
                    className={fieldClass}
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted">{t("home.diagnostic.fields.lastName")}</span>
                  <input
                    required
                    className={fieldClass}
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted">{t("home.diagnostic.fields.email")}</span>
                  <input
                    required
                    type="email"
                    className={fieldClass}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-muted">{t("home.diagnostic.fields.phone")}</span>
                  <input
                    type="tel"
                    className={fieldClass}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </label>

                {SELECT_FIELDS.map((field) => (
                  <label key={field} className="space-y-1.5 text-sm sm:col-span-1">
                    <span className="text-muted">{t(`home.diagnostic.fields.${field}`)}</span>
                    <select
                      required
                      className={fieldClass}
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    >
                      <option value="">{t("home.diagnostic.fields.selectPlaceholder")}</option>
                      {(
                        t(`home.diagnostic.options.${field}`, {
                          returnObjects: true,
                        }) as string[]
                      ).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}

                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span className="text-muted">{t("home.diagnostic.fields.slot")}</span>
                  <input
                    required
                    type="datetime-local"
                    className={fieldClass}
                    value={form.slot}
                    onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}
                  />
                </label>
              </div>

              <Button type="submit" size="lg" className="w-full">
                {t("home.diagnostic.submit")}
              </Button>

              {submitted ? (
                <p className="text-center text-sm text-primary" role="status">
                  {t("home.diagnostic.success")}
                </p>
              ) : null}
            </form>
          </div>

          <svg
            aria-hidden
            viewBox="0 0 120 120"
            className="pointer-events-none absolute bottom-4 right-4 size-28 text-primary/10"
          >
            <path
              fill="currentColor"
              d="M70 110c-20-8-34-28-34-50 0-18 12-30 28-30 4 22 18 40 36 50-8 14-18 24-30 30Zm-40-20c-12-18-12-40 2-56 10 16 28 28 48 34-14 14-32 22-50 22Z"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
