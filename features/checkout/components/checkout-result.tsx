"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/context/cart-provider";

type CheckoutResultProps = {
  status: "success" | "cancel";
  orderId?: string;
};

export function CheckoutResult({ status, orderId }: CheckoutResultProps) {
  const { t } = useTranslation();
  const { clearCart } = useCart();

  useEffect(() => {
    if (status !== "success" || !orderId) return;
    clearCart();
    void fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
  }, [status, orderId, clearCart]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
      <h1 className="font-serif text-4xl text-primary">
        {status === "success" ? t("checkout.successTitle") : t("checkout.cancelTitle")}
      </h1>
      <p className="text-muted">
        {status === "success"
          ? t("checkout.successBody", { id: orderId ?? "—" })
          : t("checkout.cancelBody")}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {status === "success" ? (
          <Button href="/compte" size="lg">
            {t("checkout.viewAccount")}
          </Button>
        ) : (
          <Button href="/commande" size="lg">
            {t("checkout.retry")}
          </Button>
        )}
        <Button href="/boutique" variant="primary-outline" size="lg">
          {t("cart.continueShopping")}
        </Button>
      </div>
      {status === "success" ? (
        <p className="text-sm text-muted">
          <Link href="/compte" className="text-accent hover:text-accent-light">
            {t("checkout.trackShipping")}
          </Link>
        </p>
      ) : null}
    </main>
  );
}
