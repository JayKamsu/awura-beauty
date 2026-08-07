"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { formatPrice } from "@/lib/format/price";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import { usePreferences } from "@/components/providers/preferences-provider";
import type { AdminCustomer } from "@/lib/infrastructure/supabase/admin-dashboard";

export function AdminCustomersPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void adminFetch("/api/admin/customers")
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        return res.json() as Promise<{ customers?: AdminCustomer[] }>;
      })
      .then((json) => {
        setCustomers(json.customers ?? []);
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [adminFetch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      customer.email.toLowerCase().includes(q),
    );
  }, [customers, query]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-6">
      <AdminPageHeader
        title={t("admin.customersTitle")}
        subtitle={t("admin.customersSubtitle")}
      />

      {error ? <AdminFeedback tone="error" message={t("admin.saveError")} /> : null}

      <AdminSearchField value={query} onChange={setQuery} />

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
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-background-alt text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.fields.email")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.ordersCount")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.totalSpent")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.lastOrder")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.email} className="border-t border-border">
                  <td className="px-4 py-3 text-primary">{customer.email}</td>
                  <td className="px-4 py-3 text-muted">{customer.ordersCount}</td>
                  <td className="px-4 py-3 text-primary">
                    {formatPrice(customer.totalSpent, currency, i18n.language)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                      dateStyle: "medium",
                    }).format(new Date(customer.lastOrderAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
