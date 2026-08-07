"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BRAND_LOGOS } from "@/lib/brand";

export type BrandLogoTone = "auto" | "on-light" | "on-dark" | "accent";

type BrandLogoProps = {
  /** auto = suit le thème ; on-light = noir ; on-dark = blanc ; accent = orange */
  tone?: BrandLogoTone;
  className?: string;
  /** Hauteur CSS (ex. h-10, h-14) — largeur auto */
  priority?: boolean;
  sizes?: string;
};

function resolveSrc(tone: BrandLogoTone, theme: string | undefined) {
  if (tone === "accent") return BRAND_LOGOS.orange;
  if (tone === "on-light") return BRAND_LOGOS.black;
  if (tone === "on-dark") return BRAND_LOGOS.white;
  return theme === "dark" ? BRAND_LOGOS.white : BRAND_LOGOS.black;
}

export function BrandLogo({
  tone = "auto",
  className = "h-10 w-auto",
  priority = false,
  sizes = "160px",
}: BrandLogoProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const src = resolveSrc(tone, mounted ? resolvedTheme : "light");

  return (
    <span className={`relative inline-flex shrink-0 overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={t("header.brand")}
        width={827}
        height={638}
        priority={priority}
        sizes={sizes}
        className="h-full w-auto object-contain object-left"
      />
    </span>
  );
}
