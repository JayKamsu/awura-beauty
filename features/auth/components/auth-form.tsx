"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { REF_STORAGE_KEY } from "@/features/account/components/account-loyalty-section";
import { useAuth } from "@/features/auth/context/auth-provider";
import { resolvePostLoginPath } from "@/features/auth/lib/resolve-post-login-path";
import { useActionLock } from "@/lib/hooks/use-action-lock";

/** Props du formulaire d'authentification, partagé entre connexion et inscription. */
type AuthFormProps = {
  mode: "login" | "signup";
  redirectTo?: string;
  allowSignup?: boolean;
  showForgotPassword?: boolean;
};

/** Formulaire de connexion/inscription (email + Google), avec rattachement du code de parrainage à l'inscription. */
export function AuthForm({
  mode,
  redirectTo = "/compte",
  allowSignup = true,
  showForgotPassword = true,
}: AuthFormProps) {
  const { t } = useTranslation();
  const { signIn, signUp, signInWithGoogle, configured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locked, run } = useActionLock();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "signup") return;
    const fromQuery = searchParams.get("ref")?.trim().toUpperCase() ?? "";
    if (fromQuery) {
      setReferralCode(fromQuery);
      window.localStorage.setItem(REF_STORAGE_KEY, fromQuery);
    }
  }, [mode, searchParams]);

  const persistReferralCode = () => {
    const code = referralCode.trim().toUpperCase();
    if (code) window.localStorage.setItem(REF_STORAGE_KEY, code);
  };

  const attachReferralIfNeeded = async (accessToken: string | undefined) => {
    const code =
      referralCode.trim().toUpperCase() ||
      window.localStorage.getItem(REF_STORAGE_KEY) ||
      "";
    if (!code || !accessToken) return;
    await fetch("/api/account/loyalty/referral", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    window.localStorage.removeItem(REF_STORAGE_KEY);
  };

  const onGoogle = () => {
    void run(async () => {
      setError(null);
      setInfo(null);
      if (mode === "signup") persistReferralCode();
      const message = await signInWithGoogle(redirectTo);
      if (message) setError(message);
      // Sinon redirection navigateur vers Google — le verrou se libère au finally
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      setError(null);
      setInfo(null);

      if (mode === "login") {
        const message = await signIn(email, password);
        if (message) {
          setError(message);
          return;
        }
        const destination = await resolvePostLoginPath(redirectTo);
        router.push(destination);
        router.refresh();
        return;
      }

      persistReferralCode();
      const result = await signUp(email, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.needsEmailConfirmation) {
        setInfo(t("auth.signupConfirmEmail"));
        return;
      }

      await attachReferralIfNeeded(result.accessToken ?? undefined);
      setInfo(t("auth.signupSuccess"));
      router.push(redirectTo);
      router.refresh();
    });
  };

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-5">
      <div className="flex justify-center pb-2">
        <BrandLogo tone="accent" className="h-20 w-auto" sizes="180px" />
      </div>
      {!configured ? (
        <p className="rounded-xl bg-background-alt px-4 py-3 text-sm text-muted">
          {t("auth.notConfigured")}
        </p>
      ) : null}

      <Button
        type="button"
        variant="primary-outline"
        size="lg"
        className="w-full"
        pending={locked}
        disabled={!configured}
        onClick={onGoogle}
      >
        {locked ? t("auth.loading") : t("auth.continueWithGoogle")}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        <span>{t("auth.orEmail")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

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

      <label className="block space-y-1.5 text-sm">
        <span className="text-muted">{t("auth.password")}</span>
        <input
          required
          type="password"
          minLength={6}
          className={fieldClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>

      {mode === "signup" ? (
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("auth.referralCode")}</span>
          <input
            type="text"
            className={fieldClass}
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            autoComplete="off"
            placeholder={t("auth.referralCodePlaceholder")}
          />
        </label>
      ) : null}

      {mode === "login" && showForgotPassword ? (
        <p className="text-right text-sm">
          <Link
            href="/compte/mot-de-passe-oublie"
            className="text-accent hover:text-accent-light"
          >
            {t("auth.forgotPasswordLink")}
          </Link>
        </p>
      ) : null}

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
        pending={locked}
        disabled={!configured}
      >
        {locked
          ? t("auth.loading")
          : mode === "login"
            ? t("auth.loginSubmit")
            : t("auth.signupSubmit")}
      </Button>

      {mode === "login" && allowSignup ? (
        <p className="text-center text-sm text-muted">
          {t("auth.noAccount")}{" "}
          <Link
            href={`/compte/inscription?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-accent hover:text-accent-light"
          >
            {t("auth.signupLink")}
          </Link>
        </p>
      ) : null}

      {mode === "signup" ? (
        <p className="text-center text-sm text-muted">
          {t("auth.hasAccount")}{" "}
          <Link
            href={`/compte/connexion?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-accent hover:text-accent-light"
          >
            {t("auth.loginLink")}
          </Link>
        </p>
      ) : null}
    </form>
  );
}
