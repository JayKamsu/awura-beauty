import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog",
  description:
    "Conseils capillaires Awura Beauty : porosite, wash day, routines et éducation pour cheveux texturés.",
  path: "/blog",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

