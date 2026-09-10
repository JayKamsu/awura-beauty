import { Suspense } from "react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { LegalNav } from "@/features/legal/legal-nav";
import { WithdrawalForm, WithdrawalPageIntro } from "@/features/legal/withdrawal-form";
import { WITHDRAWAL_PATH } from "@/lib/legal/pages";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Renoncer au contrat ici",
  description:
    "Formulaire de rétractation en ligne Awura Beauty : exerce ton droit de rétractation sous 14 jours et reçois un accusé de réception par e-mail.",
  path: WITHDRAWAL_PATH,
});

/**
 * Fonctionnalité de rétractation en ligne (art. L221-21 et D221-5 du
 * Code de la consommation) : visible, gratuite, avec accusé de réception.
 */
export default function RetractationPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Renoncer au contrat ici", path: WITHDRAWAL_PATH },
        ])}
      />
      <WithdrawalPageIntro />
      <LegalNav />
      <Suspense>
        <WithdrawalForm />
      </Suspense>
    </main>
  );
}
