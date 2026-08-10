"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal";
import {
  AccountSection,
  accountPanelClass,
} from "@/features/account/components/account-section";
import { OrderReceiptAndReview } from "@/features/account/components/order-receipt-and-review";
import { ShippingTimeline } from "@/features/account/components/shipping-timeline";
import { useAuth } from "@/features/auth/context/auth-provider";
import { usePreferences } from "@/components/providers/preferences-provider";
import {
  isOrderPaid,
  resolvePaymentStatus,
} from "@/lib/application/checkout/payment-status";
import { formatPrice } from "@/lib/format/price";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { OrderRow, ShippingStatus } from "@/lib/infrastructure/supabase/order-types";

const PAGE_SIZE = 8;

function paymentTone(status: string): string {
  if (status === "paid") return "bg-primary/10 text-primary";
  if (status === "pending") return "bg-accent/15 text-accent";
  return "bg-background-alt text-muted";
}

type TrackingPayload = {
  shippingStatus?: ShippingStatus;
  statusLabel?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  labelUrl?: string | null;
  events?: Array<{ date: string; label: string; location?: string }>;
  error?: string;
};

/** Props de la section commandes : liste des commandes du client et callback de mise à jour. */
type AccountOrdersSectionProps = {
  orders: OrderRow[];
  ordersLoading: boolean;
  onOrdersChange: (orders: OrderRow[]) => void;
};

/** Section Mon compte listant les commandes du client avec suivi de livraison, reçu et avis. */
export function AccountOrdersSection({
  orders,
  ordersLoading,
  onOrdersChange,
}: AccountOrdersSectionProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const { currency } = usePreferences();
  const searchParams = useSearchParams();
  const focusOrderId = searchParams.get("order");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [trackingByOrder, setTrackingByOrder] = useState<
    Record<string, TrackingPayload>
  >({});
  const [trackingLoadingId, setTrackingLoadingId] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<{
    title: string;
    url: string;
    subtitle?: string;
  } | null>(null);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusOrderId || ordersLoading) return;
    setExpandedId(focusOrderId);
    const el = document.getElementById(`order-${focusOrderId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusOrderId, ordersLoading, orders]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [orders.length]);

  const visibleOrders = useMemo(
    () => orders.slice(0, visibleCount),
    [orders, visibleCount],
  );
  const hasMore = visibleCount < orders.length;

  const openReceipt = async (order: OrderRow) => {
    if (!session?.access_token) return;
    setReceiptLoadingId(order.id);
    const response = await fetch(
      `/api/account/orders/receipt?orderId=${encodeURIComponent(order.id)}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );
    setReceiptLoadingId(null);
    if (!response.ok) return;
    const html = await response.text();
    const blobUrl = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
    );
    setReceiptPreview({
      title: t("account.receiptPreviewTitle"),
      url: blobUrl,
      subtitle: t("account.orderId", { id: order.id.slice(0, 8) }),
    });
  };

  const refreshTracking = async (orderId: string) => {
    setTrackingLoadingId(orderId);
    const headers = new Headers();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
    const response = await fetch(
      `/api/account/shipping/track?orderId=${encodeURIComponent(orderId)}`,
      { headers },
    );
    const json = (await response.json()) as TrackingPayload;
    setTrackingByOrder((prev) => ({ ...prev, [orderId]: json }));
    setTrackingLoadingId(null);

    if (json.shippingStatus) {
      onOrdersChange(
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                shipping_status: json.shippingStatus as ShippingStatus,
                tracking_number: json.trackingNumber ?? order.tracking_number,
                shipping_carrier:
                  (json.carrier as OrderRow["shipping_carrier"]) ??
                  order.shipping_carrier,
              }
            : order,
        ),
      );
    }
  };

  return (
    <AccountSection id="commandes" title={t("account.ordersTitle")}>
      {ordersLoading ? (
        <p className="text-muted">{t("account.ordersLoading")}</p>
      ) : orders.length === 0 ? (
        <div className={`${accountPanelClass} p-8 text-center`}>
          <p className="text-muted">{t("account.noOrders")}</p>
          <Button href="/boutique" className="mt-4">
            {t("cart.continueShopping")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {t("account.ordersCount", { count: orders.length })}
          </p>
          {visibleOrders.map((order) => {
            const tracking = trackingByOrder[order.id];
            const address = order.shipping_address;
            const paymentStatus = resolvePaymentStatus(order);
            const paid = isOrderPaid(order);
            const expanded =
              expandedId === order.id || focusOrderId === order.id;
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );

            return (
              <article
                id={`order-${order.id}`}
                key={order.id}
                className={`overflow-hidden rounded-2xl ring-1 ${
                  focusOrderId === order.id
                    ? "bg-accent/10 ring-accent"
                    : "bg-background/70 ring-border/50"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedId((prev) =>
                      prev === order.id ? null : order.id,
                    )
                  }
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted sm:text-sm">
                      {t("account.orderId", { id: order.id.slice(0, 8) })}
                      {" · "}
                      {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                        dateStyle: "medium",
                      }).format(new Date(order.created_at))}
                    </p>
                    <p className="font-serif text-xl text-primary sm:text-2xl">
                      {formatPrice(
                        order.total,
                        order.currency || currency,
                        i18n.language,
                      )}
                    </p>
                    <p className="text-sm text-muted">
                      {t("account.ordersItemsCount", { count: itemCount })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${paymentTone(paymentStatus)}`}
                    >
                      {t(`account.status.payment.${paymentStatus}`)}
                    </span>
                    <span className="text-xs text-muted">
                      {t(`account.status.shipping.${order.shipping_status}`)}
                    </span>
                    <span
                      className="text-accent"
                      aria-hidden
                    >
                      {expanded ? "−" : "+"}
                    </span>
                  </div>
                </button>

                {expanded ? (
                  <div className="space-y-4 border-t border-border/70 px-4 pb-5 pt-4 sm:px-5">
                    <div className="space-y-1 text-sm text-muted">
                      <p>
                        <span className="text-muted">
                          {t("account.paymentMethod")} :{" "}
                        </span>
                        {t(`checkout.methods.${order.payment_method}.label`)}
                      </p>
                      {order.shipping_carrier ? (
                        <p>
                          <span className="text-muted">
                            {t("account.carrier")} :{" "}
                          </span>
                          {t(`admin.carriers.${order.shipping_carrier}`)}
                        </p>
                      ) : null}
                      {paid ? (
                        <Button
                          type="button"
                          variant="primary-outline"
                          size="md"
                          className="mt-2"
                          pending={receiptLoadingId === order.id}
                          onClick={() => void openReceipt(order)}
                        >
                          {t("account.previewReceipt")}
                        </Button>
                      ) : null}
                    </div>

                    <div className="rounded-xl bg-background-alt/80 p-4">
                      <p className="mb-3 font-medium text-primary">
                        {t("account.shippingTimeline")}
                      </p>
                      <ShippingTimeline
                        status={order.shipping_status}
                        carrier={order.shipping_carrier}
                      />
                      {order.tracking_number ? (
                        <p className="mt-4 text-sm text-muted">
                          {t("account.trackingNumber")} :{" "}
                          <span className="text-primary">
                            {order.tracking_number}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-4 text-sm text-muted">
                          {t("account.trackingPending")}
                        </p>
                      )}
                      {order.shipping_carrier &&
                      order.shipping_carrier !== "pickup" ? (
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            disabled={trackingLoadingId === order.id}
                            onClick={() => void refreshTracking(order.id)}
                          >
                            {trackingLoadingId === order.id
                              ? t("account.trackingLoading")
                              : t("account.refreshTracking")}
                          </Button>
                          {order.tracking_number ? (
                            <a
                              href={
                                order.shipping_carrier === "mondial_relay"
                                  ? `https://www.mondialrelay.fr/suivi-de-colis/?codeParcel=${encodeURIComponent(order.tracking_number)}`
                                  : `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(order.tracking_number)}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-sm text-accent hover:text-accent-light"
                            >
                              {t("account.openTracking")}
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                      {tracking?.events && tracking.events.length > 0 ? (
                        <ul className="mt-4 space-y-2 border-t border-border pt-3 text-sm text-muted">
                          {tracking.events.slice(0, 5).map((event, index) => (
                            <li key={`${order.id}-event-${index}`}>
                              {event.label}
                              {event.location ? ` — ${event.location}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <OrderReceiptAndReview
                      order={order}
                      onOrderUpdate={(updated) =>
                        onOrdersChange(
                          orders.map((o) => (o.id === updated.id ? updated : o)),
                        )
                      }
                    />

                    {address ? (
                      <div className={`${accountPanelClass} text-sm`}>
                        <p className="mb-1 font-medium text-primary">
                          {t("account.shippingAddress")}
                        </p>
                        <p className="text-muted">
                          {address.fullName}
                          <br />
                          {address.line1}
                          <br />
                          {address.postalCode} {address.city}
                          <br />
                          {address.country}
                          {address.phone ? (
                            <>
                              <br />
                              {address.phone}
                            </>
                          ) : null}
                        </p>
                      </div>
                    ) : null}

                    <ul className="space-y-2 border-t border-border/70 pt-4 text-sm text-muted">
                      {order.items.map((item) => (
                        <li
                          key={`${order.id}-${item.slug}`}
                          className="flex justify-between gap-3"
                        >
                          <Link
                            href={`/boutique/${item.slug}`}
                            className="min-w-0 break-words hover:text-accent"
                          >
                            {item.name} × {item.quantity}
                          </Link>
                          <span className="shrink-0">
                            {formatPrice(
                              item.unit_price * item.quantity,
                              order.currency || currency,
                              i18n.language,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}

          {hasMore ? (
            <Button
              type="button"
              variant="primary-outline"
              className="w-full sm:w-auto"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              {t("account.ordersShowMore", {
                remaining: orders.length - visibleCount,
              })}
            </Button>
          ) : null}
        </div>
      )}

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
    </AccountSection>
  );
}
