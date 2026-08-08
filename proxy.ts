import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  RATE_LIMITS,
  rateLimitResponse,
} from "@/lib/infrastructure/security/http-rate-limit";

/**
 * Garde edge : admin + rate limit API sensibles.
 * Auth admin réelle : requireAdminFromRequest.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // Webhooks externes : ne pas rate-limiter (Stripe, etc.)
  const isWebhook = pathname.includes("/webhook");

  if (!isWebhook && pathname.startsWith("/api/checkout")) {
    const limited = rateLimitResponse(
      request,
      pathname.includes("/confirm")
        ? RATE_LIMITS.checkoutConfirm
        : RATE_LIMITS.checkoutWrite,
    );
    if (limited) return limited;
  }

  if (pathname.startsWith("/api/support")) {
    const limited = rateLimitResponse(
      request,
      request.method === "GET"
        ? RATE_LIMITS.supportRead
        : RATE_LIMITS.supportWrite,
    );
    if (limited) return limited;
  }

  if (pathname.startsWith("/api/push/subscribe")) {
    const limited = rateLimitResponse(request, RATE_LIMITS.pushSubscribe);
    if (limited) return limited;
  }

  if (pathname.startsWith("/api/shipping")) {
    const limited = rateLimitResponse(
      request,
      pathname.includes("/sync")
        ? RATE_LIMITS.shippingSync
        : RATE_LIMITS.shippingSearch,
    );
    if (limited) return limited;
  }

  if (pathname.startsWith("/api/admin")) {
    response.headers.set("Cache-Control", "no-store");

    const bypass =
      process.env.ADMIN_DEV_BYPASS === "true" &&
      process.env.NODE_ENV !== "production";

    if (!bypass) {
      const header = request.headers.get("authorization");
      const hasBearer = Boolean(
        header?.startsWith("Bearer ") && header.length > 10,
      );
      if (!hasBearer) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      const limited = rateLimitResponse(
        request,
        pathname.includes("/upload")
          ? RATE_LIMITS.adminUpload
          : RATE_LIMITS.adminWrite,
      );
      if (limited) return limited;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/checkout/:path*",
    "/api/support/:path*",
    "/api/push/:path*",
    "/api/shipping/:path*",
  ],
};
