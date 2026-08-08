/**
 * Connecteur Mondial Relay
 *
 * - createMondialRelayLabel : génération d'étiquette (espace admin uniquement)
 * - getMondialRelayTracking : suivi colis (page compte client)
 *
 * Env attendues :
 * - MONDIAL_RELAY_ENSEIGNE
 * - MONDIAL_RELAY_PRIVATE_KEY
 * - MONDIAL_RELAY_BRAND_CODE (optionnel, défaut: 11 = FR)
 * - MONDIAL_RELAY_WSDL_URL (optionnel)
 */

import { createHash } from "node:crypto";
import type { RelayPoint } from "@/lib/domain/shipping";
import {
  mapCarrierStatusToShippingStatus,
  type CreateShippingLabelInput,
  type CreateShippingLabelResult,
  type TrackingEvent,
  type TrackingResult,
} from "@/lib/infrastructure/shipping/types";

function getConfig() {
  const enseigneRaw = (process.env.MONDIAL_RELAY_ENSEIGNE ?? "").trim();
  // Enseigne MR = 8 caractères (padding espaces à droite si besoin)
  const enseigne = enseigneRaw
    ? enseigneRaw.toUpperCase().padEnd(8, " ").slice(0, 8)
    : "";
  return {
    enseigne,
    privateKey: (process.env.MONDIAL_RELAY_PRIVATE_KEY ?? "").trim(),
    brandCode: (process.env.MONDIAL_RELAY_BRAND_CODE ?? "11").trim(),
    wsdlUrl:
      process.env.MONDIAL_RELAY_WSDL_URL?.trim() ||
      "https://api.mondialrelay.com/WebService.asmx",
  };
}

function md5(value: string) {
  return createHash("md5").update(value, "utf8").digest("hex").toUpperCase();
}

/** Message lisible pour les codes STAT Mondial Relay. */
export function mondialRelayStatMessage(stat: string): string {
  const messages: Record<string, string> = {
    "97": "Clé de sécurité invalide (vérifie enseigne / clé privée / signature)",
    "95": "Compte marchand non activé",
    "92": "Enseigne invalide",
    "93": "Code postal introuvable",
    "80": "Colis enregistré",
  };
  return messages[stat] ?? `Erreur Mondial Relay (STAT=${stat})`;
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
  const trackingNumber = `MR${input.orderId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  return {
    carrier: "mondial_relay",
    trackingNumber,
    labelUrl: `https://www.mondialrelay.fr/suivi-de-colis/?codeParcel=${trackingNumber}`,
    labelBase64: null,
    rawStatus: "mock_label_created",
  };
}

/**
 * Crée une étiquette Mondial Relay (WSI2_CreationEtiquette).
 * À appeler uniquement depuis l'espace admin (via route API serveur).
 */
export async function createMondialRelayLabel(
  input: CreateShippingLabelInput,
): Promise<CreateShippingLabelResult> {
  const config = getConfig();

  if (!config.enseigne || !config.privateKey) {
    return buildMockLabel(input);
  }

  if (!input.relayPointId) {
    throw new Error("Mondial Relay requires relayPointId");
  }

  const { firstName, lastName } = splitName(input.recipient.fullName);
  const weight = String(input.weightGrams ?? 500);
  const lang = "FR";
  const modeLiv = "24R";
  const modeCol = "CCC";
  const nacion = (input.recipient.country || "FR").toUpperCase();

  // Signature MR : concaténation des champs + clé privée, puis MD5
  const security = md5(
    [
      config.enseigne,
      modeCol,
      modeLiv,
      "",
      "",
      weight,
      "",
      "",
      nacion,
      "",
      lastName,
      firstName,
      input.recipient.line1,
      "",
      input.recipient.city,
      input.recipient.postalCode,
      nacion,
      input.recipient.phone ?? "",
      input.recipient.email ?? "",
      input.orderId.slice(0, 15),
      "",
      input.relayPointId,
      lang,
      config.privateKey,
    ].join(""),
  );

  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI2_CreationEtiquette xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${escapeXml(config.enseigne)}</Enseigne>
      <ModeCol>${modeCol}</ModeCol>
      <ModeLiv>${modeLiv}</ModeLiv>
      <NDossier>${escapeXml(input.orderId.slice(0, 15))}</NDossier>
      <NClient></NClient>
      <Expe_Langage>${lang}</Expe_Langage>
      <Expe_Ad1>${escapeXml(lastName)}</Expe_Ad1>
      <Expe_Ad2></Expe_Ad2>
      <Expe_Ad3>${escapeXml(process.env.MONDIAL_RELAY_SENDER_ADDRESS ?? "Awura Beauty")}</Expe_Ad3>
      <Expe_Ad4></Expe_Ad4>
      <Expe_Ville>${escapeXml(process.env.MONDIAL_RELAY_SENDER_CITY ?? "Paris")}</Expe_Ville>
      <Expe_CP>${escapeXml(process.env.MONDIAL_RELAY_SENDER_CP ?? "75001")}</Expe_CP>
      <Expe_Pays>FR</Expe_Pays>
      <Expe_Tel1>${escapeXml(process.env.MONDIAL_RELAY_SENDER_PHONE ?? "")}</Expe_Tel1>
      <Expe_Tel2></Expe_Tel2>
      <Expe_Mail>${escapeXml(process.env.MONDIAL_RELAY_SENDER_EMAIL ?? "")}</Expe_Mail>
      <Dest_Langage>${lang}</Dest_Langage>
      <Dest_Ad1>${escapeXml(lastName)}</Dest_Ad1>
      <Dest_Ad2>${escapeXml(firstName)}</Dest_Ad2>
      <Dest_Ad3>${escapeXml(input.recipient.line1)}</Dest_Ad3>
      <Dest_Ad4></Dest_Ad4>
      <Dest_Ville>${escapeXml(input.recipient.city)}</Dest_Ville>
      <Dest_CP>${escapeXml(input.recipient.postalCode)}</Dest_CP>
      <Dest_Pays>${escapeXml(nacion)}</Dest_Pays>
      <Dest_Tel1>${escapeXml(input.recipient.phone ?? "")}</Dest_Tel1>
      <Dest_Tel2></Dest_Tel2>
      <Dest_Mail>${escapeXml(input.recipient.email ?? "")}</Dest_Mail>
      <Poids>${weight}</Poids>
      <Longueur></Longueur>
      <Taille></Taille>
      <NbColis>1</NbColis>
      <CRT_Valeur>0</CRT_Valeur>
      <CRT_Devise></CRT_Devise>
      <Exp_Valeur>0</Exp_Valeur>
      <Exp_Devise></Exp_Devise>
      <COL_Rel_Pays>${escapeXml(nacion)}</COL_Rel_Pays>
      <COL_Rel>${escapeXml(input.relayPointId)}</COL_Rel>
      <LIV_Rel_Pays>${escapeXml(nacion)}</LIV_Rel_Pays>
      <LIV_Rel>${escapeXml(input.relayPointId)}</LIV_Rel>
      <TAvisage></TAvisage>
      <TReprise></TReprise>
      <Montage></Montage>
      <TRDomaines></TRDomaines>
      <Assurance></Assurance>
      <Instructions></Instructions>
      <Security>${security}</Security>
      <Texte></Texte>
    </WSI2_CreationEtiquette>
  </soap:Body>
</soap:Envelope>`;

  const response = await fetch(config.wsdlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "http://www.mondialrelay.fr/webservice/WSI2_CreationEtiquette",
    },
    body: soapBody,
  });

  if (!response.ok) {
    throw new Error(`Mondial Relay label error (${response.status})`);
  }

  const xml = await response.text();
  const stat = extractXmlTag(xml, "STAT");
  if (stat && stat !== "0") {
    throw new Error(`Mondial Relay rejected label (STAT=${stat})`);
  }

  const trackingNumber =
    extractXmlTag(xml, "ExpeditionNum") ??
    buildMockLabel(input).trackingNumber;
  const labelUrlRaw = extractXmlTag(xml, "URL_Etiquette");

  return {
    carrier: "mondial_relay",
    trackingNumber,
    labelUrl: labelUrlRaw
      ? labelUrlRaw.startsWith("http")
        ? labelUrlRaw
        : `https://www.mondialrelay.com${labelUrlRaw}`
      : `https://www.mondialrelay.fr/suivi-de-colis/?codeParcel=${trackingNumber}`,
    labelBase64: null,
    rawStatus: `STAT=${stat ?? "0"}`,
  };
}

/**
 * Recherche Points Relais (WSI4_PointRelais_Recherche) autour d’un CP.
 */
export async function searchMondialRelayPoints(input: {
  postalCode: string;
  city?: string;
  country?: string;
  limit?: number;
}): Promise<{ points: RelayPoint[]; error: string | null }> {
  const postalCode = input.postalCode.replace(/\s+/g, "").trim();
  if (!/^\d{4,5}$/.test(postalCode)) {
    return { points: [], error: "Invalid postal code" };
  }

  const config = getConfig();
  const country = (input.country || "FR").toUpperCase().slice(0, 2);
  // Recherche par CP uniquement : plus fiable (évite écarts d’encodage ville / accents)
  const city = "";
  const limit = String(Math.min(Math.max(input.limit ?? 12, 1), 30));

  if (!config.enseigne || !config.privateKey) {
    return {
      points: buildMockRelayPoints(
        postalCode,
        (input.city ?? "").trim() || "Ville",
        country,
      ),
      error: null,
    };
  }

  const lang = "FR";
  const rayon = "20";
  const delaiEnvoi = "0";
  /**
   * Signature officielle WSI4 (sans NACE ni Langue) :
   * Enseigne + Pays + NumPointRelais + Ville + CP + Latitude + Longitude +
   * Taille + Poids + Action + DelaiEnvoi + RayonRecherche + TypeActivite +
   * NombreResultats + CLE_PRIVEE
   */
  const security = md5(
    [
      config.enseigne,
      country,
      "", // NumPointRelais
      city,
      postalCode,
      "", // Latitude
      "", // Longitude
      "", // Taille
      "", // Poids
      "", // Action
      delaiEnvoi,
      rayon,
      "", // TypeActivite
      limit,
      config.privateKey,
    ].join(""),
  );

  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${escapeXml(config.enseigne)}</Enseigne>
      <Pays>${escapeXml(country)}</Pays>
      <NumPointRelais></NumPointRelais>
      <Ville></Ville>
      <CP>${escapeXml(postalCode)}</CP>
      <Latitude></Latitude>
      <Longitude></Longitude>
      <Taille></Taille>
      <Poids></Poids>
      <Action></Action>
      <DelaiEnvoi>${delaiEnvoi}</DelaiEnvoi>
      <RayonRecherche>${rayon}</RayonRecherche>
      <TypeActivite></TypeActivite>
      <NombreResultats>${limit}</NombreResultats>
      <Security>${security}</Security>
    </WSI4_PointRelais_Recherche>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await fetch(config.wsdlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction:
          "http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche",
      },
      body: soapBody,
    });

    if (!response.ok) {
      return {
        points: [],
        error: `Mondial Relay search error (${response.status})`,
      };
    }

    const xml = await response.text();
    const stat = extractXmlTag(xml, "STAT");
    if (stat && stat !== "0") {
      return {
        points: [],
        error: mondialRelayStatMessage(stat),
      };
    }

    const points = parseRelayPointsFromXml(xml, country);
    return { points, error: null };
  } catch (error) {
    return {
      points: [],
      error:
        error instanceof Error ? error.message : "Unable to search relay points",
    };
  }
}

function buildMockRelayPoints(
  postalCode: string,
  city: string,
  country: string,
): RelayPoint[] {
  return [
    {
      id: "00001",
      name: "Point Relais Démo Centre",
      address: "12 rue de la Beauté",
      postalCode,
      city,
      country,
      distanceKm: 0.4,
    },
    {
      id: "00002",
      name: "Point Relais Démo Marché",
      address: "5 avenue des Capucines",
      postalCode,
      city,
      country,
      distanceKm: 1.2,
    },
    {
      id: "00003",
      name: "Point Relais Démo Gare",
      address: "1 place de la Gare",
      postalCode,
      city,
      country,
      distanceKm: 2.1,
    },
  ];
}

function parseRelayPointsFromXml(xml: string, country: string): RelayPoint[] {
  const blocks =
    xml.match(/<(?:ns:)?PointRelais_Details>[\s\S]*?<\/(?:ns:)?PointRelais_Details>/gi) ??
    xml.match(/<PointRelais_Details>[\s\S]*?<\/PointRelais_Details>/gi) ??
    [];

  const points: RelayPoint[] = [];
  for (const block of blocks) {
    const id = extractXmlTag(block, "Num") ?? extractXmlTag(block, "Number");
    if (!id) continue;
    const name =
      extractXmlTag(block, "LgAdr1") ??
      extractXmlTag(block, "Nom") ??
      `Point Relais ${id}`;
    const address =
      extractXmlTag(block, "LgAdr3") ??
      extractXmlTag(block, "LgAdr2") ??
      "";
    const city = extractXmlTag(block, "Ville") ?? "";
    const postalCode = extractXmlTag(block, "CP") ?? "";
    const distanceRaw = extractXmlTag(block, "Distance");
    const latRaw = extractXmlTag(block, "Latitude");
    const lngRaw = extractXmlTag(block, "Longitude");
    const distanceKm = distanceRaw
      ? Number(distanceRaw.replace(",", ".")) / 1000
      : null;

    points.push({
      id: id.trim(),
      name: name.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
      city: city.trim(),
      country,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
      lat: latRaw ? Number(latRaw.replace(",", ".")) : null,
      lng: lngRaw ? Number(lngRaw.replace(",", ".")) : null,
    });
  }

  return points;
}

/**
 * Suivi Mondial Relay (WSI2_TracingColisDetaille).
 * À appeler depuis la page compte (via route API serveur).
 */
export async function getMondialRelayTracking(
  trackingNumber: string,
): Promise<TrackingResult> {
  const config = getConfig();

  if (!config.enseigne || !config.privateKey) {
    return {
      carrier: "mondial_relay",
      trackingNumber,
      status: "in_transit",
      statusLabel: "En cours d'acheminement (mode démo)",
      events: [
        {
          date: new Date().toISOString(),
          code: "DEMO",
          label:
            "Suivi démo — configure MONDIAL_RELAY_ENSEIGNE / PRIVATE_KEY pour le suivi réel",
        },
      ],
    };
  }

  const lang = "FR";
  const security = md5(
    [config.enseigne, trackingNumber, lang, config.privateKey].join(""),
  );

  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI2_TracingColisDetaille xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${escapeXml(config.enseigne)}</Enseigne>
      <Expedition>${escapeXml(trackingNumber)}</Expedition>
      <Langue>${lang}</Langue>
      <Security>${security}</Security>
    </WSI2_TracingColisDetaille>
  </soap:Body>
</soap:Envelope>`;

  const response = await fetch(config.wsdlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction:
        "http://www.mondialrelay.fr/webservice/WSI2_TracingColisDetaille",
    },
    body: soapBody,
  });

  if (!response.ok) {
    throw new Error(`Mondial Relay tracking error (${response.status})`);
  }

  const xml = await response.text();
  const events: TrackingEvent[] = [];
  const tracingBlocks = xml.match(/<Tracing>[\s\S]*?<\/Tracing>/gi) ?? [];

  for (const block of tracingBlocks) {
    events.push({
      date: extractXmlTag(block, "Date") ?? new Date().toISOString(),
      code: extractXmlTag(block, "Code") ?? "UNK",
      label: extractXmlTag(block, "Libelle") ?? "Mise à jour",
      location: extractXmlTag(block, "Relais_Libelle") ?? undefined,
    });
  }

  const latestCode = events[0]?.code ?? "80";

  return {
    carrier: "mondial_relay",
    trackingNumber,
    status: mapCarrierStatusToShippingStatus("mondial_relay", latestCode),
    statusLabel: events[0]?.label ?? "Statut inconnu",
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
