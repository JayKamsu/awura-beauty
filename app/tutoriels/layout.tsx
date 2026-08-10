import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

/** Métadonnées SEO de la section "Tutoriels". */
export const metadata: Metadata = buildPageMetadata({
  title: "Tutoriels",
  description:
    "Tutoriels Awura Beauty : comment utiliser le beurre, le démêlant, la lotion repousse et le savon solide.",
  path: "/tutoriels",
});

/** Layout de la section "Tutoriels" : ne fait que transmettre les enfants, sans habillage propre. */
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

