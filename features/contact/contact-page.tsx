"use client";

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { CONTACT_EMAIL } from "@/lib/site";

const SUBJECT_KEYS = [
  "order",
  "product",
  "diagnostic",
  "shipping",
  "returns",
  "partnership",
  "other",
] as const;

type SubjectKey = (typeof SUBJECT_KEYS)[number];

/** Page de contact : formulaire (sujet prédéfini, coordonnées, message) qui ouvre un e-mail complet et pré-rempli vers l'adresse de contact. */
export function ContactPageContent() {
  const { t } = useTranslation();
  const { locked, runSync } = useActionLock();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [subject, setSubject] = useState<SubjectKey>("order");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent";

  const showOrderNumber = subject === "order" || subject === "shipping" || subject === "returns";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSync(() => {
      const subjectLabel = t(`contact.subjects.${subject}`);
      const mailSubject = encodeURIComponent(
        t("contact.mailSubject", { subject: subjectLabel }),
      );

      const lines = [
        `${t("contact.fields.subject")}: ${subjectLabel}`,
        `${t("contact.fields.name")}: ${name}`,
        `${t("contact.fields.email")}: ${email}`,
      ];
      if (phone.trim()) lines.push(`${t("contact.fields.phone")}: ${phone}`);
      if (showOrderNumber && orderNumber.trim()) {
        lines.push(`${t("contact.fields.orderNumber")}: ${orderNumber}`);
      }
      lines.push("", message);

      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${body}`;
      setSent(true);
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.18em] text-accent">
          {t("contact.eyebrow")}
        </p>
        <h1 className="font-serif text-4xl text-primary sm:text-5xl">
          {t("contact.title")}
        </h1>
        <p className="max-w-xl text-muted">{t("contact.subtitle")}</p>
      </header>

      <section className="rounded-3xl bg-background-alt px-6 py-8">
        <p className="text-sm text-muted">{t("contact.emailLabel")}</p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-2 inline-block font-serif text-2xl text-primary transition hover:text-accent"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="mt-3 text-sm text-muted">{t("contact.hours")}</p>
      </section>

      <form className="space-y-5" onSubmit={onSubmit}>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("contact.fields.subject")}</span>
          <select
            required
            className={fieldClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectKey)}
          >
            {SUBJECT_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`contact.subjects.${key}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="text-muted">{t("contact.fields.name")}</span>
            <input
              required
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="text-muted">{t("contact.fields.email")}</span>
            <input
              required
              type="email"
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="text-muted">
              {t("contact.fields.phone")}{" "}
              <span className="text-muted/60">({t("contact.optional")})</span>
            </span>
            <input
              type="tel"
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
          {showOrderNumber ? (
            <label className="space-y-1.5 text-sm">
              <span className="text-muted">
                {t("contact.fields.orderNumber")}{" "}
                <span className="text-muted/60">({t("contact.optional")})</span>
              </span>
              <input
                className={fieldClass}
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder={t("contact.orderNumberPlaceholder")}
              />
            </label>
          ) : null}
        </div>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("contact.fields.message")}</span>
          <textarea
            required
            rows={6}
            className={fieldClass}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <Button type="submit" size="lg" pending={locked}>
          {t("contact.submit")}
        </Button>
        {sent ? (
          <p className="text-sm text-primary" role="status">
            {t("contact.success")}
          </p>
        ) : null}
      </form>
    </main>
  );
}
