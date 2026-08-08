"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AuthForm } from "@/features/auth/components/auth-form";

function ConnexionForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/compte";

  return (
    <>
      <header className="space-y-2 text-center">
        <h1 className="font-serif text-4xl text-primary">{t("auth.loginTitle")}</h1>
        <p className="text-muted">
          {redirectTo.startsWith("/commande")
            ? t("auth.loginSubtitleCheckout")
            : t("auth.loginSubtitle")}
        </p>
      </header>
      <AuthForm mode="login" redirectTo={redirectTo} />
    </>
  );
}

export default function ConnexionPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-14 md:px-6">
      <Suspense fallback={null}>
        <ConnexionForm />
      </Suspense>
    </main>
  );
}
