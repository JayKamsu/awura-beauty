"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import type { ShippingCarrier } from "@/lib/infrastructure/supabase/order-types";

type RateForm = {
  carrier: ShippingCarrier;
  enabled: boolean;
  base_fee: string;
  free_shipping_min: string;
};

const CARRIERS: ShippingCarrier[] = ["laposte", "mondial_relay", "pickup"];

export function AdminShippingPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const { locked: pending, run } = useActionLock();
  const [rates, setRates] = useState<RateForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/shipping/rates");
    const json = (await res.json()) as {
      rates?: Array<{
        carrier: ShippingCarrier;
        enabled: boolean;
        base_fee: number;
        free_shipping_min: number | null;
      }>;
    };
    const byCarrier = new Map((json.rates ?? []).map((r) => [r.carrier, r]));
    setRates(
      CARRIERS.map((carrier) => {
        const row = byCarrier.get(carrier);
        return {
          carrier,
          enabled: row?.enabled ?? carrier === "pickup",
          base_fee: String(row?.base_fee ?? (carrier === "pickup" ? 0 : 0)),
          free_shipping_min:
            row?.free_shipping_min === null || row?.free_shipping_min === undefined
              ? ""
              : String(row.free_shipping_min),
        };
      }),
    );
    setLoading(false);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = () => {
    void run(async () => {
      setFeedback(null);
      const res = await adminFetch("/api/admin/shipping/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rates: rates.map((rate) => ({
            carrier: rate.carrier,
            enabled: rate.enabled,
            base_fee: Number(rate.base_fee) || 0,
            free_shipping_min:
              rate.free_shipping_min.trim() === ""
                ? null
                : Number(rate.free_shipping_min),
          })),
        }),
      });
      if (!res.ok) {
        setFeedback({ tone: "error", message: t("admin.saveError") });
        return;
      }
      setFeedback({ tone: "success", message: t("admin.saveSuccess") });
      await load();
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6">
      <AdminPageHeader
        title={t("admin.shippingTitle")}
        subtitle={t("admin.shippingSubtitle")}
      />

      <p className="text-sm text-muted">{t("admin.shippingHint")}</p>

      {feedback ? (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      ) : null}

      {loading ? (
        <p className="text-muted">{t("admin.loading")}</p>
      ) : (
        <div className="space-y-4">
          {rates.map((rate, index) => (
            <article
              key={rate.carrier}
              className="space-y-4 rounded-2xl border border-border p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-xl text-primary">
                  {t(`admin.carriers.${rate.carrier}`)}
                </h2>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={rate.enabled}
                    onChange={(e) =>
                      setRates((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? { ...row, enabled: e.target.checked }
                            : row,
                        ),
                      )
                    }
                  />
                  {t("admin.shippingEnabled")}
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted">{t("admin.shippingBaseFee")}</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={rate.carrier === "pickup"}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2"
                    value={rate.base_fee}
                    onChange={(e) =>
                      setRates((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? { ...row, base_fee: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted">
                    {t("admin.shippingFreeMin")}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={rate.carrier === "pickup"}
                    placeholder="—"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2"
                    value={rate.free_shipping_min}
                    onChange={(e) =>
                      setRates((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? { ...row, free_shipping_min: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                  {rate.carrier !== "pickup" ? (
                    <span className="block text-xs text-muted">
                      {t("admin.shippingFreeMinHint")}
                    </span>
                  ) : null}
                </label>
              </div>
            </article>
          ))}

          <Button type="button" pending={pending} onClick={save}>
            {pending ? t("admin.saving") : t("admin.save")}
          </Button>
        </div>
      )}
    </main>
  );
}
