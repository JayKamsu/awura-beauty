"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

  useEffect(() => {
    void adminFetch("/api/admin/customers")
      .then((res) => res.json())
      .then((json: { customers?: AdminCustomer[] }) => {
        setCustomers(json.customers ?? []);
        setLoading(false);
      });
  }, [adminFetch]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-6">
      <header className="space-y-2">
        <h1 className="font-serif text-4xl text-primary">{t("admin.customersTitle")}</h1>
        <p className="text-muted">{t("admin.customersSubtitle")}</p>
      </header>

      {loading ? (
        <p className="text-muted">{t("admin.loading")}</p>
      ) : customers.length === 0 ? (
        <p className="text-muted">{t("admin.noCustomers")}</p>
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
              {customers.map((customer) => (
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
