import { NextResponse } from "next/server";
import { getPublicFreeShippingMin } from "@/lib/infrastructure/supabase/shipping-rates";

/**
 * Infos livraison publiques (bandeau, etc.).
 * Source de vérité : Admin → Livraison (`free_shipping_min`).
 */
export async function GET() {
  const freeShippingMin = await getPublicFreeShippingMin();
  return NextResponse.json(
    { freeShippingMin },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
