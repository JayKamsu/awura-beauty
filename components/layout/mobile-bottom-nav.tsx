"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useCart } from "@/features/cart/context/cart-provider";
import {
  isNavActive,
  MOBILE_BOTTOM_NAV,
} from "@/lib/navigation";

function NavIcon({
  name,
  className = "size-5",
}: {
  name: (typeof MOBILE_BOTTOM_NAV)[number]["icon"];
  className?: string;
}) {
  const props = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
  } as const;

  switch (name) {
    case "home":
      return (
        <svg {...props}>
          <path d="M4 10.5 12 4l8 6.5V20H14v-5h-4v5H4V10.5Z" />
        </svg>
      );
    case "shop":
      return (
        <svg {...props}>
          <path d="M5 8h14l-1.2 11H6.2L5 8Z" />
          <path d="M9 8V6.5A3 3 0 0 1 15 6.5V8" />
        </svg>
      );
    case "diagnostic":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="7.25" />
          <path d="M12 8.5v4.2l2.5 1.5" />
        </svg>
      );
    case "cart":
      return (
        <svg {...props}>
          <path d="M6 7h12l-1 11H7L6 7Z" />
          <path d="M9 7V5.5A3 3 0 0 1 15 5.5V7" />
        </svg>
      );
    case "account":
      return (
        <svg {...props}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14Z" />
        </svg>
      );
    default:
      return null;
  }
}

/** Barre de navigation fixe en bas d'écran pour les affichages mobiles. */
export function MobileBottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user } = useAuth();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      aria-label={t("nav.bottomLabel")}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-0 px-1 pt-1">
        {MOBILE_BOTTOM_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          const showCartBadge = item.icon === "cart" && itemCount > 0;
          const accountInitial =
            item.icon === "account" && user?.email
              ? user.email.trim().charAt(0).toUpperCase()
              : null;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] transition sm:text-[11px] ${
                  active
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span className="relative inline-flex size-6 items-center justify-center">
                  {accountInitial ? (
                    <span
                      className={`font-serif text-sm font-semibold leading-none ${
                        active ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {accountInitial}
                    </span>
                  ) : (
                    <NavIcon name={item.icon} />
                  )}
                  {showCartBadge ? (
                    <span className="absolute -right-2 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-background">
                      {itemCount}
                    </span>
                  ) : null}
                  {item.icon === "account" && user ? (
                    <span
                      className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-accent"
                      aria-hidden
                    />
                  ) : null}
                </span>
                <span className="max-w-full truncate font-medium leading-tight">
                  {t(item.key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
