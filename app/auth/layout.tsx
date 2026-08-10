import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Layout des pages d'authentification : exclut ces pages de l'indexation et rend les enfants tels quels. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
