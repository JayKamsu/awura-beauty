/** Paramètres marque / design gérables en admin. */

/** Univers produit ciblé (catalogue adulte vs enfant). */
export type ProductUniverse = "adult" | "child";

/** Destination par défaut du QR code affiché en boutique/emballage. */
export type QrDefaultMode = "tutorials" | "product" | "diagnostic" | "custom";

/** Réglages de marque/design éditables en admin (logos, univers enfant, QR). */
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
