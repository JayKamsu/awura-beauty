import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Boutique",
  description:
    "Découvre les soins Awura Beauty : beurre capillaire, démêlant, masque, lotion repousse et savon solide pour cheveux texturés.",
  path: "/boutique",
});

/** Layout de la page "Boutique" : ne fait que rendre les enfants (métadonnées SEO uniquement). */
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

