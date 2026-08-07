import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Recherche",
  description:
    "Recherche les soins, articles et tutoriels Awura Beauty pour cheveux texturés.",
  path: "/recherche",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
