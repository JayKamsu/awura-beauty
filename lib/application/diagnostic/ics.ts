/** Organisateur affiché dans Google Agenda. */
export const CALENDAR_ORGANIZER_EMAIL = "contact@awurabeauty.com";

/** Agenda personnel fusionné avec les rendez-vous Awura. */
export const CALENDAR_SYNC_EMAIL = "mariama.guinee@gmail.com";

/** Adresse organisatrice (Google Agenda). Surcharge possible via CALENDAR_ORGANIZER_EMAIL. */
export function calendarOrganizerEmail(): string {
  return process.env.CALENDAR_ORGANIZER_EMAIL?.trim() || CALENDAR_ORGANIZER_EMAIL;
}

/** Adresse Gmail qui reçoit chaque rendez-vous dans son agenda. */
export function calendarSyncEmail(): string {
  return process.env.CALENDAR_SYNC_EMAIL?.trim() || CALENDAR_SYNC_EMAIL;
}

/** Méthode iCalendar : publication, invitation ou annulation. */
export type IcsMethod = "PUBLISH" | "REQUEST" | "CANCEL";

/** Participant d'un événement calendrier. */
export type IcsAttendee = {
  email: string;
  name?: string;
  /** Déjà accepté : Google l'ajoute sans demander de réponse. */
  accepted?: boolean;
};

/** Champs d'un VEVENT diagnostic. */
export type IcsEventInput = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  sequence?: number;
  status?: "CONFIRMED" | "CANCELLED";
  attendees?: IcsAttendee[];
};

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function eventLines(input: IcsEventInput): string[] {
  const now = toIcsDate(new Date().toISOString());
  const lines = [
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(input.startsAt)}`,
    `DTEND:${toIcsDate(input.endsAt)}`,
    `SUMMARY:${escapeText(input.title)}`,
    `SEQUENCE:${input.sequence ?? 0}`,
    `STATUS:${input.status ?? "CONFIRMED"}`,
    `ORGANIZER;CN=Awura Beauty:mailto:${calendarOrganizerEmail()}`,
  ];

  if (input.description) lines.push(`DESCRIPTION:${escapeText(input.description)}`);
  if (input.location) lines.push(`LOCATION:${escapeText(input.location)}`);

  for (const attendee of input.attendees ?? []) {
    const email = attendee.email.trim();
    if (!email.includes("@")) continue;
    const name = (attendee.name || email).replace(/"/g, "'");
    const partstat = attendee.accepted ? "ACCEPTED" : "NEEDS-ACTION";
    const rsvp = attendee.accepted ? "FALSE" : "TRUE";
    lines.push(
      `ATTENDEE;CN="${name}";ROLE=REQ-PARTICIPANT;PARTSTAT=${partstat};RSVP=${rsvp}:mailto:${email}`,
    );
  }

  lines.push("END:VEVENT");
  return lines;
}

function wrapCalendar(events: string[][], method: IcsMethod): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Awura Beauty//Diagnostic Capillaire//FR",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    `X-WR-CALNAME:Awura Beauty — Diagnostics`,
    ...events.flat(),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

/** Construit le contenu d'un fichier .ics (RFC 5545) pour un rendez-vous — compatible Google Agenda. */
export function buildAppointmentIcs(
  input: IcsEventInput & { method?: IcsMethod },
): string {
  return wrapCalendar([eventLines(input)], input.method ?? "PUBLISH");
}

/** Calendrier complet (plusieurs rendez-vous) à abonner dans Google Agenda. */
export function buildCalendarIcs(events: IcsEventInput[]): string {
  return wrapCalendar(
    events.map((event) => eventLines(event)),
    "PUBLISH",
  );
}
