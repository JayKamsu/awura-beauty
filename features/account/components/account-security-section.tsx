"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  AccountSection,
  accountFieldClass,
} from "@/features/account/components/account-section";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useActionLock } from "@/lib/hooks/use-action-lock";

/** Section Mon compte permettant au client de changer son mot de passe. */
export function AccountSecuritySection() {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const { locked: pending, run } = useActionLock();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
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

      const err = await changePassword(password);
      if (err) {
        setError(err);
        return;
      }
      setPassword("");
      setConfirm("");
      setMessage(t("account.passwordChanged"));
    });
  };

  return (
    <AccountSection
      id="securite"
      title={t("account.securityTitle")}
      subtitle={t("account.securitySubtitle")}
    >
      <form onSubmit={onSubmit} className="max-w-md space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("account.newPassword")}</span>
          <input
            required
            type="password"
            minLength={6}
            className={accountFieldClass}
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
            className={accountFieldClass}
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
        <Button type="submit" pending={pending}>
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
    </AccountSection>
  );
}
