import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSiteBrandSettings } from "@/lib/infrastructure/supabase/site-brand";
import { BRAND_LOGOS } from "@/lib/brand";

/** Logo marque à fond transparent (priorité admin → fichier local). */
export async function resolveTransparentBrandLogo(): Promise<{
  src: string;
  isDataUrl: boolean;
}> {
  const settings = await getSiteBrandSettings();
  const remote =
    settings.logoLightUrl?.trim() ||
    settings.logoAccentUrl?.trim() ||
    settings.duafeUrl?.trim() ||
    "";

  if (remote.startsWith("http://") || remote.startsWith("https://")) {
    try {
      const res = await fetch(remote, { next: { revalidate: 3600 } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get("content-type") || "image/png";
        return {
          src: `data:${contentType};base64,${buf.toString("base64")}`,
          isDataUrl: true,
        };
      }
    } catch {
      // fallback local
    }
  }

  // logo-black = Duafe + AWURA sur fond transparent (charte)
  const filePath = join(process.cwd(), "public", BRAND_LOGOS.black.replace(/^\//, ""));
  const buf = await readFile(filePath);
  return {
    src: `data:image/png;base64,${buf.toString("base64")}`,
    isDataUrl: true,
  };
}
