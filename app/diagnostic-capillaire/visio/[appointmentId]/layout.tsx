import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Visio diagnostic | Awura Beauty",
};

export default function DiagnosticVisioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
