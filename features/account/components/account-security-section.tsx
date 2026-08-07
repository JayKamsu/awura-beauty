"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

export function AccountSecuritySection() {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError(t("account.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("account.passwordMismatch"));
      return;
    }

    setPending(true);
    const err = await changePassword(password);
    setPending(false);
    if (err) {
      setError(err);
      return;
    }
    setPassword("");
    setConfirm("");
    setMessage(t("account.passwordChanged"));
  };

  return (
    <section id="securite" className="space-y-4 rounded-2xl border border-border p-6">
      <h2 className="font-serif text-2xl text-primary">{t("account.securityTitle")}</h2>
      <p className="text-sm text-muted">{t("account.securitySubtitle")}</p>

      <form onSubmit={onSubmit} className="max-w-md space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("account.newPassword")}</span>
          <input
            required
            type="password"
            minLength={6}
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("account.confirmPassword")}</span>
          <input
            required
            type="password"
            minLength={6}
            className={fieldClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        {error ? (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-primary" role="status">
            {message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? t("account.passwordSaving") : t("account.passwordSave")}
        </Button>
      </form>

      <p className="text-sm text-muted">
        <Link
          href="/compte/mot-de-passe-oublie"
          className="text-accent hover:text-accent-light"
        >
          {t("auth.forgotPasswordLink")}
        </Link>
      </p>
    </section>
  );
}
