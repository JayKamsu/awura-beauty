"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useActionLock } from "@/lib/hooks/use-action-lock";

/** Page "Mot de passe oublié" : formulaire d'envoi du lien de réinitialisation par e-mail. */
export default function MotDePasseOubliePage() {
  const { t } = useTranslation();
  const { requestPasswordReset, configured } = useAuth();
  const { locked: pending, run } = useActionLock();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      setError(null);
      setInfo(null);
      const message = await requestPasswordReset(email.trim());
      if (message) {
        setError(message);
        return;
      }
      setInfo(t("auth.forgotPasswordSent"));
    });
  };

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-14 md:px-6">
      <header className="space-y-2 text-center">
        <h1 className="font-serif text-4xl text-primary">
          {t("auth.forgotPasswordTitle")}
        </h1>
        <p className="text-muted">{t("auth.forgotPasswordSubtitle")}</p>
      </header>

      <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-5">
        <div className="flex justify-center pb-2">
          <BrandLogo tone="accent" className="h-20 w-auto" sizes="180px" />
        </div>
        {!configured ? (
          <p className="rounded-xl bg-background-alt px-4 py-3 text-sm text-muted">
            {t("auth.notConfigured")}
          </p>
        ) : null}
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("auth.email")}</span>
          <input
            required
            type="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        {error ? (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="text-sm text-primary" role="status">
            {info}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          pending={pending}
          disabled={!configured}
        >
          {pending ? t("auth.loading") : t("auth.forgotPasswordSubmit")}
        </Button>
        <p className="text-center text-sm text-muted">
          <Link href="/compte/connexion" className="text-accent hover:text-accent-light">
            {t("auth.loginLink")}
          </Link>
        </p>
      </form>
    </main>
  );
}
