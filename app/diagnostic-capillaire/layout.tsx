import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

/** Métadonnées SEO de la section "Diagnostic capillaire". */
export const metadata: Metadata = buildPageMetadata({
  title: "Diagnostic capillaire en ligne ou présentiel | Awura Beauty",
  description:
    "Diagnostic Awura : analyse en ligne gratuite avec routine et liens produits, ou rendez-vous présentiel avec analyse du cuir chevelu au trichogramme et suivi personnalisé.",
  path: "/diagnostic-capillaire",
});

/** Layout de la section "Diagnostic capillaire" : ne fait que transmettre les enfants, sans habillage propre. */
export default function DiagnosticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
