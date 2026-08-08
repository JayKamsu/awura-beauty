"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
import type { AdminCustomer } from "@/lib/infrastructure/supabase/admin-dashboard";

const PAGE_SIZE = 50;

export function AdminCustomersPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [adjustDelta, setAdjustDelta] = useState("100");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustPending, setAdjustPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const load = async () => {
    const res = await adminFetch("/api/admin/customers");
    if (!res.ok) throw new Error("failed");
    const json = (await res.json()) as { customers?: AdminCustomer[] };
    setCustomers(json.customers ?? []);
  };

  useEffect(() => {
    void load()
      .then(() => {
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + adminFetch identity
  }, [adminFetch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) => {
      const haystack = [
        customer.email,
        customer.fullName ?? "",
        customer.phone ?? "",
        customer.city ?? "",
        customer.country ?? "",
        customer.referralCode ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [customers, query]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    pageSafe * PAGE_SIZE,
    pageSafe * PAGE_SIZE + PAGE_SIZE,
  );

  const adjustPoints = async (customer: AdminCustomer) => {
    if (!customer.userId) {
      setFeedback({
        tone: "error",
        message: t("admin.loyaltyNoUser"),
      });
      return;
    }
    const delta = Math.trunc(Number(adjustDelta));
    if (!Number.isFinite(delta) || delta === 0) {
      setFeedback({
        tone: "error",
        message: t("admin.loyaltyInvalidDelta"),
      });
      return;
    }
    setAdjustPending(true);
    setFeedback(null);
    const response = await adminFetch("/api/admin/loyalty/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: customer.userId,
        delta,
        note: adjustNote,
      }),
    });
    const json = (await response.json()) as {
      error?: string;
      balance?: number;
    };
    setAdjustPending(false);
    if (!response.ok) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.saveError"),
      });
      return;
    }
    setCustomers((prev) =>
      prev.map((row) =>
        row.email === customer.email
          ? { ...row, loyaltyPoints: json.balance ?? row.loyaltyPoints + delta }
          : row,
      ),
    );
    setFeedback({
      tone: "success",
      message: t("admin.loyaltyAdjusted", { balance: json.balance ?? "—" }),
    });
    setAdjustNote("");
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 md:px-6">
      <AdminPageHeader
        title={t("admin.customersTitle")}
        subtitle={t("admin.customersSubtitle")}
      />

      {error ? (
        <AdminFeedback tone="error" message={t("admin.saveError")} />
      ) : null}
      {feedback ? (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminSearchField value={query} onChange={setQuery} />
        <span className="text-xs text-muted">
          {t("admin.customersCountLabel", { count: filtered.length })}
        </span>
      </div>

      {loading ? (
        <p className="text-muted">{t("admin.loading")}</p>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          message={
            customers.length === 0
              ? t("admin.noCustomers")
              : t("admin.noSearchResults")
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-background-alt text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.colClient")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.customerPhone")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.loyaltyPoints")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.ordersCount")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.totalSpent")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.averageOrder")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("admin.lastOrder")}
                  </th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((customer) => {
                  const open = expandedEmail === customer.email;
                  return (
                    <Fragment key={customer.email}>
                      <tr
                        className={`border-t border-border ${
                          open
                            ? "bg-accent/5"
                            : "hover:bg-background-alt/60"
                        }`}
                      >
                        <td className="px-3 py-2">
                          <p className="font-medium text-primary">
                            {customer.fullName ?? customer.email}
                          </p>
                          {customer.fullName ? (
                            <p className="truncate text-xs text-muted">
                              {customer.email}
                            </p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted">
                          {customer.phone ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-primary">
                          {customer.loyaltyPoints}
                          {customer.referralCode ? (
                            <span className="ml-1 text-xs text-muted">
                              · {customer.referralCode}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-muted">
                          {customer.ordersCount}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-primary">
                          {formatPrice(
                            customer.totalSpent,
                            currency,
                            i18n.language,
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted">
                          {formatPrice(
                            customer.averageOrder,
                            currency,
                            i18n.language,
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted">
                          {new Intl.DateTimeFormat(
                            toIntlLocale(i18n.language),
                            { dateStyle: "short" },
                          ).format(new Date(customer.lastOrderAt))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            className="text-sm text-accent hover:text-accent-light"
                            onClick={() =>
                              setExpandedEmail(open ? null : customer.email)
                            }
                          >
                            {open ? t("admin.collapse") : t("admin.details")}
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="border-t border-border bg-background-alt/40">
                          <td colSpan={8} className="px-3 py-3">
                            <div className="grid gap-4 lg:grid-cols-3">
                              <div className="space-y-1 text-sm text-muted">
                                <p>
                                  <span className="text-primary">
                                    {t("admin.customerFirstOrder")}
                                  </span>
                                  :{" "}
                                  {new Intl.DateTimeFormat(
                                    toIntlLocale(i18n.language),
                                    { dateStyle: "medium" },
                                  ).format(new Date(customer.firstOrderAt))}
                                </p>
                                <p>
                                  <span className="text-primary">
                                    {t("admin.customerPreferredCarrier")}
                                  </span>
                                  :{" "}
                                  {customer.preferredCarrier
                                    ? t(
                                        `admin.carriers.${customer.preferredCarrier}`,
                                      )
                                    : "—"}
                                </p>
                                <p>
                                  <span className="text-primary">
                                    {t("admin.loyaltyPoints")}
                                  </span>
                                  : {customer.loyaltyPoints}
                                </p>
                                <p>
                                  <span className="text-primary">
                                    {t("admin.loyaltyReferralCode")}
                                  </span>
                                  : {customer.referralCode ?? "—"}
                                </p>
                                <p>
                                  <span className="text-primary">
                                    {t("admin.customerCity")}
                                  </span>
                                  :{" "}
                                  {[customer.city, customer.country]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                                </p>
                              </div>
                              <div>
                                <p className="mb-2 text-sm font-medium text-primary">
                                  {t("admin.customerRecentOrders")}
                                </p>
                                <ul className="space-y-1.5 text-sm text-muted">
                                  {customer.recentOrders.map((order) => (
                                    <li
                                      key={order.id}
                                      className="flex flex-wrap items-center justify-between gap-2"
                                    >
                                      <Link
                                        href={`/admin/commandes?order=${encodeURIComponent(order.id)}`}
                                        className="text-accent hover:text-accent-light"
                                      >
                                        #{order.id.slice(0, 8)}
                                      </Link>
                                      <span>
                                        {formatPrice(
                                          order.total,
                                          order.currency || currency,
                                          i18n.language,
                                        )}
                                      </span>
                                      <span>
                                        {t(
                                          `account.status.shipping.${order.shipping_status}`,
                                        )}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="space-y-2 rounded-xl border border-border bg-background p-3">
                                <p className="text-sm font-medium text-primary">
                                  {t("admin.loyaltyAdjustTitle")}
                                </p>
                                <input
                                  type="number"
                                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                                  value={adjustDelta}
                                  onChange={(e) =>
                                    setAdjustDelta(e.target.value)
                                  }
                                  placeholder={t(
                                    "admin.loyaltyAdjustDeltaPlaceholder",
                                  )}
                                />
                                <input
                                  type="text"
                                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                                  value={adjustNote}
                                  onChange={(e) =>
                                    setAdjustNote(e.target.value)
                                  }
                                  placeholder={t(
                                    "admin.loyaltyAdjustNotePlaceholder",
                                  )}
                                />
                                <Button
                                  type="button"
                                  size="md"
                                  pending={adjustPending}
                                  disabled={!customer.userId}
                                  onClick={() => void adjustPoints(customer)}
                                >
                                  {t("admin.loyaltyAdjustSubmit")}
                                </Button>
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
              <button
                type="button"
                className="text-accent disabled:text-muted"
                disabled={pageSafe <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t("admin.prevPage")}
              </button>
              <span className="text-muted">
                {t("admin.pageOf", {
                  page: pageSafe + 1,
                  pages: pageCount,
                })}
              </span>
              <button
                type="button"
                className="text-accent disabled:text-muted"
                disabled={pageSafe >= pageCount - 1}
                onClick={() =>
                  setPage((p) => Math.min(pageCount - 1, p + 1))
                }
              >
                {t("admin.nextPage")}
              </button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
