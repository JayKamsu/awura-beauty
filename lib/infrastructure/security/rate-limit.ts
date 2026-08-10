/**
 * Rate limit mémoire (par isolate). Suffisant anti-rafale ;
 * en multi-instance Vercel, chaque instance a son compteur.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const MAX_KEYS = 5000;

function prune(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size < MAX_KEYS * 0.8) break;
  }
  if (buckets.size >= MAX_KEYS) {
    const first = buckets.keys().next().value;
    if (first) buckets.delete(first);
  }
}

/** Paramètres d'une vérification de rate limit (nom du bucket, quota, fenêtre). */
export type RateLimitOptions = {
  /** Identifiant logique (ex. checkout:create) */
  name: string;
  limit: number;
  windowMs: number;
};

/** Résultat d'une vérification : autorisé, ou refusé avec délai avant réessai. */
export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/** Incrémente et vérifie le compteur pour une clé donnée. Fenêtre glissante par bucket, reset automatique à expiration. */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  prune(now);

  const storeKey = `${options.name}:${key}`;
  let bucket = buckets.get(storeKey);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(storeKey, bucket);
  }

  bucket.count += 1;

  if (bucket.count > options.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { ok: true };
}

/** Dérive une clé client depuis les en-têtes de proxy (x-forwarded-for / x-real-ip) pour le rate limiting par IP. */
export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
