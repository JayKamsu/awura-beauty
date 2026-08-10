"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBrandSettings } from "@/components/brand/brand-settings-provider";
import { BRAND_LOGOS } from "@/lib/brand";

/** Variante de coloris du logo selon le fond sur lequel il est affiché. */
export type BrandLogoTone = "auto" | "on-light" | "on-dark" | "accent";

type BrandLogoProps = {
  tone?: BrandLogoTone;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

function resolveSrc(
  tone: BrandLogoTone,
  theme: string | undefined,
  overrides: {
    light?: string;
    dark?: string;
    accent?: string;
  },
) {
  if (tone === "accent") {
    return overrides.accent || BRAND_LOGOS.orange;
  }
  if (tone === "on-light") {
    return overrides.light || BRAND_LOGOS.black;
  }
  if (tone === "on-dark") {
    return overrides.dark || BRAND_LOGOS.white;
  }
  return theme === "dark"
    ? overrides.dark || BRAND_LOGOS.white
    : overrides.light || BRAND_LOGOS.black;
}

/** Affiche le logo de la marque, adapté au thème clair/sombre et aux réglages admin. */
export function BrandLogo({
  tone = "auto",
  className = "h-10 w-auto",
  priority = false,
  sizes = "160px",
}: BrandLogoProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { settings } = useBrandSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src = resolveSrc(tone, mounted ? resolvedTheme : "light", {
    light: settings.logoLightUrl || undefined,
    dark: settings.logoDarkUrl || undefined,
    accent: settings.logoAccentUrl || undefined,
  });
  const isRemote = src.startsWith("http");

  return (
    <span className={`relative inline-flex shrink-0 overflow-hidden ${className}`}>
      {isRemote ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={t("header.brand")}
          className="h-full w-auto object-contain object-left"
        />
      ) : (
        <Image
          src={src}
          alt={t("header.brand")}
          width={827}
          height={638}
          priority={priority}
          sizes={sizes}
          className="h-full w-auto object-contain object-left"
        />
      )}
    </span>
  );
}
