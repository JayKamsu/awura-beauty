"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AuthForm } from "@/features/auth/components/auth-form";
import { useAdminAccess } from "@/features/admin/hooks/use-admin-access";
import { useAuth } from "@/features/auth/context/auth-provider";

/** Page de connexion admin ; redirige automatiquement vers /admin si l'utilisateur est déjà admin connecté. */
export function AdminConnexionContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAccess();

  useEffect(() => {
    if (!loading && !adminLoading && user && isAdmin) {
      router.replace("/admin");
    }
  }, [adminLoading, isAdmin, loading, router, user]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-14 md:px-6">
      <header className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">
          {t("admin.eyebrow")}
        </p>
        <h1 className="font-serif text-4xl text-primary">
          {t("admin.guard.loginTitle")}
        </h1>
        <p className="text-muted">{t("admin.guard.loginBody")}</p>
      </header>
      <AuthForm
        mode="login"
        redirectTo="/admin"
        allowSignup={false}
        showForgotPassword={false}
      />
    </main>
  );
}
