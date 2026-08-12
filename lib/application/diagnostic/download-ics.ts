import { buildAppointmentIcs } from "@/lib/application/diagnostic/ics";

function triggerIcsDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Génère et télécharge le fichier .ics d'un rendez-vous diagnostic depuis le
 * navigateur (aucune authentification requise — utilisé juste après paiement,
 * y compris pour un client invité). Récupère le lieu depuis les réglages publics.
 */
export async function downloadAppointmentIcs(appointment: {
  id: string;
  startsAt: string;
  endsAt: string;
}): Promise<void> {
  let location: string | undefined;
  try {
    const res = await fetch("/api/diagnostic/slots");
    if (res.ok) {
      const json = (await res.json()) as {
        settings?: { physicalLocationText?: string };
      };
      location = json.settings?.physicalLocationText || undefined;
    }
  } catch {
    // Pas bloquant : le fichier .ics reste valide sans lieu.
  }

  const ics = buildAppointmentIcs({
    uid: `diagnostic-${appointment.id}@awurabeauty.com`,
    title: "Diagnostic capillaire Awura Beauty",
    description:
      "Rendez-vous de diagnostic capillaire présentiel Awura Beauty. Merci de ne pas te laver les cheveux dans les 48 heures précédant le rendez-vous.",
    location,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
  });

  triggerIcsDownload(`diagnostic-awura-${appointment.id}.ics`, ics);
}

/**
 * Télécharge le fichier .ics d'un rendez-vous via la route API authentifiée
 * (compte client ou admin) — nécessite un token Bearer valide (propriétaire ou admin).
 */
export async function downloadAppointmentIcsAuthenticated(
  appointmentId: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`/api/diagnostic/appointments/${appointmentId}/ics`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return;
  const content = await res.text();
  triggerIcsDownload(`diagnostic-awura-${appointmentId}.ics`, content);
}
