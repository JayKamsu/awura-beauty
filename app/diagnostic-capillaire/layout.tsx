import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Diagnostic capillaire en ligne ou présentiel | Awura Beauty",
  description:
    "Diagnostic Awura : analyse en ligne gratuite avec routine et liens produits, ou rendez-vous présentiel avec analyse du cuir chevelu au trichogramme et suivi personnalisé.",
  path: "/diagnostic-capillaire",
});

export default function DiagnosticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
