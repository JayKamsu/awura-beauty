"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-provider";
import { listMyOrders } from "@/lib/infrastructure/supabase/orders";
import type { OrderRow, ShippingStatus } from "@/lib/infrastructure/supabase/order-types";
import { usePreferences } from "@/components/providers/preferences-provider";
import { formatPrice } from "@/lib/format/price";
import { toIntlLocale } from "@/lib/i18n/intl-locale";

type TrackingPayload = {
  shippingStatus?: ShippingStatus;
  statusLabel?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  labelUrl?: string | null;
  events?: Array<{ date: string; label: string; location?: string }>;
  error?: string;
};

export function AccountPageContent() {
  const { t, i18n } = useTranslation();
  const { user, loading, logout, configured } = useAuth();
  const { currency } = usePreferences();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [trackingByOrder, setTrackingByOrder] = useState<
    Record<string, TrackingPayload>
  >({});
  const [trackingLoadingId, setTrackingLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    let mounted = true;
    setOrdersLoading(true);
    void listMyOrders().then((data) => {
      if (!mounted) return;
      setOrders(data);
      setOrdersLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [user]);

  const refreshTracking = async (orderId: string) => {
    setTrackingLoadingId(orderId);
    const response = await fetch(
      `/api/account/shipping/track?orderId=${encodeURIComponent(orderId)}`,
    );
    const json = (await response.json()) as TrackingPayload;
    setTrackingByOrder((prev) => ({ ...prev, [orderId]: json }));
    setTrackingLoadingId(null);

    if (json.shippingStatus) {
      setOrders((prev) =>
        prev.map((order) =>
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

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 px-4 py-20 md:px-6">
        <p className="text-muted">{t("account.loading")}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
        <h1 className="font-serif text-4xl text-primary">{t("account.title")}</h1>
        <p className="text-muted">{t("account.loginRequired")}</p>
        {!configured ? (
          <p className="text-sm text-muted">{t("auth.notConfigured")}</p>
        ) : null}
        <div className="flex flex-wrap justify-center gap-3">
          <Button href="/compte/connexion" size="lg">
            {t("auth.loginSubmit")}
          </Button>
          <Button href="/compte/inscription" variant="primary-outline" size="lg">
            {t("auth.signupSubmit")}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl text-primary">{t("account.title")}</h1>
          <p className="text-muted">{t("account.welcome", { email: user.email })}</p>
        </div>
        <Button type="button" variant="primary-outline" onClick={() => void logout()}>
          {t("account.logout")}
        </Button>
      </div>

      <section className="space-y-6">
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
              return (
                <article
                  key={order.id}
                  className="space-y-4 rounded-2xl border border-border p-5"
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
                      {order.tracking_number ? (
                        <p>
                          <span className="text-muted">{t("account.trackingNumber")} : </span>
                          {order.tracking_number}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="primary-outline"
                      size="md"
                      disabled={trackingLoadingId === order.id}
                      onClick={() => void refreshTracking(order.id)}
                    >
                      {trackingLoadingId === order.id
                        ? t("account.trackingLoading")
                        : t("account.refreshTracking")}
                    </Button>
                    {order.label_url || tracking?.labelUrl ? (
                      <a
                        href={order.label_url ?? tracking?.labelUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm text-accent hover:text-accent-light"
                      >
                        {t("account.openTracking")}
                      </a>
                    ) : null}
                  </div>

                  {tracking?.statusLabel ? (
                    <div className="rounded-xl bg-background-alt p-4 text-sm">
                      <p className="font-medium text-primary">{tracking.statusLabel}</p>
                      {tracking.events && tracking.events.length > 0 ? (
                        <ul className="mt-3 space-y-2 text-muted">
                          {tracking.events.slice(0, 5).map((event, index) => (
                            <li key={`${order.id}-event-${index}`}>
                              {event.label}
                              {event.location ? ` — ${event.location}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {tracking.error ? (
                        <p className="mt-2 text-accent">{tracking.error}</p>
                      ) : null}
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
      </section>
    </main>
  );
}
