import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

/** Charte officielle : Montserrat (docs/design-system/typography.md). */
const awuraSans = Montserrat({
  variable: "--font-awura-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800"],
});

export const metadata: Metadata = rootMetadata();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${awuraSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <ThemeProvider>
          <I18nProvider>
            <SiteShell>{children}</SiteShell>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
