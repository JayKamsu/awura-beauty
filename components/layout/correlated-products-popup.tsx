"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/components/providers/preferences-provider";
import { CART_ADDED_EVENT, type CartAddedDetail } from "@/features/cart/context/cart-provider";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { formatPrice } from "@/lib/format/price";

const ROUTINE_SLUGS = [
  "beurre-capillaire",
  "demelant-nourrissant",
  "masque-capillaire",
  "lotion-repousse",
  "savon-solide",
];

type PopupProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string;
  product_type?: string;
  is_bundle?: boolean;
  is_active?: boolean;
};

function routineRank(slug: string): number {
  const index = ROUTINE_SLUGS.indexOf(slug);
  return index === -1 ? ROUTINE_SLUGS.length : index;
}

function isQuietPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/compte") ||
    pathname.startsWith("/panier") ||
    pathname.startsWith("/commande") ||
    pathname.startsWith("/diagnostic")
  );
}

/** Soins qui se complètent : la routine capillaire, sans les produits déjà choisis. */
function pickCorrelated(
  products: PopupProduct[],
  excludeSlugs: ReadonlySet<string>,
): PopupProduct[] {
  const pool = products.filter(
    (product) =>
      product.is_active !== false &&
      !product.is_bundle &&
      product.image_url &&
      !excludeSlugs.has(product.slug),
  );
  const formulas = pool.filter((product) => product.product_type !== "accessory");
  const ranked = [...formulas].sort(
    (a, b) => routineRank(a.slug) - routineRank(b.slug),
  );
  return ranked.slice(0, 3);
}

/** Pop-up public : trois produits de la routine, à l'ajout d'un produit au panier. */
export function CorrelatedProductsPopup() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<PopupProduct[] | null>(null);
  const [products, setProducts] = useState<PopupProduct[]>([]);
  const [open, setOpen] = useState(false);

  useFocusTrap(open, dialogRef);

  useEffect(() => {
    let cancelled = false;

    const onAdded = (event: Event) => {
      if (isQuietPath(pathname)) return;
      const slug = (event as CustomEvent<CartAddedDetail>).detail?.slug;
      if (!slug) return;
      void (async () => {
        if (!catalogRef.current) {
          const response = await fetch("/api/catalog/products?pageSize=24");
          if (!response.ok || cancelled) return;
          const json = (await response.json()) as { products?: PopupProduct[] };
          catalogRef.current = json.products ?? [];
        }
        if (cancelled) return;
        const picked = pickCorrelated(catalogRef.current, new Set([slug]));
        if (picked.length < 2) return;
        setProducts(picked);
        setOpen(true);
      })();
    };

    window.addEventListener(CART_ADDED_EVENT, onAdded);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_ADDED_EVENT, onAdded);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || products.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-primary/50"
        aria-label={t("shop.popupClose")}
        onClick={() => setOpen(false)}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="correlated-popup-title"
        tabIndex={-1}
        className="relative z-[1] w-full max-w-3xl rounded-3xl bg-background px-5 py-6 shadow-lg outline-none sm:px-8 sm:py-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
              {t("shop.popupEyebrow")}
            </p>
            <h2
              id="correlated-popup-title"
              className="font-serif text-2xl text-primary sm:text-3xl"
            >
              {t("shop.popupTitle")}
            </h2>
            <p className="max-w-xl text-sm text-muted">{t("shop.popupBody")}</p>
          </div>
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-background-alt hover:text-primary"
            onClick={() => setOpen(false)}
            aria-label={t("shop.popupClose")}
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/boutique/${product.slug}`}
                className="group block space-y-2"
                onClick={() => setOpen(false)}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-background-alt">
                  <Image
                    src={product.image_url}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(min-width: 640px) 220px, 30vw"
                  />
                </div>
                <p className="font-medium leading-snug text-primary group-hover:text-accent">
                  {product.name}
                </p>
                <p className="text-sm text-muted">
                  {formatPrice(product.price, currency, i18n.language)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
