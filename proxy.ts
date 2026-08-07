import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Garde edge pour /admin et /api/admin.
 * La session Supabase est côté client (Bearer) : le contrôle d'identité
 * reste dans requireAdminFromRequest. Ici : noindex + refus API sans Bearer
 * (sauf bypass dev serveur).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  if (pathname.startsWith("/admin")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  if (pathname.startsWith("/api/admin")) {
    response.headers.set("Cache-Control", "no-store");

    const bypass =
      process.env.ADMIN_DEV_BYPASS === "true" &&
      process.env.NODE_ENV !== "production";

    if (!bypass) {
      const header = request.headers.get("authorization");
      const hasBearer = Boolean(header?.startsWith("Bearer ") && header.length > 10);
      if (!hasBearer) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
