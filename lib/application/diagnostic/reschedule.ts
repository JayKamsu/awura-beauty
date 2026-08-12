import { listAvailableDiagnosticSlots } from "@/lib/application/diagnostic/slots";
import {
  getAppointmentById,
  getDiagnosticSettings,
  updateAppointment,
} from "@/lib/infrastructure/supabase/diagnostic-admin";
import type { DiagnosticAppointment } from "@/lib/domain/diagnostic";

const NON_RESCHEDULABLE_STATUSES = new Set(["cancelled", "completed"]);

export type RescheduleResult =
  | { ok: true; appointment: DiagnosticAppointment }
  | { ok: false; error: string };

/**
 * Replanifie un RDV vers un nouveau créneau (client ou admin) : vérifie que le
 * créneau est réellement libre (hors le RDV lui-même) et remet à zéro le rappel.
 */
export async function rescheduleAppointment(
  appointmentId: string,
  newStartsAt: string,
): Promise<RescheduleResult> {
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) return { ok: false, error: "Not found" };
  if (NON_RESCHEDULABLE_STATUSES.has(appointment.status)) {
    return { ok: false, error: "Appointment cannot be rescheduled" };
  }

  const starts = new Date(newStartsAt);
  if (Number.isNaN(starts.getTime())) {
    return { ok: false, error: "Invalid date" };
  }

  const settings = await getDiagnosticSettings();
  const duration = settings.slotDurationMinutes || 45;
  const ends = new Date(starts.getTime() + duration * 60_000);

  const from = new Date(starts);
  from.setHours(0, 0, 0, 0);
  const to = new Date(starts);
  to.setDate(to.getDate() + 1);

  const slots = await listAvailableDiagnosticSlots(
    from.toISOString(),
    to.toISOString(),
  );
  // Le RDV en cours de replanification occupe déjà son propre créneau actuel
  // dans le calcul de disponibilité : s'il choisit de revenir sur ce même
  // créneau, ou un créneau réellement libre, les deux doivent être acceptés.
  const isSameSlot =
    Math.abs(new Date(appointment.startsAt).getTime() - starts.getTime()) < 1000;
  const matchesFreeSlot = slots.some(
    (s) => Math.abs(new Date(s.startsAt).getTime() - starts.getTime()) < 1000,
  );
  if (!isSameSlot && !matchesFreeSlot) {
    return { ok: false, error: "Slot unavailable" };
  }

  const updated = await updateAppointment(appointmentId, {
    startsAt: starts.toISOString(),
    endsAt: ends.toISOString(),
    status: appointment.status === "pending_payment" ? undefined : "confirmed",
    reschedule: true,
  });

  if (!updated) return { ok: false, error: "Update failed" };
  return { ok: true, appointment: updated };
}
