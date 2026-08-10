import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

/** Métadonnées SEO de la page Recherche. */
export const metadata: Metadata = buildPageMetadata({
  title: "Recherche",
  description:
    "Recherche les soins, articles et tutoriels Awura Beauty pour cheveux texturés.",
  path: "/recherche",
});

/** Layout de la section "Recherche" : ne fait que transmettre les enfants, sans habillage propre. */
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
