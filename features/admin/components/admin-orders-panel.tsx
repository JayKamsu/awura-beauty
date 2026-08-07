"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import type {
  OrderRow,
  ShippingCarrier,
  ShippingStatus,
} from "@/lib/infrastructure/supabase/order-types";
import { formatPrice } from "@/lib/format/price";
import { usePreferences } from "@/components/providers/preferences-provider";

const STATUS_FILTERS = [
  "all",
  "preparing",
  "shipped",
  "in_transit",
  "delivered",
] as const;

function shippingBadgeClass(status: ShippingStatus): string {
  switch (status) {
    case "delivered":
      return "bg-primary/10 text-primary";
    case "in_transit":
    case "shipped":
      return "bg-accent/15 text-accent";
    default:
      return "bg-background-alt text-muted";
  }
}

export function AdminOrdersPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [carrierByOrder, setCarrierByOrder] = useState<
    Record<string, ShippingCarrier>
  >({});
  const [relayByOrder, setRelayByOrder] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("all");

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

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => order.shipping_status === statusFilter);
  }, [orders, statusFilter]);

  const createLabel = async (order: OrderRow, carrierForce?: ShippingCarrier) => {
    const carrier = carrierForce ?? carrierByOrder[order.id] ?? "laposte";
    setPendingId(order.id);
    setFeedback(null);

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
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.labelError"),
      });
      return;
    }

    setFeedback({
      tone: "success",
      message: t("admin.labelSuccess", {
        tracking: json.trackingNumber ?? "—",
      }),
    });
    await loadOrders();
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 md:px-6">
      <AdminPageHeader
        title={t("admin.ordersTitle")}
        subtitle={t("admin.ordersSubtitle")}
      />

      {feedback ? <AdminFeedback tone={feedback.tone} message={feedback.message} /> : null}

      <div className="flex flex-wrap gap-2" role="group" aria-label={t("admin.filterStatus")}>
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm transition ${
              statusFilter === status
                ? "bg-primary text-background"
                : "border border-border text-muted hover:border-accent"
            }`}
          >
            {status === "all"
              ? t("admin.filterAll")
              : t(`account.status.shipping.${status}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          message={
            orders.length === 0 ? t("admin.empty") : t("admin.noFilterResults")
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const carrier =
              carrierByOrder[order.id] ?? order.shipping_carrier ?? "laposte";
            const address = order.shipping_address;
            return (
              <article
                key={order.id}
                className="space-y-4 rounded-2xl border border-border p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
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
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${shippingBadgeClass(order.shipping_status)}`}
                    >
                      {t(`account.status.shipping.${order.shipping_status}`)}
                    </span>
                    {order.tracking_number ? (
                      <p className="text-sm text-primary">
                        {t("admin.tracking")}: {order.tracking_number}
                      </p>
                    ) : null}
                  </div>

                  <div className="w-full max-w-xs space-y-3 sm:w-auto">
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
                          placeholder={t("admin.relayPlaceholder")}
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

                {address ? (
                  <div className="rounded-xl bg-background-alt p-4 text-sm">
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
                    </p>
                  </div>
                ) : null}

                {order.items?.length ? (
                  <ul className="space-y-1 border-t border-border pt-3 text-sm text-muted">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.slug}`} className="flex justify-between gap-3">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
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
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
