import { NextResponse } from "next/server";
import type { QrDefaultMode, SiteBrandSettings } from "@/lib/domain/site-brand";
import { requireAdminFromRequest } from "@/lib/infrastructure/supabase/admin-auth";
import {
  getSiteBrandSettings,
  updateSiteBrandSettings,
} from "@/lib/infrastructure/supabase/site-brand";

/** Récupère les réglages de marque du site (admin). */
export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;
  const settings = await getSiteBrandSettings();
  return NextResponse.json({ settings });
}

/** Met à jour les réglages de marque (logos, univers enfant, QR par défaut). */
export async function PUT(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as Partial<SiteBrandSettings>;
  const modes: QrDefaultMode[] = [
    "tutorials",
    "product",
    "diagnostic",
    "custom",
  ];
  const qrDefaultMode =
    body.qrDefaultMode && modes.includes(body.qrDefaultMode)
      ? body.qrDefaultMode
      : undefined;

  const updated = await updateSiteBrandSettings({
    duafeUrl: body.duafeUrl,
    logoLightUrl: body.logoLightUrl,
    logoDarkUrl: body.logoDarkUrl,
    logoAccentUrl: body.logoAccentUrl,
    childUniverseEnabled: body.childUniverseEnabled,
    showDuafePattern: body.showDuafePattern,
    qrDefaultMode,
    qrCustomUrl: body.qrCustomUrl,
  });

  if (!updated) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
  return NextResponse.json({ settings: updated });
}
