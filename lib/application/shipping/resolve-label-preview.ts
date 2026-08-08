import { uploadShippingLabel } from "@/lib/infrastructure/supabase/storage";

/**
 * Normalise une URL d’étiquette Mondial Relay (PDF A4 pour aperçu/impression).
 */
export function normalizeMondialRelayLabelUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(
      url.startsWith("http") ? url : `https://www.mondialrelay.com${url}`,
    );
    if (!parsed.searchParams.get("format")) {
      parsed.searchParams.set("format", "A4");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Prépare une URL d’aperçu imprimable :
 * - La Poste : upload du PDF base64 vers Storage
 * - Mondial Relay : URL PDF (éventuellement mise en A4)
 */
export async function resolvePrintableLabelUrl(input: {
  orderId: string;
  labelUrl: string | null;
  labelBase64: string | null;
}): Promise<string | null> {
  if (input.labelBase64) {
    const raw = input.labelBase64.replace(/\s+/g, "");
    const bytes = Buffer.from(raw, "base64");
    const looksPng =
      bytes.length > 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47;
    const contentType = looksPng ? "image/png" : "application/pdf";
    const uploaded = await uploadShippingLabel({
      orderId: input.orderId,
      bytes,
      contentType,
    });
    if (uploaded.url) return uploaded.url;
  }

  if (input.labelUrl) {
    if (
      input.labelUrl.includes("StickerMaker") ||
      input.labelUrl.includes("etiquette") ||
      input.labelUrl.includes("PDF") ||
      input.labelUrl.toLowerCase().endsWith(".pdf")
    ) {
      return normalizeMondialRelayLabelUrl(input.labelUrl);
    }
  }

  return input.labelUrl;
}
