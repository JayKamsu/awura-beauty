import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Témoignages",
  description:
    "Témoignages de clientes Awura Beauty : soins, diagnostic capillaire et routines pour cheveux texturés.",
  path: "/temoignages",
});

/** Layout historique /avis : métadonnées alignées sur /temoignages (redirection). */
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
