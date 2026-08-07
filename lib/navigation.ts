/**
 * Navigation storefront — source unique desktop / mobile.
 */

export const MAIN_NAV_ITEMS = [
  { href: "/", key: "nav.home" },
  { href: "/boutique", key: "nav.shop" },
  { href: "/diagnostic-capillaire", key: "nav.diagnostic" },
  { href: "/a-propos", key: "nav.about" },
  { href: "/blog", key: "nav.blog" },
  { href: "/contact", key: "nav.contact" },
] as const;

/** Bottom bar mobile (max 5) — le reste passe par le menu. */
export const MOBILE_BOTTOM_NAV = [
  { href: "/", key: "nav.home", icon: "home" },
  { href: "/boutique", key: "nav.shop", icon: "shop" },
  {
    href: "/diagnostic-capillaire",
    key: "nav.diagnosticShort",
    icon: "diagnostic",
  },
  { href: "/panier", key: "header.cart", icon: "cart" },
  { href: "/compte", key: "nav.accountShort", icon: "account" },
] as const;

/** Liens secondaires (menu hamburger mobile). */
export const MOBILE_MORE_NAV = [
  { href: "/a-propos", key: "nav.about" },
  { href: "/blog", key: "nav.blog" },
  { href: "/contact", key: "nav.contact" },
  { href: "/recherche", key: "header.search" },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
