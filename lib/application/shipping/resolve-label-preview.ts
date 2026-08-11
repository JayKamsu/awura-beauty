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

export type ResolvedLabel =
  | { kind: "path"; labelPath: string }
  | { kind: "url"; labelUrl: string }
  | { kind: "none" };

/**
 * Prépare l'étiquette pour aperçu/impression :
 * - Colissimo : upload du PDF vers le bucket privé, retourne son chemin
 *   (l'URL n'est jamais stockée durablement — signée à la demande).
 * - Mondial Relay : URL PDF distante (éventuellement mise en A4).
 */
export async function resolvePrintableLabel(input: {
  orderId: string;
  labelUrl: string | null;
  labelBase64: string | null;
}): Promise<ResolvedLabel> {
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
    if (uploaded.path) return { kind: "path", labelPath: uploaded.path };
  }

  if (input.labelUrl) {
    if (
      input.labelUrl.includes("StickerMaker") ||
      input.labelUrl.includes("etiquette") ||
      input.labelUrl.includes("PDF") ||
      input.labelUrl.toLowerCase().endsWith(".pdf")
    ) {
      const normalized = normalizeMondialRelayLabelUrl(input.labelUrl);
      if (normalized) return { kind: "url", labelUrl: normalized };
    }
    return { kind: "url", labelUrl: input.labelUrl };
  }

  return { kind: "none" };
}
