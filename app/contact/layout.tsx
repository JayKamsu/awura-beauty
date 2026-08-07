import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description:
    "Contacte Awura Beauty — Care@awurabeauty.com. Questions produits, commandes et conseils capillaires.",
  path: "/contact",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

