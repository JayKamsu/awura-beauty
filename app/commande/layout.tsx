import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Layout des pages de commande : exclut ces pages de l'indexation et rend les enfants tels quels. */
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

