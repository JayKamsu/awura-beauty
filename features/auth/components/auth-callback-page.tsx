"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { exchangeAuthCode } from "@/lib/infrastructure/supabase/auth";

export function AuthCallbackPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/compte";

      if (!code) {
        // Hash tokens (#access_token=) : Supabase client les lit via detectSessionInUrl
        window.setTimeout(() => {
          if (!cancelled) router.replace(next);
        }, 400);
        return;
      }

      const { error: exchangeError } = await exchangeAuthCode(code);
      if (cancelled) return;

      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }

      router.replace(next);
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <BrandLogo tone="auto" className="h-16 w-auto" />
      <h1 className="font-serif text-3xl text-primary">{t("auth.callbackTitle")}</h1>
      {error ? (
        <>
          <p className="text-sm text-accent" role="alert">
            {t("auth.callbackError")}
          </p>
          <Button href="/compte/connexion">{t("auth.loginLink")}</Button>
        </>
      ) : (
        <p className="text-muted">{t("auth.callbackLoading")}</p>
      )}
    </main>
  );
}
