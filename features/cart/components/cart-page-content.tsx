"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useCart } from "@/features/cart/context/cart-provider";
import { formatPrice } from "@/lib/format/price";

/** Page panier : liste des articles ajoutés, gestion des quantités et accès au tunnel de commande. */
export function CartPageContent() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, setQuantity, removeItem, itemCount } = useCart();

  const checkoutHref = user
    ? "/commande"
    : `/compte/connexion?redirect=${encodeURIComponent("/commande")}`;

  if (itemCount === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
        <h1 className="font-serif text-4xl text-primary">{t("cart.title")}</h1>
        <p className="text-muted">{t("cart.empty")}</p>
        <Button href="/boutique" size="lg">
          {t("cart.continueShopping")}
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <h1 className="font-serif text-4xl text-primary">{t("cart.title")}</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.productId}
            className="flex flex-col gap-4 rounded-2xl bg-background-alt/70 p-4 sm:flex-row sm:items-center"
          >
            <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-background">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-contain p-2"
                sizes="96px"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Link
                href={`/boutique/${item.slug}`}
                className="font-serif text-xl text-primary hover:text-accent"
              >
                {item.name}
              </Link>
              <p className="text-sm text-muted">
                {formatPrice(item.unitPrice, currency, i18n.language)}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
                  {t("cart.quantity")}
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      setQuantity(item.productId, Number(e.target.value) || 1)
                    }
                    className="h-11 w-16 rounded-lg border border-border bg-background px-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm text-accent hover:text-accent-light"
                >
                  {t("cart.remove")}
                </button>
              </div>
            </div>
            <p className="font-medium text-primary sm:text-right">
              {formatPrice(item.unitPrice * item.quantity, currency, i18n.language)}
            </p>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">{t("cart.subtotal")}</p>
          <p className="font-serif text-3xl text-primary">
            {formatPrice(subtotal, currency, i18n.language)}
          </p>
          {!authLoading && !user ? (
            <p className="mt-2 text-sm text-muted">{t("cart.loginRequired")}</p>
          ) : null}
        </div>
        <Button href={checkoutHref} size="lg">
          {user ? t("cart.checkout") : t("cart.checkoutLogin")}
        </Button>
      </div>
    </main>
  );
}
