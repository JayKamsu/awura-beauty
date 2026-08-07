import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "À propos",
  description:
    "Histoire, mission et engagements d'Awura Beauty : des soins naturels premium pour sublimer les cheveux texturés, afro et métissés.",
  path: "/a-propos",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

