"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RelayPoint } from "@/lib/domain";

type RelayPointPickerProps = {
  postalCode: string;
  city: string;
  country: string;
  selectedId: string | null;
  onSelect: (point: RelayPoint) => void;
};

export function RelayPointPicker({
  postalCode,
  city,
  country,
  selectedId,
  onSelect,
}: RelayPointPickerProps) {
  const { t } = useTranslation();
  const [points, setPoints] = useState<RelayPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    const cp = postalCode.replace(/\s+/g, "").trim();
    if (cp.length < 4) {
      setPoints([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        postalCode: cp,
        country: country || "FR",
      });
      if (city.trim()) params.set("city", city.trim());

      void fetch(`/api/shipping/relay-points?${params}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          const json = (await response.json()) as {
            points?: RelayPoint[];
            error?: string;
            demo?: boolean;
          };
          if (!response.ok) {
            setPoints([]);
            setError(json.error ?? t("checkout.relaySearchError"));
            return;
          }
          setPoints(json.points ?? []);
          setDemo(Boolean(json.demo));
          if (!(json.points ?? []).length) {
            setError(t("checkout.relayEmpty"));
          }
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(t("checkout.relaySearchError"));
        })
        .finally(() => setLoading(false));
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [postalCode, city, country, t]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{t("checkout.relayHint")}</p>
        {demo ? (
          <p className="text-xs text-accent">{t("checkout.relayDemo")}</p>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t("checkout.relayLoading")}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="max-h-72 space-y-2 overflow-y-auto">
        {points.map((point) => {
          const selected = selectedId === point.id;
          const mapsUrl =
            point.lat != null && point.lng != null
              ? `https://www.google.com/maps?q=${point.lat},${point.lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${point.name} ${point.address} ${point.postalCode} ${point.city}`,
                )}`;

          return (
            <li key={point.id}>
              <button
                type="button"
                onClick={() => onSelect(point)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-primary bg-primary text-background"
                    : "border-border hover:border-accent"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-medium">{point.name}</span>
                    <span
                      className={`mt-1 block text-sm ${
                        selected ? "text-background/80" : "text-muted"
                      }`}
                    >
                      {point.address}
                      <br />
                      {point.postalCode} {point.city}
                    </span>
                    <span
                      className={`mt-1 block text-xs ${
                        selected ? "text-background/70" : "text-muted"
                      }`}
                    >
                      {t("checkout.relayCode", { id: point.id })}
                      {point.distanceKm != null
                        ? ` · ${point.distanceKm.toFixed(1)} km`
                        : ""}
                    </span>
                  </span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`shrink-0 text-xs underline ${
                      selected ? "text-background" : "text-accent"
                    }`}
                  >
                    {t("checkout.relayMap")}
                  </a>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedId ? (
        <p className="text-sm text-primary" role="status">
          {t("checkout.relaySelected", { id: selectedId })}
        </p>
      ) : null}
    </div>
  );
}
