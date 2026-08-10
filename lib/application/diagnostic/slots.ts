import type {
  DiagnosticAppointment,
  DiagnosticAvailabilityRule,
  DiagnosticSettings,
  DiagnosticSlot,
  DiagnosticSlotOverride,
} from "@/lib/domain/diagnostic";
import {
  getDiagnosticSettings,
  listAppointmentsInRange,
  listAvailabilityRules,
  listSlotOverrides,
} from "@/lib/infrastructure/supabase/diagnostic-admin";

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function atLocalMinutes(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Génère les créneaux disponibles entre from et to (ISO).
 * Règles hebdo + overrides open/blocked − RDV non annulés.
 */
export async function listAvailableDiagnosticSlots(
  fromIso: string,
  toIso: string,
): Promise<DiagnosticSlot[]> {
  const settings = await getDiagnosticSettings();
  const rules = await listAvailabilityRules();
  const overrides = await listSlotOverrides(fromIso, toIso);
  const booked = await listAppointmentsInRange(fromIso, toIso);
  return computeSlots({
    fromIso,
    toIso,
    settings,
    rules,
    overrides,
    booked,
  });
}

/** Logique pure de génération des créneaux (règles hebdo + overrides − RDV pris), sans accès réseau. */
export function computeSlots(input: {
  fromIso: string;
  toIso: string;
  settings: DiagnosticSettings;
  rules: DiagnosticAvailabilityRule[];
  overrides: DiagnosticSlotOverride[];
  booked: DiagnosticAppointment[];
}): DiagnosticSlot[] {
  const duration = Math.max(15, input.settings.slotDurationMinutes || 45);
  const from = new Date(input.fromIso);
  const to = new Date(input.toIso);
  const slots: DiagnosticSlot[] = [];
  const enabledRules = input.rules.filter((r) => r.enabled);

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < to) {
    const weekday = cursor.getDay();
    const dayRules = enabledRules.filter((r) => r.weekday === weekday);

    for (const rule of dayRules) {
      const startMin = parseTimeToMinutes(rule.startTime);
      const endMin = parseTimeToMinutes(rule.endTime);
      for (let m = startMin; m + duration <= endMin; m += duration) {
        const starts = atLocalMinutes(cursor, m);
        const ends = new Date(starts.getTime() + duration * 60_000);
        if (starts < from || ends > to) continue;
        if (starts.getTime() < Date.now() + 60 * 60_000) continue; // +1h lead
        slots.push({
          startsAt: starts.toISOString(),
          endsAt: ends.toISOString(),
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  for (const ov of input.overrides) {
    if (ov.kind !== "open") continue;
    const starts = new Date(ov.startsAt);
    const ends = new Date(ov.endsAt);
    if (starts >= to || ends <= from) continue;
    if (starts.getTime() < Date.now() + 60 * 60_000) continue;
    slots.push({ startsAt: starts.toISOString(), endsAt: ends.toISOString() });
  }

  const blocked = input.overrides.filter((o) => o.kind === "blocked");
  const taken = input.booked.filter((a) => a.status !== "cancelled");

  const filtered = slots.filter((slot) => {
    const s = new Date(slot.startsAt);
    const e = new Date(slot.endsAt);
    for (const b of blocked) {
      if (overlaps(s, e, new Date(b.startsAt), new Date(b.endsAt))) return false;
    }
    for (const a of taken) {
      if (overlaps(s, e, new Date(a.startsAt), new Date(a.endsAt))) return false;
    }
    return true;
  });

  const uniq = new Map<string, DiagnosticSlot>();
  for (const slot of filtered) uniq.set(slot.startsAt, slot);
  return [...uniq.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
