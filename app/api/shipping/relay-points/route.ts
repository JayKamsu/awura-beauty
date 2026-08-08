import { NextResponse } from "next/server";
import {
  RATE_LIMITS,
  rateLimitResponse,
} from "@/lib/infrastructure/security/http-rate-limit";
import { searchMondialRelayPoints } from "@/lib/infrastructure/shipping/mondialrelay";

/**
 * Recherche publique Points Relais (CP obligatoire).
 * Secrets MR restent côté serveur.
 */
export async function GET(request: Request) {
  const limited = rateLimitResponse(request, RATE_LIMITS.shippingSearch);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const postalCode = searchParams.get("postalCode") ?? "";
  const city = searchParams.get("city") ?? undefined;
  const country = searchParams.get("country") ?? "FR";

  const result = await searchMondialRelayPoints({
    postalCode,
    city,
    country,
  });

  if (result.error && !result.points.length) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    points: result.points,
    demo: !process.env.MONDIAL_RELAY_ENSEIGNE || !process.env.MONDIAL_RELAY_PRIVATE_KEY,
  });
}
