"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal";
import { ShippingTimeline } from "@/features/account/components/shipping-timeline";
import { useAuth } from "@/features/auth/context/auth-provider";
import { usePreferences } from "@/components/providers/preferences-provider";
import { formatPrice } from "@/lib/format/price";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { OrderRow, ShippingStatus } from "@/lib/infrastructure/supabase/order-types";

type TrackingPayload = {
  shippingStatus?: ShippingStatus;
  statusLabel?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  labelUrl?: string | null;
  events?: Array<{ date: string; label: string; location?: string }>;
  error?: string;
};

type AccountOrdersSectionProps = {
  orders: OrderRow[];
  ordersLoading: boolean;
  onOrdersChange: (orders: OrderRow[]) => void;
};

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
    const el = document.getElementById(`order-${focusOrderId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusOrderId, ordersLoading, orders]);

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
    <section id="commandes" className="space-y-6">
      <h2 className="font-serif text-3xl text-primary">{t("account.ordersTitle")}</h2>

      {ordersLoading ? (
        <p className="text-muted">{t("account.ordersLoading")}</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-background-alt p-8 text-center">
          <p className="text-muted">{t("account.noOrders")}</p>
          <Button href="/boutique" className="mt-4">
            {t("cart.continueShopping")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const tracking = trackingByOrder[order.id];
            const address = order.shipping_address;
            return (
              <article
                id={`order-${order.id}`}
                key={order.id}
                className={`space-y-4 rounded-2xl border p-5 ${
                  focusOrderId === order.id
                    ? "border-accent bg-accent/5"
                    : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">
                      {t("account.orderId", { id: order.id.slice(0, 8) })}
                    </p>
                    <p className="font-serif text-2xl text-primary">
                      {formatPrice(
                        order.total,
                        order.currency || currency,
                        i18n.language,
                      )}
                    </p>
                    <p className="text-sm text-muted">
                      {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                        dateStyle: "medium",
                      }).format(new Date(order.created_at))}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted">{t("account.paymentStatus")} : </span>
                      {t(`account.status.payment.${order.status}`)}
                    </p>
                    <p>
                      <span className="text-muted">{t("account.shippingStatus")} : </span>
                      {t(`account.status.shipping.${order.shipping_status}`)}
                    </p>
                    <p>
                      <span className="text-muted">{t("account.paymentMethod")} : </span>
                      {t(`checkout.methods.${order.payment_method}.label`)}
                    </p>
                    {order.shipping_carrier ? (
                      <p>
                        <span className="text-muted">{t("account.carrier")} : </span>
                        {t(`admin.carriers.${order.shipping_carrier}`)}
                      </p>
                    ) : null}
                    {order.payment_status === "paid" ||
                    order.status === "paid" ? (
                      <Button
                        type="button"
                        variant="primary-outline"
                        size="md"
                        pending={receiptLoadingId === order.id}
                        onClick={() => void openReceipt(order)}
                      >
                        {t("account.previewReceipt")}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl bg-background-alt p-4">
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
                      <span className="text-primary">{order.tracking_number}</span>
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

                {address ? (
                  <div className="rounded-xl border border-border p-4 text-sm">
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

                <ul className="space-y-2 border-t border-border pt-4 text-sm text-muted">
                  {order.items.map((item) => (
                    <li
                      key={`${order.id}-${item.slug}`}
                      className="flex justify-between gap-3"
                    >
                      <Link
                        href={`/boutique/${item.slug}`}
                        className="hover:text-accent"
                      >
                        {item.name} × {item.quantity}
                      </Link>
                      <span>
                        {formatPrice(
                          item.unit_price * item.quantity,
                          order.currency || currency,
                          i18n.language,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
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
    </section>
  );
}
