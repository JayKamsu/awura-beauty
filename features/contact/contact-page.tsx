"use client";

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { CONTACT_EMAIL } from "@/lib/site";

/** Page de contact : formulaire qui ouvre un e-mail pré-rempli vers l'adresse de contact. */
export function ContactPageContent() {
  const { t } = useTranslation();
  const { locked, runSync } = useActionLock();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSync(() => {
      const subject = encodeURIComponent(
        t("contact.mailSubject", { name: name.trim() || t("contact.anonymous") }),
      );
      const body = encodeURIComponent(
        `${t("contact.fields.name")}: ${name}\n${t("contact.fields.email")}: ${email}\n\n${message}`,
      );
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
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
