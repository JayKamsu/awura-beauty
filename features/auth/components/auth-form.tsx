"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const { t } = useTranslation();
  const { signIn, signUp, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    if (mode === "login") {
      const message = await signIn(email, password);
      setPending(false);
      if (message) {
        setError(message);
        return;
      }
      router.push("/compte");
      router.refresh();
      return;
    }

    const result = await signUp(email, password);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setInfo(t("auth.signupConfirmEmail"));
      return;
    }

    setInfo(t("auth.signupSuccess"));
    router.push("/compte");
    router.refresh();
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

      <Button type="submit" size="lg" className="w-full" disabled={pending || !configured}>
        {pending
          ? t("auth.loading")
          : mode === "login"
            ? t("auth.loginSubmit")
            : t("auth.signupSubmit")}
      </Button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            {t("auth.noAccount")}{" "}
            <Link href="/compte/inscription" className="text-accent hover:text-accent-light">
              {t("auth.signupLink")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.hasAccount")}{" "}
            <Link href="/compte/connexion" className="text-accent hover:text-accent-light">
              {t("auth.loginLink")}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
