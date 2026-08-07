import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Diagnostic Capillaire",
  description:
    "Fais ton diagnostic capillaire Awura Beauty et reçois une routine personnalisée pour cheveux texturés, afro et métissés.",
  path: "/diagnostic-capillaire",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

