/** Construit le contenu d'un fichier .ics (RFC 5545) pour un rendez-vous — compatible Calendrier iOS/Android/Outlook/Google. */
export function buildAppointmentIcs(input: {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
}): string {
  const toIcsDate = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const escapeText = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const now = toIcsDate(new Date().toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Awura Beauty//Diagnostic Capillaire//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(input.startsAt)}`,
    `DTEND:${toIcsDate(input.endsAt)}`,
    `SUMMARY:${escapeText(input.title)}`,
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escapeText(input.description)}`);
  }
  if (input.location) {
    lines.push(`LOCATION:${escapeText(input.location)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  // Fin de ligne CRLF imposée par la RFC 5545.
  return lines.join("\r\n");
}
