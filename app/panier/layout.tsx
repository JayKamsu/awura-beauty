import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Métadonnées de la page Panier : non indexée par les moteurs de recherche. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Layout de la section "Panier" : ne fait que transmettre les enfants, sans habillage propre. */
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

