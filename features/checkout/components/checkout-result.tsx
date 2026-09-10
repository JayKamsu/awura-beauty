"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useCart } from "@/features/cart/context/cart-provider";
import { usePreferences } from "@/components/providers/preferences-provider";
import {
  isOrderPaid,
  resolvePaymentStatus,
} from "@/lib/application/checkout/payment-status";
import { formatPrice } from "@/lib/format/price";
import { WITHDRAWAL_PATH } from "@/lib/legal/pages";
import { listMyOrders } from "@/lib/infrastructure/supabase/orders";
import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";

type CheckoutResultProps = {
  status: "success" | "cancel";
  orderId?: string;
  sessionId?: string;
};

function orderAccountHref(orderId: string) {
  return `/compte?order=${encodeURIComponent(orderId)}#commandes`;
}

/** Page de résultat après paiement : confirme la commande côté serveur en cas de succès, ou notifie l'annulation. */
export function CheckoutResult({
  status,
  orderId,
  sessionId,
}: CheckoutResultProps) {
  const { t, i18n } = useTranslation();
  const { clearCart } = useCart();
  const { session } = useAuth();
  const { currency } = usePreferences();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [confirming, setConfirming] = useState(status === "success");
  const [receiptPreview, setReceiptPreview] = useState<{
    title: string;
    url: string;
    subtitle?: string;
  } | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    if (status !== "success" || !orderId) return;
    clearCart();

    let cancelled = false;
    setConfirming(true);

    const confirmAndLoad = async () => {
      await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, sessionId }),
      });

      const orders = await listMyOrders();
      if (cancelled) return;
      const found = orders.find((row) => row.id === orderId) ?? null;
      setOrder(found);
      setConfirming(false);
    };

    void confirmAndLoad();
    return () => {
      cancelled = true;
    };
  }, [status, orderId, sessionId, clearCart]);

  useEffect(() => {
    if (status !== "cancel" || !orderId || !session?.access_token) return;

    void fetch("/api/account/orders/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ orderId }),
    });
  }, [status, orderId, session?.access_token]);

  const openReceipt = async () => {
    if (!orderId || !session?.access_token) return;
    setReceiptLoading(true);
    const response = await fetch(
      `/api/account/orders/receipt?orderId=${encodeURIComponent(orderId)}`,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
      },
    );
    setReceiptLoading(false);
    if (!response.ok) return;
    const html = await response.text();
    const blobUrl = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
    );
    setReceiptPreview({
      title: t("account.receiptPreviewTitle"),
      url: blobUrl,
      subtitle: t("account.orderId", { id: orderId.slice(0, 8) }),
    });
  };

  const paid = order ? isOrderPaid(order) : false;
  const paymentStatus = order ? resolvePaymentStatus(order) : null;
  const accountHref = orderId ? orderAccountHref(orderId) : "/compte#commandes";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
      <h1 className="font-serif text-4xl text-primary">
        {status === "success"
          ? t("checkout.successTitle")
          : t("checkout.cancelTitle")}
      </h1>
      <p className="text-muted">
        {status === "success"
          ? t("checkout.successBody", { id: orderId?.slice(0, 8) ?? "—" })
          : t("checkout.cancelBody")}
      </p>

      {status === "success" && confirming ? (
        <p className="text-sm text-muted">{t("checkout.confirmingPayment")}</p>
      ) : null}

      {status === "success" && order ? (
        <div className="w-full space-y-3 rounded-2xl border border-border p-5 text-left text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-primary">
              {t("account.orderId", { id: order.id.slice(0, 8) })}
            </p>
            {paymentStatus ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {t(`account.status.payment.${paymentStatus}`)}
              </span>
            ) : null}
          </div>
          <p className="font-serif text-2xl text-primary">
            {formatPrice(order.total, order.currency || currency, i18n.language)}
          </p>
          <p className="text-muted">
            {t("account.paymentMethod")} :{" "}
            {t(`checkout.methods.${order.payment_method}.label`)}
          </p>
          {paid ? (
            <Button
              type="button"
              variant="primary-outline"
              size="md"
              pending={receiptLoading}
              onClick={() => void openReceipt()}
            >
              {t("account.previewReceipt")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        {status === "success" ? (
          <Button href={accountHref} size="lg">
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
        {status === "success" && orderId ? (
          <Button
            href={`${WITHDRAWAL_PATH}?commande=${encodeURIComponent(orderId)}`}
            variant="ghost"
            size="lg"
          >
            {t("legal.withdrawHere")}
          </Button>
        ) : null}
      </div>
      {status === "success" ? (
        <p className="text-sm text-muted">
          <Link
            href={accountHref}
            className="text-accent hover:text-accent-light"
          >
            {t("checkout.trackShipping")}
          </Link>
        </p>
      ) : null}

      {receiptPreview ? (
        <DocumentPreviewModal
          title={receiptPreview.title}
          url={receiptPreview.url}
          subtitle={receiptPreview.subtitle}
          onClose={() => {
            if (receiptPreview.url.startsWith("blob:")) {
              URL.revokeObjectURL(receiptPreview.url);
            }
            setReceiptPreview(null);
          }}
        />
      ) : null}
    </main>
  );
}
