"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePreferences } from "@/components/providers/preferences-provider";
import { formatPrice } from "@/lib/format/price";
import { useLiveRefresh } from "@/lib/hooks/use-live-refresh";

export function AnnouncementBar() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const [freeShippingMin, setFreeShippingMin] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/shipping/info");
      if (!res.ok) {
        setReady(true);
        return;
      }
      const json = (await res.json()) as { freeShippingMin?: number | null };
      const value = json.freeShippingMin;
      setFreeShippingMin(
        typeof value === "number" && value > 0 ? value : null,
      );
    } catch {
      /* garde la dernière valeur connue */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useLiveRefresh(load, { intervalMs: 60_000 });

  if (!ready || freeShippingMin === null) return null;

  return (
    <div className="bg-primary px-4 py-2.5 text-center text-sm tracking-wide text-background">
      {t("announcement.freeShipping", {
        amount: formatPrice(freeShippingMin, currency, i18n.language),
      })}
    </div>
  );
}
