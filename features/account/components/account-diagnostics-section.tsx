"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { listMyDiagnostics } from "@/lib/infrastructure/supabase/diagnostics";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { DiagnosticRecord } from "@/lib/infrastructure/supabase/diagnostic-types";

export function AccountDiagnosticsSection() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<DiagnosticRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void listMyDiagnostics().then((data) => {
      if (!mounted) return;
      setItems(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="diagnostics" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-serif text-3xl text-primary">
          {t("account.diagnosticsTitle")}
        </h2>
        <Button href="/diagnostic-capillaire" variant="primary-outline" size="md">
          {t("account.diagnosticsNew")}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted">{t("account.diagnosticsLoading")}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-background-alt p-8 text-center">
          <p className="text-muted">{t("account.diagnosticsEmpty")}</p>
          <Button href="/diagnostic-capillaire" className="mt-4">
            {t("account.diagnosticsNew")}
          </Button>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="space-y-3 rounded-2xl border border-border p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-xl text-primary">
                    {t(item.profile.titleKey)}
                  </p>
                  <p className="text-sm text-muted">
                    {new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(item.created_at))}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted">{t(item.profile.summaryKey)}</p>
              {item.recommended_product_slugs.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary">
                    {t("account.diagnosticsRecommendations")}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {item.recommended_product_slugs.map((slug) => (
                      <li key={slug}>
                        <Link
                          href={`/boutique/${slug}`}
                          className="inline-flex rounded-full border border-border px-3 py-1 text-xs text-accent hover:border-accent"
                        >
                          {slug}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
