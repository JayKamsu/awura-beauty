import type { Metadata } from "next";

/** Métadonnées de la page de visio diagnostic : non indexée par les moteurs de recherche. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Visio diagnostic | Awura Beauty",
};

/** Layout de la section "Visio diagnostic" : ne fait que transmettre les enfants, sans habillage propre. */
export default function DiagnosticVisioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
