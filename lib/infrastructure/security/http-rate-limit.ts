import { NextResponse } from "next/server";
import {
  checkRateLimit,
  clientKeyFromRequest,
  type RateLimitOptions,
} from "@/lib/infrastructure/security/rate-limit";

/** Retourne une 429 si la limite est dépassée, sinon null. */
export function rateLimitResponse(
  request: Request,
  options: RateLimitOptions,
): NextResponse | null {
  const result = checkRateLimit(clientKeyFromRequest(request), options);
  if (result.ok) return null;

  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSec),
        "Cache-Control": "no-store",
      },
    },
  );
}

/** Config des limites de débit par route sensible (checkout, support, push, admin, shipping). */
export const RATE_LIMITS = {
  checkoutWrite: { name: "checkout:write", limit: 12, windowMs: 60_000 },
  checkoutConfirm: { name: "checkout:confirm", limit: 30, windowMs: 60_000 },
  supportWrite: { name: "support:write", limit: 40, windowMs: 60_000 },
  supportRead: { name: "support:read", limit: 90, windowMs: 60_000 },
  pushSubscribe: { name: "push:subscribe", limit: 20, windowMs: 60_000 },
  adminWrite: { name: "admin:write", limit: 60, windowMs: 60_000 },
  adminUpload: { name: "admin:upload", limit: 30, windowMs: 60_000 },
  shippingSearch: { name: "shipping:search", limit: 40, windowMs: 60_000 },
  shippingSync: { name: "shipping:sync", limit: 20, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitOptions>;
