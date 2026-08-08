import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";
import {
  DEFAULT_SITE_BRAND,
  type QrDefaultMode,
  type SiteBrandSettings,
} from "@/lib/domain/site-brand";

export { DEFAULT_SITE_BRAND };

function mapRow(row: Record<string, unknown>): SiteBrandSettings {
  const mode = String(row.qr_default_mode ?? "tutorials") as QrDefaultMode;
  const qrDefaultMode: QrDefaultMode = [
    "tutorials",
    "product",
    "diagnostic",
    "custom",
  ].includes(mode)
    ? mode
    : "tutorials";

  return {
    duafeUrl: String(row.duafe_url ?? ""),
    logoLightUrl: String(row.logo_light_url ?? ""),
    logoDarkUrl: String(row.logo_dark_url ?? ""),
    logoAccentUrl: String(row.logo_accent_url ?? ""),
    childUniverseEnabled: Boolean(row.child_universe_enabled),
    showDuafePattern: row.show_duafe_pattern !== false,
    qrDefaultMode,
    qrCustomUrl: String(row.qr_custom_url ?? ""),
  };
}

export async function getSiteBrandSettings(): Promise<SiteBrandSettings> {
  const supabase = createAdminSupabaseClient() ?? createSupabaseClient();
  if (!supabase) return DEFAULT_SITE_BRAND;

  const { data, error } = await supabase
    .from("site_brand_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) return DEFAULT_SITE_BRAND;
  return mapRow(data as Record<string, unknown>);
}

export async function updateSiteBrandSettings(
  patch: Partial<SiteBrandSettings>,
): Promise<SiteBrandSettings | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.duafeUrl !== undefined) payload.duafe_url = patch.duafeUrl;
  if (patch.logoLightUrl !== undefined)
    payload.logo_light_url = patch.logoLightUrl;
  if (patch.logoDarkUrl !== undefined) payload.logo_dark_url = patch.logoDarkUrl;
  if (patch.logoAccentUrl !== undefined)
    payload.logo_accent_url = patch.logoAccentUrl;
  if (patch.childUniverseEnabled !== undefined)
    payload.child_universe_enabled = patch.childUniverseEnabled;
  if (patch.showDuafePattern !== undefined)
    payload.show_duafe_pattern = patch.showDuafePattern;
  if (patch.qrDefaultMode !== undefined)
    payload.qr_default_mode = patch.qrDefaultMode;
  if (patch.qrCustomUrl !== undefined)
    payload.qr_custom_url = patch.qrCustomUrl;

  const { error } = await supabase
    .from("site_brand_settings")
    .upsert({ id: "default", ...payload });

  if (error) return null;
  return getSiteBrandSettings();
}
