"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import type { OrderRow, ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";
import { formatPrice } from "@/lib/format/price";
import { usePreferences } from "@/components/providers/preferences-provider";

export function AdminOrdersPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [carrierByOrder, setCarrierByOrder] = useState<
    Record<string, ShippingCarrier>
  >({});
  const [relayByOrder, setRelayByOrder] = useState<Record<string, string>>({});

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const response = await adminFetch("/api/admin/orders");
    const json = (await response.json()) as { orders?: OrderRow[] };
    setOrders(json.orders ?? []);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const createLabel = async (order: OrderRow, carrierForce?: ShippingCarrier) => {
    const carrier = carrierForce ?? carrierByOrder[order.id] ?? "laposte";
    setPendingId(order.id);
    setMessage(null);

    const response = await adminFetch("/api/admin/shipping/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        carrier,
        relayPointId: relayByOrder[order.id] || order.relay_point_id || undefined,
      }),
    });

    const json = (await response.json()) as {
      error?: string;
      trackingNumber?: string;
      labelUrl?: string;
    };

    setPendingId(null);

    if (!response.ok) {
      setMessage(json.error ?? t("admin.labelError"));
      return;
    }

    setMessage(
      t("admin.labelSuccess", {
        tracking: json.trackingNumber ?? "—",
      }),
    );
    await loadOrders();
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 md:px-6">
      <header className="space-y-2">
        <h1 className="font-serif text-4xl text-primary">{t("admin.ordersTitle")}</h1>
        <p className="max-w-2xl text-muted">{t("admin.ordersSubtitle")}</p>
      </header>

      {message ? (
        <p className="rounded-xl bg-background-alt px-4 py-3 text-sm text-primary" role="status">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-muted">{t("admin.loading")}</p>
      ) : orders.length === 0 ? (
        <p className="text-muted">{t("admin.empty")}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const carrier =
              carrierByOrder[order.id] ?? order.shipping_carrier ?? "laposte";
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
                    <p className="text-sm text-muted">{order.email}</p>
                    <p className="text-sm text-muted">
                      {t(`account.status.shipping.${order.shipping_status}`)}
                    </p>
                    {order.tracking_number ? (
                      <p className="mt-2 text-sm text-primary">
                        {t("admin.tracking")}: {order.tracking_number}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <label className="block space-y-1 text-sm">
                      <span className="text-muted">{t("admin.carrier")}</span>
                      <select
                        className="w-full rounded-xl border border-border bg-background px-3 py-2"
                        value={carrier}
                        onChange={(e) =>
                          setCarrierByOrder((prev) => ({
                            ...prev,
                            [order.id]: e.target.value as ShippingCarrier,
                          }))
                        }
                      >
                        <option value="laposte">{t("admin.carriers.laposte")}</option>
                        <option value="mondial_relay">
                          {t("admin.carriers.mondial_relay")}
                        </option>
                      </select>
                    </label>

                    {carrier === "mondial_relay" ? (
                      <label className="block space-y-1 text-sm">
                        <span className="text-muted">{t("admin.relayPoint")}</span>
                        <input
                          className="w-full rounded-xl border border-border bg-background px-3 py-2"
                          value={
                            relayByOrder[order.id] ?? order.relay_point_id ?? ""
                          }
                          onChange={(e) =>
                            setRelayByOrder((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          placeholder="Ex: 012345"
                        />
                      </label>
                    ) : null}

                    <Button
                      type="button"
                      onClick={() =>
                        void createLabel(
                          order,
                          carrier === "laposte" ? "laposte" : carrier,
                        )
                      }
                      disabled={pendingId === order.id}
                    >
                      {pendingId === order.id
                        ? t("admin.generating")
                        : carrier === "laposte"
                          ? t("admin.generateLaPosteLabel")
                          : t("admin.generateLabel")}
                    </Button>

                    {order.label_url ? (
                      <a
                        href={order.label_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-accent hover:text-accent-light"
                      >
                        {t("admin.openLabel")}
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
