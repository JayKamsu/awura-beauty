"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { formatPrice } from "@/lib/format/price";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useLiveRefresh } from "@/lib/hooks/use-live-refresh";
import {
  paymentBadgeStatus,
  type OrderRow,
  type PaymentMethod,
} from "@/lib/infrastructure/supabase/order-types";

type PaymentsStatus = {
  livePaymentsEnabled: boolean;
  stripe: {
    ready: boolean;
    publishable: boolean;
    secret: boolean;
    webhook: boolean;
    dashboardUrl: string;
  };
  paypal: {
    ready: boolean;
    clientId: boolean;
    secret: boolean;
    liveApi: boolean;
    apiBase: string;
    dashboardUrl: string;
  };
};

const METHOD_FILTERS = ["all", "stripe", "paypal", "manual"] as const;
const STATUS_FILTERS = [
  "all",
  "pending",
  "paid",
  "refunded",
  "cancelled",
] as const;

function statusTone(status: string): string {
  if (status === "paid") return "bg-primary/10 text-primary";
  if (status === "pending") return "bg-accent/15 text-accent";
  if (status === "refunded" || status === "cancelled") {
    return "bg-background-alt text-muted";
  }
  return "bg-background-alt text-muted";
}

export function AdminPaymentsPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const [status, setStatus] = useState<PaymentsStatus | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] =
    useState<(typeof METHOD_FILTERS)[number]>("all");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [includeAbandoned, setIncludeAbandoned] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const [statusRes, ordersRes] = await Promise.all([
      adminFetch("/api/admin/payments/status"),
      adminFetch(
        `/api/admin/orders${includeAbandoned ? "?includeAbandoned=1" : ""}`,
      ),
    ]);
    const statusJson = (await statusRes.json()) as PaymentsStatus;
    const ordersJson = (await ordersRes.json()) as { orders?: OrderRow[] };
    if (statusRes.ok) setStatus(statusJson);
    setOrders(ordersJson.orders ?? []);
    setLoading(false);
  }, [adminFetch, includeAbandoned]);

  useEffect(() => {
    void load();
  }, [load]);

  useLiveRefresh(() => load({ silent: true }), { intervalMs: 15_000 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (methodFilter !== "all" && order.payment_method !== methodFilter) {
        return false;
      }
      const payStatus = paymentBadgeStatus(order);
      if (statusFilter !== "all" && payStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q)
      );
    });
  }, [orders, query, methodFilter, statusFilter]);

  const runAction = async (
    order: OrderRow,
    action: "mark_paid" | "mark_refunded" | "mark_cancelled",
  ) => {
    setPendingId(order.id);
    setFeedback(null);
    const response = await adminFetch("/api/admin/payments/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, action }),
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
    setFeedback({
      tone: "success",
      message: t(`admin.payments.actionSuccess.${action}`),
    });
  };

  const checkItem = (ok: boolean, label: string) => (
    <li className="flex items-center gap-2 text-sm">
      <span className={ok ? "text-primary" : "text-accent"}>{ok ? "✓" : "✗"}</span>
      <span className="text-muted">{label}</span>
    </li>
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-8 md:px-6">
      <AdminPageHeader
        title={t("admin.paymentsTitle")}
        subtitle={t("admin.paymentsSubtitle")}
      />

      {feedback ? (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      ) : null}

      <section className="space-y-3">
        <p className="text-sm text-muted">{t("admin.paymentsStatusHint")}</p>
        {status ? (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="space-y-3 rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-xl text-primary">Stripe</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    status.stripe.ready
                      ? "bg-primary/10 text-primary"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      status.stripe.ready ? "bg-primary" : "bg-accent"
                    }`}
                  />
                  {status.stripe.ready
                    ? t("admin.payments.ready")
                    : t("admin.payments.incomplete")}
                </span>
              </div>
              <ul className="space-y-1.5 rounded-xl bg-background-alt p-3">
                {checkItem(
                  status.stripe.publishable,
                  t("admin.payments.stripePublishable"),
                )}
                {checkItem(status.stripe.secret, t("admin.payments.stripeSecret"))}
                {checkItem(
                  status.stripe.webhook,
                  t("admin.payments.stripeWebhook"),
                )}
              </ul>
              <a
                href={status.stripe.dashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-light"
              >
                {t("admin.payments.openStripeDashboard")} →
              </a>
            </section>

            <section className="space-y-3 rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-xl text-primary">PayPal</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    status.paypal.ready
                      ? "bg-primary/10 text-primary"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      status.paypal.ready ? "bg-primary" : "bg-accent"
                    }`}
                  />
                  {status.paypal.ready
                    ? t("admin.payments.ready")
                    : t("admin.payments.incomplete")}
                </span>
              </div>
              <ul className="space-y-1.5 rounded-xl bg-background-alt p-3">
                {checkItem(
                  status.paypal.clientId,
                  t("admin.payments.paypalClient"),
                )}
                {checkItem(
                  status.paypal.secret,
                  t("admin.payments.paypalSecret"),
                )}
                {checkItem(
                  status.paypal.liveApi,
                  t("admin.payments.paypalLiveApi"),
                )}
              </ul>
              <a
                href={status.paypal.dashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-light"
              >
                {t("admin.payments.openPaypalDashboard")} →
              </a>
            </section>
          </div>
        ) : null}
      </section>

      <p className="rounded-xl bg-background-alt px-4 py-3 text-sm text-muted">
        {t("admin.payments.refundHint")}
      </p>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-primary">
          {t("admin.paymentsListTitle")}
        </h2>

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
            <span className="text-xs text-muted">
              {t("admin.ordersCountLabel", { count: filtered.length })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {METHOD_FILTERS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setMethodFilter(method)}
              className={`inline-flex min-h-8 items-center rounded-lg px-2.5 text-xs transition ${
                methodFilter === method
                  ? "bg-primary text-background"
                  : "border border-border text-muted hover:border-accent"
              }`}
            >
              {method === "all"
                ? t("admin.filterAll")
                : t(`checkout.methods.${method as PaymentMethod}.label`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              onClick={() => setStatusFilter(statusKey)}
              className={`inline-flex min-h-8 items-center rounded-lg px-2.5 text-xs transition ${
                statusFilter === statusKey
                  ? "bg-primary text-background"
                  : "border border-border text-muted hover:border-accent"
              }`}
            >
              {statusKey === "all"
                ? t("admin.filterAll")
                : t(`account.status.payment.${statusKey}`)}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p className="text-muted">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <AdminEmptyState message={t("admin.payments.empty")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-background-alt text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">{t("admin.colOrder")}</th>
                <th className="px-3 py-2 font-medium">{t("admin.colClient")}</th>
                <th className="px-3 py-2 font-medium">{t("admin.colPayment")}</th>
                <th className="px-3 py-2 font-medium">{t("admin.colTotal")}</th>
                <th className="px-3 py-2 font-medium">{t("admin.colDate")}</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((order) => {
                const badgeStatus = paymentBadgeStatus(order);
                const paid = badgeStatus === "paid";
                const refunded = badgeStatus === "refunded";
                const cancelled = badgeStatus === "cancelled";

                return (
                  <tr
                    key={order.id}
                    className="border-t border-border hover:bg-background-alt/60"
                  >
                    <td className="px-3 py-2 font-medium text-primary">
                      <Link
                        href={`/admin/commandes?order=${encodeURIComponent(order.id)}`}
                        className="text-accent hover:text-accent-light"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="max-w-[12rem] truncate px-3 py-2 text-muted">
                      {order.email}
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-muted">
                        {t(`checkout.methods.${order.payment_method}.label`)}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(badgeStatus)}`}
                      >
                        {t(`account.status.payment.${badgeStatus}`)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-primary">
                      {formatPrice(
                        order.total,
                        order.currency || currency,
                        i18n.language,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted">
                      {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(order.created_at))}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {!paid && !refunded ? (
                          <Button
                            type="button"
                            size="md"
                            variant="primary-outline"
                            pending={pendingId === order.id}
                            onClick={() => void runAction(order, "mark_paid")}
                          >
                            {t("admin.payments.markPaid")}
                          </Button>
                        ) : null}
                        {paid && !refunded ? (
                          <Button
                            type="button"
                            size="md"
                            variant="ghost"
                            pending={pendingId === order.id}
                            onClick={() =>
                              void runAction(order, "mark_refunded")
                            }
                          >
                            {t("admin.payments.markRefunded")}
                          </Button>
                        ) : null}
                        {!paid && !cancelled && !refunded ? (
                          <Button
                            type="button"
                            size="md"
                            variant="ghost"
                            pending={pendingId === order.id}
                            onClick={() =>
                              void runAction(order, "mark_cancelled")
                            }
                          >
                            {t("admin.payments.markCancelled")}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
