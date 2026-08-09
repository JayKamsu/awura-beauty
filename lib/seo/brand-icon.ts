import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSiteBrandSettings } from "@/lib/infrastructure/supabase/site-brand";
import { BRAND_LOGOS } from "@/lib/brand";

/** Logo or (accent) à fond transparent — visible dans l’onglet navigateur. */
export async function resolveTransparentBrandLogo(): Promise<{
  src: string;
  isDataUrl: boolean;
}> {
  const settings = await getSiteBrandSettings();
  // Priorité : logo doré / accent admin, puis Duafe, puis fichier local orange
  const remote =
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

  const filePath = join(
    process.cwd(),
    "public",
    BRAND_LOGOS.orange.replace(/^\//, ""),
  );
  const buf = await readFile(filePath);
  return {
    src: `data:image/png;base64,${buf.toString("base64")}`,
    isDataUrl: true,
  };
}
