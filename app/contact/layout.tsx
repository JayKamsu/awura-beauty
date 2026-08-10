import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

/** Métadonnées SEO de la page Contact. */
export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description:
    "Contacte Awura Beauty — Care@awurabeauty.com. Questions produits, commandes et conseils capillaires.",
  path: "/contact",
});

/** Layout de la section "Contact" : ne fait que transmettre les enfants, sans habillage propre. */
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

