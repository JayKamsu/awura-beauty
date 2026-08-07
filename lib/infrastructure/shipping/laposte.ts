/**
 * Connecteur La Poste / Colissimo
 *
 * - createLaPosteLabel : génération d'étiquette (espace admin uniquement)
 * - getLaPosteTracking : suivi colis (page compte client)
 *
 * Env attendues :
 * - LAPOSTE_CONTRACT_NUMBER / LAPOSTE_PASSWORD (WS affranchissement Colissimo)
 * - LAPOSTE_API_KEY (Suivi Okapi — developer.laposte.fr)
 * - LAPOSTE_AFFRANCHISSEMENT_URL (optionnel)
 * - LAPOSTE_TRACKING_URL (optionnel)
 */

import {
  mapCarrierStatusToShippingStatus,
  type CreateShippingLabelInput,
  type CreateShippingLabelResult,
  type TrackingEvent,
  type TrackingResult,
} from "@/lib/infrastructure/shipping/types";

function getAffranchissementConfig() {
  return {
    contractNumber: process.env.LAPOSTE_CONTRACT_NUMBER,
    password: process.env.LAPOSTE_PASSWORD,
    url:
      process.env.LAPOSTE_AFFRANCHISSEMENT_URL ??
      "https://ws.colissimo.fr/sls-ws/SlsServiceWS/2.0",
  };
}

function getTrackingConfig() {
  return {
    apiKey: process.env.LAPOSTE_API_KEY,
    url:
      process.env.LAPOSTE_TRACKING_URL ??
      "https://api.laposte.fr/suivi/v2/idships",
  };
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? parts[0],
  };
}

function buildMockLabel(
  input: CreateShippingLabelInput,
): CreateShippingLabelResult {
  const trackingNumber = `LP${input.orderId.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  return {
    carrier: "laposte",
    trackingNumber,
    labelUrl: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
    labelBase64: null,
    rawStatus: "mock_label_created",
  };
}

/**
 * Crée une étiquette d'expédition Colissimo pour une commande.
 * À appeler uniquement depuis l'espace admin (via route API serveur).
 */
export async function createLaPosteLabel(
  input: CreateShippingLabelInput,
): Promise<CreateShippingLabelResult> {
  const config = getAffranchissementConfig();

  if (!config.contractNumber || !config.password) {
    return buildMockLabel(input);
  }

  const { firstName, lastName } = splitName(input.recipient.fullName);
  const weight = input.weightGrams ?? 500;

  // WS Colissimo SLS — generateLabel (JSON-like SOAP envelope simplifié via REST si proxy,
  // sinon payload SOAP XML classique).
  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sls="http://sls.ws.coliposte.fr">
  <soapenv:Header/>
  <soapenv:Body>
    <sls:generateLabel>
      <generateLabelRequest>
        <contractNumber>${config.contractNumber}</contractNumber>
        <password>${config.password}</password>
        <outputPrintingType>PDF_A4_300dpi</outputPrintingType>
        <letter>
          <service>
            <productCode>DOM</productCode>
            <depositDate>${new Date().toISOString().slice(0, 10)}</depositDate>
            <orderNumber>${input.orderId}</orderNumber>
          </service>
          <parcel>
            <weight>${(weight / 1000).toFixed(2)}</weight>
          </parcel>
          <addressee>
            <address>
              <lastName>${escapeXml(lastName)}</lastName>
              <firstName>${escapeXml(firstName)}</firstName>
              <line2>${escapeXml(input.recipient.line1)}</line2>
              <countryCode>${escapeXml(input.recipient.country || "FR")}</countryCode>
              <city>${escapeXml(input.recipient.city)}</city>
              <zipCode>${escapeXml(input.recipient.postalCode)}</zipCode>
              <email>${escapeXml(input.recipient.email ?? "")}</email>
              <phoneNumber>${escapeXml(input.recipient.phone ?? "")}</phoneNumber>
            </address>
          </addressee>
        </letter>
      </generateLabelRequest>
    </sls:generateLabel>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "",
    },
    body: soapBody,
  });

  if (!response.ok) {
    throw new Error(`La Poste label error (${response.status})`);
  }

  const xml = await response.text();
  const trackingNumber =
    extractXmlTag(xml, "parcelNumber") ??
    extractXmlTag(xml, "parcelNumberPartner") ??
    buildMockLabel(input).trackingNumber;
  const labelBase64 = extractXmlTag(xml, "label") ?? null;

  return {
    carrier: "laposte",
    trackingNumber,
    labelUrl: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
    labelBase64,
    rawStatus: "label_created",
  };
}

/**
 * Récupère le statut de suivi La Poste à partir d'un numéro de colis / commande.
 * À appeler depuis la page compte (via route API serveur).
 */
export async function getLaPosteTracking(
  trackingNumber: string,
): Promise<TrackingResult> {
  const config = getTrackingConfig();

  if (!config.apiKey) {
    return {
      carrier: "laposte",
      trackingNumber,
      status: "in_transit",
      statusLabel: "En cours d'acheminement (mode démo)",
      events: [
        {
          date: new Date().toISOString(),
          code: "DEMO",
          label: "Suivi démo — configure LAPOSTE_API_KEY pour le suivi réel",
        },
      ],
    };
  }

  const response = await fetch(
    `${config.url}/${encodeURIComponent(trackingNumber)}?lang=fr_FR`,
    {
      headers: {
        Accept: "application/json",
        "X-Okapi-Key": config.apiKey,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`La Poste tracking error (${response.status})`);
  }

  const json = (await response.json()) as {
    returnCode?: number;
    status?: string;
    statusLabel?: string;
    event?: Array<{
      code?: string;
      label?: string;
      date?: string;
      order?: number;
    }>;
    shipment?: {
      event?: Array<{
        code?: string;
        label?: string;
        date?: string;
      }>;
      status?: string;
      statusLabel?: string;
    };
  };

  const eventsSource = json.shipment?.event ?? json.event ?? [];
  const events: TrackingEvent[] = eventsSource.map((event) => ({
    date: event.date ?? new Date().toISOString(),
    code: event.code ?? "UNK",
    label: event.label ?? "Mise à jour",
  }));

  const latestCode =
    events[0]?.code ?? json.shipment?.status ?? json.status ?? "TRANSIT";

  return {
    carrier: "laposte",
    trackingNumber,
    status: mapCarrierStatusToShippingStatus("laposte", latestCode),
    statusLabel:
      json.shipment?.statusLabel ??
      json.statusLabel ??
      events[0]?.label ??
      "Statut inconnu",
    events,
  };
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function extractXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim() || null;
}
