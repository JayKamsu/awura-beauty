"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { DocumentPreviewModal } from "@/components/ui/document-preview-modal";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import type {
  OrderRow,
  ShippingCarrier,
  ShippingStatus,
} from "@/lib/infrastructure/supabase/order-types";
import { formatPrice } from "@/lib/format/price";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useLiveRefresh } from "@/lib/hooks/use-live-refresh";

const STATUS_FILTERS = [
  "all",
  "preparing",
  "shipped",
  "in_transit",
  "delivered",
] as const;

const PAGE_SIZE = 40;

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

/** Panneau admin des commandes : suivi logistique, changement de transporteur, étiquettes et reçus. */
export function AdminOrdersPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const searchParams = useSearchParams();
  const focusOrderId = searchParams.get("order");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [draftCarrierByOrder, setDraftCarrierByOrder] = useState<
    Record<string, ShippingCarrier>
  >({});
  const [draftRelayByOrder, setDraftRelayByOrder] = useState<
    Record<string, string>
  >({});
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("all");
  const [preview, setPreview] = useState<{
    title: string;
    url: string;
    subtitle?: string | null;
  } | null>(null);

  const [includeAbandoned, setIncludeAbandoned] = useState(false);

  const loadOrders = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const response = await adminFetch(
      `/api/admin/orders${includeAbandoned ? "?includeAbandoned=1" : ""}`,
    );
    const json = (await response.json()) as { orders?: OrderRow[] };
    setOrders(json.orders ?? []);
    setLoading(false);
  }, [adminFetch, includeAbandoned]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useLiveRefresh(() => loadOrders({ silent: true }), { intervalMs: 15_000 });

  useEffect(() => {
    if (!focusOrderId || loading) return;
    setExpandedId(focusOrderId);
    const el = document.getElementById(`order-${focusOrderId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusOrderId, loading, orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.shipping_status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q) ||
        (order.tracking_number ?? "").toLowerCase().includes(q) ||
        (order.shipping_address?.fullName ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [query, statusFilter]);

  const updateShippingStatus = async (
    order: OrderRow,
    shippingStatus: ShippingStatus,
  ) => {
    setPendingId(order.id);
    setFeedback(null);
    const response = await adminFetch("/api/admin/shipping/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, shippingStatus }),
    });
    const json = (await response.json()) as {
      error?: string;
      order?: OrderRow;
    };
    setPendingId(null);
    if (!response.ok || !json.order) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.saveError"),
      });
      return;
    }
    setOrders((prev) =>
      prev.map((row) => (row.id === order.id ? json.order! : row)),
    );
    setFeedback({ tone: "success", message: t("admin.statusUpdated") });
  };

  const applyCarrierChange = async (order: OrderRow) => {
    const shippingCarrier =
      draftCarrierByOrder[order.id] ?? order.shipping_carrier ?? "laposte";
    const relayPointId =
      shippingCarrier === "mondial_relay"
        ? (draftRelayByOrder[order.id] ?? order.relay_point_id ?? "").trim()
        : null;
    if (shippingCarrier === "mondial_relay" && !relayPointId) {
      setFeedback({ tone: "error", message: t("admin.relayRequired") });
      return;
    }
    setPendingId(order.id);
    setFeedback(null);
    const response = await adminFetch("/api/admin/shipping/carrier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        shippingCarrier,
        relayPointId,
      }),
    });
    const json = (await response.json()) as {
      error?: string;
      order?: OrderRow;
      unchanged?: boolean;
    };
    setPendingId(null);
    if (!response.ok || !json.order) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.saveError"),
      });
      return;
    }
    setOrders((prev) =>
      prev.map((row) => (row.id === order.id ? json.order! : row)),
    );
    setFeedback({
      tone: "success",
      message: json.unchanged
        ? t("admin.carrierUnchanged")
        : t("admin.carrierChangedNotified"),
    });
  };

  const createLabel = async (order: OrderRow) => {
    const carrier = order.shipping_carrier ?? "laposte";
    if (carrier === "pickup") return;
    setPendingId(order.id);
    setFeedback(null);
    const response = await adminFetch("/api/admin/shipping/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        carrier,
        relayPointId: order.relay_point_id || undefined,
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

  const openReceipt = async (order: OrderRow) => {
    const response = await adminFetch(
      `/api/admin/orders/receipt?orderId=${encodeURIComponent(order.id)}`,
    );
    if (!response.ok) {
      setFeedback({ tone: "error", message: t("admin.receiptError") });
      return;
    }
    const html = await response.text();
    const blobUrl = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
    );
    setPreview({
      title: t("admin.receiptPreviewTitle"),
      url: blobUrl,
      subtitle: `#${order.id.slice(0, 8)} · ${order.email}`,
    });
  };

  const closePreview = () => {
    if (preview?.url.startsWith("blob:")) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  };

  const syncTracking = async () => {
    setSyncing(true);
    setFeedback(null);
    const response = await adminFetch("/api/shipping/sync", { method: "POST" });
    const json = (await response.json()) as {
      error?: string;
      updated?: number;
      checked?: number;
    };
    setSyncing(false);
    if (!response.ok) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.syncTrackingError"),
      });
      return;
    }
    setFeedback({
      tone: "success",
      message: t("admin.syncTrackingSuccess", {
        updated: json.updated ?? 0,
        checked: json.checked ?? 0,
      }),
    });
    await loadOrders();
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-8 md:px-6">
      <AdminPageHeader
        title={t("admin.ordersTitle")}
        subtitle={t("admin.ordersSubtitle")}
      />

      {feedback ? (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminSearchField value={query} onChange={setQuery} />
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={includeAbandoned}
              onChange={(e) => setIncludeAbandoned(e.target.checked)}
            />
            {t("admin.showAbandonedOrders")}
          </label>
          <Button
            type="button"
            variant="primary-outline"
            size="md"
            pending={syncing}
            onClick={() => void syncTracking()}
          >
            {syncing ? t("admin.syncTrackingLoading") : t("admin.syncTracking")}
          </Button>
        </div>
      </div>

      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
        role="group"
        aria-label={t("admin.filterStatus")}
      >
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-xl px-3.5 text-sm transition ${
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
        <span className="ml-auto self-center text-xs text-muted">
          {t("admin.ordersCountLabel", { count: filtered.length })}
        </span>
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
        <>
          <div className="md:overflow-x-auto md:rounded-2xl md:border md:border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="hidden bg-background-alt text-xs uppercase tracking-wide text-muted md:table-header-group">
                <tr>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.colOrder")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.colClient")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.colTotal")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.colPayment")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.colShipping")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.colCarrier")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.colDate")}
                  </th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="block space-y-3 md:table-row-group md:space-y-0">
                {pageRows.map((order) => {
                  const open = expandedId === order.id;
                  const savedCarrier = order.shipping_carrier;
                  const draftCarrier =
                    draftCarrierByOrder[order.id] ?? savedCarrier ?? "laposte";
                  const draftRelay =
                    draftRelayByOrder[order.id] ?? order.relay_point_id ?? "";
                  const carrierDirty =
                    draftCarrier !== (savedCarrier ?? "laposte") ||
                    (draftCarrier === "mondial_relay" &&
                      draftRelay.trim() !== (order.relay_point_id ?? ""));
                  const paid =
                    order.payment_status === "paid" || order.status === "paid";

                  return (
                    <Fragment key={order.id}>
                      <tr
                        id={`order-${order.id}`}
                        className={`block rounded-2xl border border-border md:table-row md:rounded-none md:border-0 md:border-t ${
                          focusOrderId === order.id || open
                            ? "bg-accent/5"
                            : "bg-background hover:bg-background-alt/60 md:bg-transparent"
                        }`}
                      >
                        <td
                          data-label={t("admin.colOrder")}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 font-medium text-primary before:text-xs before:uppercase before:tracking-wide before:text-muted before:content-[attr(data-label)] md:table-cell md:whitespace-nowrap md:before:content-none"
                        >
                          #{order.id.slice(0, 8)}
                        </td>
                        <td
                          data-label={t("admin.colClient")}
                          className="flex items-start justify-between gap-3 px-3 py-2 text-muted before:shrink-0 before:text-xs before:uppercase before:tracking-wide before:text-muted before:content-[attr(data-label)] md:table-cell md:max-w-[14rem] md:truncate md:before:content-none"
                        >
                          <span className="min-w-0 break-words text-right md:text-left">
                            {order.shipping_address?.fullName
                              ? `${order.shipping_address.fullName} · ${order.email}`
                              : order.email}
                          </span>
                        </td>
                        <td
                          data-label={t("admin.colTotal")}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-primary before:text-xs before:uppercase before:tracking-wide before:text-muted before:content-[attr(data-label)] md:table-cell md:whitespace-nowrap md:before:content-none"
                        >
                          {formatPrice(
                            order.total,
                            order.currency || currency,
                            i18n.language,
                          )}
                        </td>
                        <td
                          data-label={t("admin.colPayment")}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-muted before:text-xs before:uppercase before:tracking-wide before:text-muted before:content-[attr(data-label)] md:table-cell md:before:content-none"
                        >
                          <span className="text-right md:text-left">
                            <span className="block whitespace-nowrap">
                              {t(
                                `checkout.methods.${order.payment_method}.label`,
                              )}
                            </span>
                            <span className="text-xs">
                              {t(`account.status.payment.${order.status}`)}
                            </span>
                          </span>
                        </td>
                        <td
                          data-label={t("admin.colShipping")}
                          className="flex items-center justify-between gap-3 px-3 py-2 before:text-xs before:uppercase before:tracking-wide before:text-muted before:content-[attr(data-label)] md:table-cell md:before:content-none"
                        >
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${shippingBadgeClass(order.shipping_status)}`}
                          >
                            {t(
                              `account.status.shipping.${order.shipping_status}`,
                            )}
                          </span>
                        </td>
                        <td
                          data-label={t("admin.colCarrier")}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-muted before:text-xs before:uppercase before:tracking-wide before:text-muted before:content-[attr(data-label)] md:table-cell md:whitespace-nowrap md:before:content-none"
                        >
                          {savedCarrier
                            ? t(`admin.carriers.${savedCarrier}`)
                            : "—"}
                        </td>
                        <td
                          data-label={t("admin.colDate")}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-muted before:text-xs before:uppercase before:tracking-wide before:text-muted before:content-[attr(data-label)] md:table-cell md:whitespace-nowrap md:before:content-none"
                        >
                          {new Intl.DateTimeFormat(
                            toIntlLocale(i18n.language),
                            { dateStyle: "short" },
                          ).format(new Date(order.created_at))}
                        </td>
                        <td className="block border-t border-border px-3 py-3 text-center md:table-cell md:border-0 md:py-2 md:text-right">
                          <button
                            type="button"
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm text-accent hover:border-accent md:inline md:min-h-0 md:w-auto md:border-0 md:text-accent"
                            onClick={() =>
                              setExpandedId(open ? null : order.id)
                            }
                          >
                            {open ? t("admin.collapse") : t("admin.details")}
                          </button>
                        </td>
                      </tr>

                      {open ? (
                        <tr className="mb-1 block rounded-2xl border border-border bg-background-alt/40 md:mb-0 md:table-row md:rounded-none md:border-0 md:border-t">
                          <td colSpan={8} className="block px-3 py-3 md:table-cell">
                            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                              <div className="space-y-2 text-sm text-muted">
                                {order.shipping_address ? (
                                  <p>
                                    <span className="font-medium text-primary">
                                      {order.shipping_address.fullName}
                                    </span>
                                    <br />
                                    {order.shipping_address.line1}
                                    <br />
                                    {order.shipping_address.postalCode}{" "}
                                    {order.shipping_address.city}
                                    {order.shipping_address.phone ? (
                                      <>
                                        <br />
                                        {order.shipping_address.phone}
                                      </>
                                    ) : null}
                                  </p>
                                ) : null}
                                <ul className="space-y-1">
                                  {order.items.map((item) => (
                                    <li
                                      key={`${order.id}-${item.slug}`}
                                      className="flex justify-between gap-3"
                                    >
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
                                {order.shipping_fee > 0 ? (
                                  <p>
                                    {t("admin.shippingFeeLine", {
                                      amount: formatPrice(
                                        order.shipping_fee,
                                        order.currency || currency,
                                        i18n.language,
                                      ),
                                    })}
                                  </p>
                                ) : null}
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex flex-wrap gap-2">
                                  {paid ? (
                                    <Button
                                      type="button"
                                      variant="primary-outline"
                                      size="md"
                                      onClick={() => void openReceipt(order)}
                                    >
                                      {t("admin.previewReceipt")}
                                    </Button>
                                  ) : null}
                                  {order.label_url ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="md"
                                      onClick={() =>
                                        setPreview({
                                          title: t("admin.labelPreviewTitle"),
                                          url: order.label_url!,
                                          subtitle: order.tracking_number,
                                        })
                                      }
                                    >
                                      {t("admin.previewLabel")}
                                    </Button>
                                  ) : null}
                                </div>

                                {order.tracking_number ? (
                                  <p className="text-muted">
                                    {t("admin.tracking")}:{" "}
                                    <span className="text-primary">
                                      {order.tracking_number}
                                    </span>
                                  </p>
                                ) : savedCarrier &&
                                  savedCarrier !== "pickup" ? (
                                  <p className="text-muted">
                                    {t("admin.labelPendingAuto")}
                                  </p>
                                ) : null}

                                {savedCarrier === "pickup" ? (
                                  <div className="flex flex-wrap gap-2">
                                    {order.shipping_status === "preparing" ? (
                                      <Button
                                        type="button"
                                        size="md"
                                        pending={pendingId === order.id}
                                        onClick={() =>
                                          void updateShippingStatus(
                                            order,
                                            "shipped",
                                          )
                                        }
                                      >
                                        {t("admin.markPickupReady")}
                                      </Button>
                                    ) : null}
                                    {order.shipping_status === "shipped" ||
                                    order.shipping_status === "in_transit" ? (
                                      <Button
                                        type="button"
                                        size="md"
                                        pending={pendingId === order.id}
                                        onClick={() =>
                                          void updateShippingStatus(
                                            order,
                                            "delivered",
                                          )
                                        }
                                      >
                                        {t("admin.markPickupDone")}
                                      </Button>
                                    ) : null}
                                  </div>
                                ) : null}

                                <details className="rounded-xl border border-border bg-background px-3 py-2">
                                  <summary className="cursor-pointer text-muted">
                                    {t("admin.advancedShipping")}
                                  </summary>
                                  <div className="mt-3 space-y-2">
                                    <select
                                      className="w-full rounded-xl border border-border bg-background px-3 py-2"
                                      value={draftCarrier}
                                      onChange={(e) =>
                                        setDraftCarrierByOrder((prev) => ({
                                          ...prev,
                                          [order.id]: e.target
                                            .value as ShippingCarrier,
                                        }))
                                      }
                                    >
                                      <option value="laposte">
                                        {t("admin.carriers.laposte")}
                                      </option>
                                      <option value="mondial_relay">
                                        {t("admin.carriers.mondial_relay")}
                                      </option>
                                      <option value="pickup">
                                        {t("admin.carriers.pickup")}
                                      </option>
                                    </select>
                                    {draftCarrier === "mondial_relay" ? (
                                      <input
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2"
                                        value={draftRelay}
                                        onChange={(e) =>
                                          setDraftRelayByOrder((prev) => ({
                                            ...prev,
                                            [order.id]: e.target.value,
                                          }))
                                        }
                                        placeholder={t(
                                          "admin.relayPlaceholder",
                                        )}
                                      />
                                    ) : null}
                                    {carrierDirty ? (
                                      <Button
                                        type="button"
                                        variant="primary-outline"
                                        size="md"
                                        pending={pendingId === order.id}
                                        onClick={() =>
                                          void applyCarrierChange(order)
                                        }
                                      >
                                        {t("admin.applyCarrierNotify")}
                                      </Button>
                                    ) : null}
                                    {savedCarrier &&
                                    savedCarrier !== "pickup" ? (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="md"
                                        pending={pendingId === order.id}
                                        disabled={carrierDirty}
                                        onClick={() => void createLabel(order)}
                                      >
                                        {t("admin.generateLabelManual")}
                                      </Button>
                                    ) : null}
                                  </div>
                                </details>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <Button
                type="button"
                variant="ghost"
                size="md"
                disabled={pageSafe <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t("admin.prevPage")}
              </Button>
              <span className="text-muted">
                {t("admin.pageOf", {
                  page: pageSafe + 1,
                  pages: pageCount,
                })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="md"
                disabled={pageSafe >= pageCount - 1}
                onClick={() =>
                  setPage((p) => Math.min(pageCount - 1, p + 1))
                }
              >
                {t("admin.nextPage")}
              </Button>
            </div>
          ) : null}
        </>
      )}

      {preview ? (
        <DocumentPreviewModal
          title={preview.title}
          url={preview.url}
          subtitle={preview.subtitle}
          onClose={closePreview}
        />
      ) : null}
    </main>
  );
}
