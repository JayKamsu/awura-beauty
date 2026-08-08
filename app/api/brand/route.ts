import { NextResponse } from "next/server";
import { getSiteBrandSettings } from "@/lib/infrastructure/supabase/site-brand";

/** Paramètres marque publics (logos, Duafe, QR défaut, univers enfant). */
export async function GET() {
  const settings = await getSiteBrandSettings();
  return NextResponse.json(
    { settings },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
