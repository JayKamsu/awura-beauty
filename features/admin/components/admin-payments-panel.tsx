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
import type {
  OrderRow,
  PaymentMethod,
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

  const load = useCallback(async () => {
    setLoading(true);
    const [statusRes, ordersRes] = await Promise.all([
      adminFetch("/api/admin/payments/status"),
      adminFetch("/api/admin/orders"),
    ]);
    const statusJson = (await statusRes.json()) as PaymentsStatus;
    const ordersJson = (await ordersRes.json()) as { orders?: OrderRow[] };
    if (statusRes.ok) setStatus(statusJson);
    setOrders(ordersJson.orders ?? []);
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (methodFilter !== "all" && order.payment_method !== methodFilter) {
        return false;
      }
      const payStatus =
        order.payment_status === "paid" || order.status === "paid"
          ? "paid"
          : order.status === "refunded" || order.payment_status === "refunded"
            ? "refunded"
            : order.status === "cancelled" ||
                order.payment_status === "cancelled"
              ? "cancelled"
              : "pending";
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

      {status ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-3 rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-xl text-primary">Stripe</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  status.stripe.ready
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/15 text-accent"
                }`}
              >
                {status.stripe.ready
                  ? t("admin.payments.ready")
                  : t("admin.payments.incomplete")}
              </span>
            </div>
            <ul className="space-y-1">
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
              className="inline-flex text-sm text-accent hover:text-accent-light"
            >
              {t("admin.payments.openStripeDashboard")}
            </a>
          </section>

          <section className="space-y-3 rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-xl text-primary">PayPal</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  status.paypal.ready
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/15 text-accent"
                }`}
              >
                {status.paypal.ready
                  ? t("admin.payments.ready")
                  : t("admin.payments.incomplete")}
              </span>
            </div>
            <ul className="space-y-1">
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
              className="inline-flex text-sm text-accent hover:text-accent-light"
            >
              {t("admin.payments.openPaypalDashboard")}
            </a>
          </section>
        </div>
      ) : null}

      <p className="text-sm text-muted">{t("admin.payments.refundHint")}</p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminSearchField value={query} onChange={setQuery} />
        <span className="text-xs text-muted">
          {t("admin.ordersCountLabel", { count: filtered.length })}
        </span>
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
                const paid =
                  order.payment_status === "paid" || order.status === "paid";
                const refunded =
                  order.status === "refunded" ||
                  order.payment_status === "refunded";
                const cancelled =
                  order.status === "cancelled" ||
                  order.payment_status === "cancelled";
                const badgeStatus = paid
                  ? "paid"
                  : refunded
                    ? "refunded"
                    : cancelled
                      ? "cancelled"
                      : "pending";

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
