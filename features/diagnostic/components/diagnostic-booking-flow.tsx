"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form-field";
import { DiagnosticOptionGrid } from "@/features/diagnostic/components/diagnostic-option-grid";
import { DiagnosticPhotoUpload } from "@/features/diagnostic/components/diagnostic-photo-upload";
import { DiagnosticProgress } from "@/features/diagnostic/components/diagnostic-progress";
import {
  clearDiagnosticLead,
  leadFullName,
  readDiagnosticLead,
} from "@/features/diagnostic/lib/lead-storage";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { formatPrice } from "@/lib/format/price";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type {
  DiagnosticAnswerMap,
  DiagnosticPhoto,
  DiagnosticQuestion,
  DiagnosticSettings,
  DiagnosticSlot,
} from "@/lib/domain/diagnostic";
import {
  getMyProfile,
  updateMyProfile,
} from "@/lib/infrastructure/supabase/profiles";
import { profileFullName } from "@/lib/infrastructure/supabase/profile-types";

const textareaClass =
  "w-full min-h-28 rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 sm:text-sm";

type Phase = "quiz" | "extras" | "slot" | "contact";

type DiagnosticBookingFlowProps = {
  settings: DiagnosticSettings;
  /** "physical" = RDV en cabine ; "online" = créneau visio (appel vidéo 1h max). */
  channel: "physical" | "online";
};

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Tunnel de réservation du diagnostic (présentiel ou visio) : questionnaire, choix du créneau, coordonnées puis paiement. */
export function DiagnosticBookingFlow({
  settings: initialSettings,
  channel,
}: DiagnosticBookingFlowProps) {
  const { t, i18n } = useTranslation();
  const { user, session } = useAuth();
  const { locked: pending, run } = useActionLock();
  const [phase, setPhase] = useState<Phase>("quiz");
  const [sessionId] = useState(
    () => `diag-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [settings, setSettings] = useState(initialSettings);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosticAnswerMap>({});
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<DiagnosticPhoto[]>([]);
  const [slots, setSlots] = useState<DiagnosticSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactReady, setContactReady] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [freeEntitlements, setFreeEntitlements] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const lead = readDiagnosticLead();
      let nextName = leadFullName(lead);
      let nextEmail = lead?.email?.trim() || user?.email || "";
      let nextPhone = lead?.phone?.trim() || "";

      if (user) {
        const profile = await getMyProfile();
        if (cancelled) return;
        if (profile) {
          const name = profileFullName(profile);
          if (name) nextName = name;
          if (profile.phone.trim()) nextPhone = profile.phone.trim();
        }
        if (!nextEmail && user.email) nextEmail = user.email;
        const metaName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : "";
        if (!nextName && metaName) nextName = metaName;
      }

      if (cancelled) return;
      setFullName(nextName);
      setEmail(nextEmail);
      setPhone(nextPhone);
      const complete = Boolean(
        nextName.trim() && nextEmail.trim() && nextPhone.trim(),
      );
      setContactReady(complete);
      setEditingContact(!complete);

      const entitlementUrl = nextEmail
        ? `/api/diagnostic/entitlement?email=${encodeURIComponent(nextEmail)}`
        : "/api/diagnostic/entitlement";
      const entitlementRes = await fetch(entitlementUrl, {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (!cancelled && entitlementRes.ok) {
        const entitlementJson = (await entitlementRes.json()) as {
          available?: number;
        };
        setFreeEntitlements(Math.max(0, Number(entitlementJson.available ?? 0)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, session?.access_token]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const questionChannel = channel === "online" ? "online" : "physical_pre";
      const res = await fetch(
        `/api/diagnostic/questionnaire?channel=${questionChannel}&locale=${encodeURIComponent(i18n.language)}`,
      );
      const json = (await res.json()) as {
        questions?: DiagnosticQuestion[];
        settings?: DiagnosticSettings;
      };
      if (cancelled) return;
      setQuestions(json.questions ?? []);
      if (json.settings) setSettings(json.settings);
      setLoadingQuiz(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [i18n.language, channel]);

  useEffect(() => {
    if (phase !== "slot") return;
    let cancelled = false;
    void (async () => {
      const from = new Date().toISOString();
      const to = new Date();
      to.setDate(to.getDate() + 21);
      const res = await fetch(
        `/api/diagnostic/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to.toISOString())}`,
      );
      const json = (await res.json()) as {
        slots?: DiagnosticSlot[];
        settings?: DiagnosticSettings;
      };
      if (cancelled) return;
      const nextSlots = json.slots ?? [];
      setSlots(nextSlots);
      if (json.settings) setSettings(json.settings);
      if (nextSlots.length > 0) {
        setSelectedDay((prev) => prev ?? dayKey(nextSlots[0].startsAt));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const step = questions[stepIndex];
  const selected = step ? answers[step.questionKey] : undefined;

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

  const locale = toIntlLocale(i18n.language);
  const isOnline = channel === "online";
  const priceCents = isOnline ? settings.onlinePriceCents : settings.physicalPriceCents;
  const compareCents = isOnline
    ? settings.onlineCompareCents
    : settings.physicalCompareCents;

  const canSkip = Boolean(step?.allowUnknown);

  const goNextQuiz = (valueKeyOverride?: string) => {
    const value = valueKeyOverride ?? selected;
    if (!value) return;
    if (stepIndex < questions.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    setPhase("extras");
  };

  const goToContactOrPay = () => {
    if (!selectedSlot) return;
    setPhase("contact");
    if (!contactReady) setEditingContact(true);
  };

  const persistProfileIfNeeded = async () => {
    if (!user || !session) return;
    const existing = await getMyProfile();
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(" ");
    await updateMyProfile({
      first_name: firstName || fullName.trim(),
      last_name: lastName,
      phone: phone.trim(),
      address_line1: existing?.address_line1 ?? "",
      city: existing?.city ?? "",
      postal_code: existing?.postal_code ?? "",
      country: existing?.country || "FR",
    });
  };

  const onBook = (event?: FormEvent) => {
    event?.preventDefault();
    if (!selectedSlot) return;
    setError(null);
    void run(async () => {
      await persistProfileIfNeeded();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/diagnostic/appointments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          fullName,
          phone,
          startsAt: selectedSlot,
          channel,
          answers,
          notes: notes.trim() || undefined,
          photos,
        }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? t("diagnostic.physical.bookError"));
        return;
      }
      clearDiagnosticLead();
      window.location.href = json.url;
    });
  };

  if (loadingQuiz) {
    return <p className="text-muted">{t("diagnostic.loading")}</p>;
  }

  if (phase === "quiz" && questions.length > 0 && step) {
    return (
      <div className="space-y-8">
        <DiagnosticProgress
          stepIndex={stepIndex}
          totalSteps={questions.length + 1}
        />
        <div className="space-y-3">
          <h2 className="font-serif text-3xl text-primary">{step.title}</h2>
          {step.subtitle ? (
            <p className="text-muted">{step.subtitle}</p>
          ) : null}
        </div>
        <DiagnosticOptionGrid
          options={step.options}
          selected={selected}
          onSelect={(valueKey) =>
            setAnswers((prev) => ({ ...prev, [step.questionKey]: valueKey }))
          }
        />
        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            {t("diagnostic.back")}
          </Button>
          <div className="flex gap-3">
            {canSkip && !selected ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAnswers((prev) => ({ ...prev, [step.questionKey]: "dont_know" }));
                  goNextQuiz("dont_know");
                }}
              >
                {t("diagnostic.dontKnow")}
              </Button>
            ) : null}
            <Button type="button" size="lg" disabled={!selected} onClick={() => goNextQuiz()}>
              {t("diagnostic.next")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "extras") {
    const photosRequired = !isOnline;
    const canContinue = !photosRequired || photos.length > 0;
    return (
      <div className="space-y-8">
        <DiagnosticProgress stepIndex={questions.length} totalSteps={questions.length + 1} />
        <div className="space-y-3">
          <h2 className="font-serif text-3xl text-primary">
            {t("diagnostic.extras.title")}
          </h2>
          <p className="text-muted">{t("diagnostic.extras.subtitle")}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="diagnostic-physical-notes" className="block text-sm font-medium text-foreground">
            {t("diagnostic.extras.notesLabel")}
          </label>
          <textarea
            id="diagnostic-physical-notes"
            className={textareaClass}
            placeholder={t("diagnostic.extras.notesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {t("diagnostic.extras.photosLabel")}
            {photosRequired ? " *" : ""}
          </p>
          <p className="text-sm text-muted">
            {photosRequired
              ? t("diagnostic.extras.photosHintRequired")
              : t("diagnostic.extras.photosHint")}
          </p>
          <DiagnosticPhotoUpload sessionId={sessionId} onChange={setPhotos} />
        </div>

        <div className="flex justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => setPhase("quiz")}>
            {t("diagnostic.back")}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!canContinue}
            onClick={() => setPhase("slot")}
          >
            {t("diagnostic.physical.chooseSlot")}
          </Button>
        </div>
        {!canContinue ? (
          <p className="text-sm text-accent" role="alert">
            {t("diagnostic.extras.photosRequiredError")}
          </p>
        ) : null}
      </div>
    );
  }

  if (phase === "slot") {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="font-serif text-3xl text-primary">
            {t(isOnline ? "diagnostic.online.slotsTitle" : "diagnostic.physical.slotsTitle")}
          </h2>
          <p className="text-muted">
            {t(isOnline ? "diagnostic.online.slotsSubtitle" : "diagnostic.physical.slotsSubtitle")}
          </p>
          {freeEntitlements > 0 ? (
            <p className="text-sm font-medium text-primary">
              {t("diagnostic.physical.freeWithGamme", {
                count: freeEntitlements,
              })}
            </p>
          ) : (
            <p className="text-sm text-muted">
              {t("diagnostic.physical.priceLabel", {
                price: formatPrice(priceCents / 100, settings.currency, i18n.language),
                compare: formatPrice(compareCents / 100, settings.currency, i18n.language),
              })}
            </p>
          )}
        </div>

        {isOnline ? (
          <p className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-primary">
            {t("diagnostic.online.videoNotice")}
          </p>
        ) : (
          <p className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-primary">
            {t("diagnostic.physical.washHairNotice")}
          </p>
        )}

        {slots.length === 0 ? (
          <p className="rounded-2xl bg-background-alt p-6 text-muted">
            {t("diagnostic.physical.noSlots")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm">
            <div className="border-b border-border/60 bg-background-alt px-4 py-3 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
                {t("diagnostic.physical.calendarDayLabel")}
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto px-3 py-4 sm:gap-3 sm:px-5">
              {days.map((day) => {
                const active = selectedDay === day.key;
                const weekday = new Intl.DateTimeFormat(locale, {
                  weekday: "short",
                }).format(day.date);
                const dayNum = new Intl.DateTimeFormat(locale, {
                  day: "numeric",
                }).format(day.date);
                const month = new Intl.DateTimeFormat(locale, {
                  month: "short",
                }).format(day.date);
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
                    <span
                      className={`text-[0.7rem] uppercase tracking-wide ${
                        active ? "text-background/80" : "text-muted"
                      }`}
                    >
                      {weekday}
                    </span>
                    <span className="font-serif text-2xl leading-none">
                      {dayNum}
                    </span>
                    <span
                      className={`text-[0.7rem] capitalize ${
                        active ? "text-background/80" : "text-muted"
                      }`}
                    >
                      {month}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 border-t border-border/60 px-4 py-5 sm:px-5">
              <p className="text-sm font-medium text-primary">
                {t("diagnostic.physical.calendarTimeLabel")}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {daySlots.map((slot) => {
                  const label = new Intl.DateTimeFormat(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(slot.startsAt));
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
              {selectedSlot ? (
                <p className="text-sm text-muted">
                  {t("diagnostic.physical.selectedSlot", {
                    slot: new Intl.DateTimeFormat(locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(selectedSlot)),
                  })}
                </p>
              ) : null}
            </div>
          </div>
        )}

        <div className="flex justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => setPhase("extras")}>
            {t("diagnostic.back")}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!selectedSlot}
            onClick={goToContactOrPay}
          >
            {t("diagnostic.next")}
          </Button>
        </div>
      </div>
    );
  }

  const showSummary = contactReady && !editingContact;

  return (
    <form onSubmit={onBook} className="space-y-5">
      <div className="space-y-2">
        <h2 className="font-serif text-3xl text-primary">
          {t("diagnostic.physical.contactTitle")}
        </h2>
        {user && showSummary ? (
          <p className="text-sm text-muted">
            {t("diagnostic.physical.contactFromAccount")}
          </p>
        ) : null}
      </div>

      {showSummary ? (
        <div className="rounded-2xl border border-border/70 bg-background-alt px-4 py-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1 text-muted">
              <p className="font-medium text-primary">{fullName}</p>
              <p>{email}</p>
              <p>{phone}</p>
            </div>
            <button
              type="button"
              className="text-sm text-accent hover:text-accent-light"
              onClick={() => setEditingContact(true)}
            >
              {t("diagnostic.physical.editContact")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <TextField
            id="diagnostic-full-name"
            label={t("checkout.fullName")}
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <TextField
            id="diagnostic-email"
            label={t("checkout.email")}
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            readOnly={Boolean(user?.email)}
          />
          <TextField
            id="diagnostic-phone"
            label={t("checkout.phone")}
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </>
      )}

      {!isOnline && settings.physicalLocationText ? (
        <p className="text-sm text-muted">{settings.physicalLocationText}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-accent" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
      <div className="flex justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setPhase("slot")}>
          {t("diagnostic.back")}
        </Button>
        <Button type="submit" size="lg" pending={pending}>
          {freeEntitlements > 0
            ? t("diagnostic.physical.bookFreeCta")
            : t("diagnostic.physical.payCta", {
                price: formatPrice(priceCents / 100, settings.currency, i18n.language),
              })}
        </Button>
      </div>
    </form>
  );
}
