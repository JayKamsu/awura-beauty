"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { DiagnosticSlot } from "@/lib/domain/diagnostic";

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type ReschedulePickerProps = {
  currentStartsAt: string;
  /** Récupère les créneaux disponibles pour la fenêtre affichée (délègue au fetch admin ou public selon le contexte). */
  fetchSlots: (fromIso: string, toIso: string) => Promise<DiagnosticSlot[]>;
  onConfirm: (startsAt: string) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
};

/** Sélecteur de créneau (jour + heure) pour replanifier un rendez-vous — utilisé côté client et admin. */
export function RescheduleAppointmentPicker({
  currentStartsAt,
  fetchSlots,
  onConfirm,
  onCancel,
}: ReschedulePickerProps) {
  const { t, i18n } = useTranslation();
  const [slots, setSlots] = useState<DiagnosticSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      const from = new Date().toISOString();
      const to = new Date();
      to.setDate(to.getDate() + 21);
      const result = await fetchSlots(from, to.toISOString());
      if (!mounted) return;
      setSlots(result);
      if (result.length > 0) setSelectedDay(dayKey(result[0].startsAt));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locale = toIntlLocale(i18n.language);

  const days = useMemo(() => {
    const map = new Map<string, DiagnosticSlot[]>();
    for (const slot of slots) {
      const key = dayKey(slot.startsAt);
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, daySlots]) => ({
      key,
      date: new Date(daySlots[0].startsAt),
      slots: daySlots,
    }));
  }, [slots]);

  const daySlots = useMemo(() => {
    if (!selectedDay) return [];
    return days.find((d) => d.key === selectedDay)?.slots ?? [];
  }, [days, selectedDay]);

  const confirm = () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    void onConfirm(selectedSlot).then((result) => {
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error ?? t("diagnostic.reschedule.error"));
      }
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        {t("diagnostic.reschedule.currentSlot", {
          date: new Intl.DateTimeFormat(locale, {
            dateStyle: "full",
            timeStyle: "short",
          }).format(new Date(currentStartsAt)),
        })}
      </p>

      {loading ? (
        <p className="text-muted">{t("diagnostic.loading")}</p>
      ) : days.length === 0 ? (
        <p className="rounded-2xl bg-background-alt p-6 text-muted">
          {t("diagnostic.physical.noSlots")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-background">
          <div className="flex gap-2 overflow-x-auto px-3 py-4 sm:gap-3 sm:px-5">
            {days.map((day) => {
              const active = selectedDay === day.key;
              const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day.date);
              const dayNum = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(day.date);
              const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(day.date);
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day.key);
                    setSelectedSlot(null);
                  }}
                  className={`flex min-w-[4.75rem] shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-3 transition ${
                    active
                      ? "bg-primary text-background shadow-md"
                      : "bg-background-alt text-primary hover:ring-1 hover:ring-accent/40"
                  }`}
                >
                  <span className={`text-[0.7rem] uppercase tracking-wide ${active ? "text-background/80" : "text-muted"}`}>
                    {weekday}
                  </span>
                  <span className="font-serif text-2xl leading-none">{dayNum}</span>
                  <span className={`text-[0.7rem] capitalize ${active ? "text-background/80" : "text-muted"}`}>
                    {month}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/60 px-4 py-5 sm:grid-cols-4 sm:px-5 md:grid-cols-5">
            {daySlots.map((slot) => {
              const label = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(slot.startsAt));
              const active = selectedSlot === slot.startsAt;
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  onClick={() => setSelectedSlot(slot.startsAt)}
                  className={`min-h-12 rounded-xl text-sm font-medium transition ${
                    active
                      ? "bg-accent text-primary shadow-sm"
                      : "border border-border bg-background text-primary hover:border-accent"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {t("diagnostic.back")}
        </Button>
        <Button type="button" size="lg" onClick={confirm} disabled={!selectedSlot || submitting}>
          {submitting ? t("diagnostic.loading") : t("diagnostic.reschedule.confirm")}
        </Button>
      </div>
    </div>
  );
}
