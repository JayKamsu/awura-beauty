import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Avis clients",
  description:
    "Notes et commentaires laissés par des clientes Awura Beauty après réception de leur commande.",
  path: "/avis",
});

/** Layout de la page "Avis clients" : ne fait que rendre les enfants (métadonnées SEO uniquement). */
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
