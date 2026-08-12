/**
 * Visio diagnostic via Jitsi Meet (gratuit, embarqué / lien direct).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { absoluteUrl } from "@/lib/site";

/** Domaine du service Jitsi Meet public utilisé pour les visios diagnostic. */
export const JITSI_DOMAIN = "meet.jit.si";

/** Ouverture de la salle avant l'heure prévue (minutes). */
export const VIDEO_JOIN_WINDOW_MINUTES = 5;

/** Durée maximale de l'entretien, à partir de l'heure prévue (minutes). */
export const VIDEO_CALL_MAX_MINUTES = 60;

/** Heure d'ouverture de la salle (5 min avant le RDV). */
export function videoJoinWindowStartsAt(startsAt: string): string {
  return new Date(
    new Date(startsAt).getTime() - VIDEO_JOIN_WINDOW_MINUTES * 60_000,
  ).toISOString();
}

/** Heure de fin forcée de l'entretien (1h après l'heure prévue), indépendante de la durée du créneau réservé. */
export function videoCallEndsAt(startsAt: string): string {
  return new Date(
    new Date(startsAt).getTime() + VIDEO_CALL_MAX_MINUTES * 60_000,
  ).toISOString();
}

function videoSecret(): string {
  return (
    process.env.DIAGNOSTIC_VIDEO_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

/** Nom de salle déterministe et peu devinable (UUID du RDV). */
export function jitsiRoomName(appointmentId: string): string {
  const compact = appointmentId.replace(/[^a-zA-Z0-9]/g, "");
  return `AwuraBeautyDiag${compact}`;
}

/** URL de la salle Jitsi, avec le nom d'affichage encodé en fragment si fourni. */
export function jitsiJoinUrl(
  appointmentId: string,
  displayName?: string,
): string {
  const room = jitsiRoomName(appointmentId);
  const base = `https://${JITSI_DOMAIN}/${room}`;
  if (!displayName?.trim()) return base;
  const params = new URLSearchParams();
  params.set("userInfo.displayName", displayName.trim());
  return `${base}#${params.toString()}`;
}

/** Jeton HMAC liant RDV + email, pour restreindre l'accès à la visio sans authentification complète. */
export function createVideoAccessToken(
  appointmentId: string,
  email: string,
): string {
  const secret = videoSecret();
  if (!secret) return "";
  return createHmac("sha256", secret)
    .update(`diag-video:${appointmentId}:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 40);
}

/** Vérifie le jeton d'accès visio en temps constant pour éviter les attaques par timing. */
export function verifyVideoAccessToken(
  appointmentId: string,
  email: string,
  token: string,
): boolean {
  const expected = createVideoAccessToken(appointmentId, email);
  if (!expected || !token || expected.length !== token.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(token, "utf8"),
    );
  } catch {
    return false;
  }
}

/** Chemin relatif de la page visio, avec jeton d'accès en query si disponible. */
export function diagnosticVideoPath(
  appointmentId: string,
  email: string,
): string {
  const token = createVideoAccessToken(appointmentId, email);
  const path = `/diagnostic-capillaire/visio/${appointmentId}`;
  return token ? `${path}?token=${encodeURIComponent(token)}` : path;
}

/** URL absolue (utilisable dans un email/notif) de la page visio diagnostic. */
export function diagnosticVideoAbsoluteUrl(
  appointmentId: string,
  email: string,
): string {
  return absoluteUrl(diagnosticVideoPath(appointmentId, email));
}

/** Le RDV a le bon statut pour accéder à la visio (indépendant de l'heure). */
export function isVideoEligibleStatus(status: string): boolean {
  return status === "confirmed" || status === "completed";
}

/**
 * La visio n'est réellement joignable que dans la fenêtre : 5 min avant
 * l'heure prévue jusqu'à la fin forcée de l'entretien (1h après le début).
 */
export function canJoinDiagnosticVideoNow(
  status: string,
  startsAt: string,
): boolean {
  if (!isVideoEligibleStatus(status)) return false;
  const now = Date.now();
  const windowStart = new Date(videoJoinWindowStartsAt(startsAt)).getTime();
  const callEnd = new Date(videoCallEndsAt(startsAt)).getTime();
  return now >= windowStart && now <= callEnd;
}
