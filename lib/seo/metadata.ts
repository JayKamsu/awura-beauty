import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/site";
import { BRAND_LOGOS } from "@/lib/brand";

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image,
  type = "website",
  noIndex = false,
}: BuildMetadataInput = {}): Metadata {
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(image || BRAND_LOGOS.orange);
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: title ? { absolute: fullTitle } : undefined,
    description,
    keywords: [...SITE_KEYWORDS],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: url,
      languages: {
        fr: url,
        "x-default": url,
      },
    },
    openGraph: {
      type,
      locale: "fr_FR",
      url,
      siteName: SITE_NAME,
      title: title ? fullTitle : SITE_NAME,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title ? `${title} — ${SITE_NAME}` : SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title ? fullTitle : SITE_NAME,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function rootMetadata(): Metadata {
  // Token public Search Console (balise meta). Surcharge possible via env.
  const googleVerification =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
    "ulugKK_si80ZM209r2iNgEwmYKmIjxDwLouE3Objj28";

  return {
    ...buildPageMetadata({ path: "/" }),
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s · ${SITE_NAME}`,
    },
    applicationName: SITE_NAME,
    category: "shopping",
    // Favicon / onglet : route App Router /icon (logo transparent)
    icons: {
      icon: [
        { url: "/icon", type: "image/png", sizes: "64x64" },
        { url: BRAND_LOGOS.orange, type: "image/png" },
      ],
      apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
      shortcut: "/icon",
    },
    verification: { google: googleVerification },
  };
}
