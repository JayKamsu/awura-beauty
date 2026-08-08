import QRCode from "qrcode";

/** Génère un QR en SVG (serveur / edge-friendly via Buffer). */
export async function generateQrSvg(
  text: string,
  options?: { dark?: string; light?: string; width?: number },
): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: options?.width ?? 180,
    color: {
      dark: options?.dark ?? "#0F3D2E",
      light: options?.light ?? "#00000000",
    },
  });
}
