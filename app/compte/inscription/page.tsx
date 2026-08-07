"use client";

import { useTranslation } from "react-i18next";
import { AuthForm } from "@/features/auth/components/auth-form";

export default function InscriptionPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-14 md:px-6">
      <header className="space-y-2 text-center">
        <h1 className="font-serif text-4xl text-primary">{t("auth.signupTitle")}</h1>
        <p className="text-muted">{t("auth.signupSubtitle")}</p>
      </header>
      <AuthForm mode="signup" />
    </main>
  );
}
