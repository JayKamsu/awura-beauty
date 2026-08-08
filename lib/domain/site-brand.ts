/** Paramètres marque / design gérables en admin. */

export type ProductUniverse = "adult" | "child";

export type QrDefaultMode = "tutorials" | "product" | "diagnostic" | "custom";

export type SiteBrandSettings = {
  duafeUrl: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  logoAccentUrl: string;
  childUniverseEnabled: boolean;
  showDuafePattern: boolean;
  qrDefaultMode: QrDefaultMode;
  qrCustomUrl: string;
};

export const DEFAULT_SITE_BRAND: SiteBrandSettings = {
  duafeUrl: "",
  logoLightUrl: "",
  logoDarkUrl: "",
  logoAccentUrl: "",
  childUniverseEnabled: false,
  showDuafePattern: true,
  qrDefaultMode: "tutorials",
  qrCustomUrl: "",
};
