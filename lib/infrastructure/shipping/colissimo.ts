/**
 * Connecteur Colissimo — Web Service SLS REST (v3.1), authentification apikey.
 * Doc : https://www.colissimo.fr/doc-colissimo/redoc-sls/fr (spec OpenAPI :
 * https://www.colissimo.fr/doc-colissimo/yaml/fr), à jour juin 2026.
 *
 * L'ancienne intégration SOAP + login/password est obsolète chez Colissimo ;
 * l'auth se fait désormais uniquement via le header `apiKey`.
 *
 * Important (constaté en usage réel, différent de la doc REST) : generateLabel
 * répond en multipart/related MTOM — une partie JSON (`labelV31Response`,
 * `pdfUrl` toujours null en pratique) suivie d'une partie `application/pdf`
 * brute contenant l'étiquette. On extrait cette partie binaire directement
 * plutôt que de suivre `pdfUrl` (jamais renseigné).
 *
 * Une seule clé Colissimo Entreprise couvre les deux services ci-dessous
 * (étiquette + suivi) — pas besoin de l'API Suivi Okapi séparée une fois le
 * contrat activé.
 *
 * Env attendues :
 * - COLISSIMO_API_KEY (authentification — remplace login/password)
 * - COLISSIMO_CONTRACT_NUMBER (requis par le suivi TL en tant que `login`,
 *   voir createColissimoTracking ; non requis par generateLabel)
 * - COLISSIMO_SLS_URL (optionnel, défaut = URL prod SLS REST 3.1)
 * - COLISSIMO_TRACKING_URL (optionnel, défaut = URL prod TL Tracking REST)
 * - Expéditeur fixe (boutique) : SHIPPING_SENDER_NAME, SHIPPING_SENDER_LINE1,
 *   SHIPPING_SENDER_CITY, SHIPPING_SENDER_ZIP, SHIPPING_SENDER_COUNTRY (déf. FR),
 *   SHIPPING_SENDER_PHONE, SHIPPING_SENDER_EMAIL
 */

import {
  mapCarrierStatusToShippingStatus,
  type CreateShippingLabelInput,
  type CreateShippingLabelResult,
  type TrackingEvent,
  type TrackingResult,
} from "@/lib/infrastructure/shipping/types";

function getConfig() {
  return {
    apiKey: (process.env.COLISSIMO_API_KEY ?? "").trim(),
    contractNumber: (process.env.COLISSIMO_CONTRACT_NUMBER ?? "").trim(),
    url:
      process.env.COLISSIMO_SLS_URL?.trim() ||
      "https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/3.1/generateLabel",
    trackingUrl:
      process.env.COLISSIMO_TRACKING_URL?.trim() ||
      "https://ws.colissimo.fr/tracking-timeline-ws/rest/tracking/timelineCompany",
  };
}

function getSenderAddress() {
  return {
    name: (process.env.SHIPPING_SENDER_NAME ?? "").trim(),
    line1: (process.env.SHIPPING_SENDER_LINE1 ?? "").trim(),
    city: (process.env.SHIPPING_SENDER_CITY ?? "").trim(),
    zipCode: (process.env.SHIPPING_SENDER_ZIP ?? "").trim(),
    country: (process.env.SHIPPING_SENDER_COUNTRY ?? "FR").trim(),
    phone: (process.env.SHIPPING_SENDER_PHONE ?? "").trim(),
    email: (process.env.SHIPPING_SENDER_EMAIL ?? "").trim(),
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

type ColissimoMessage = {
  id?: string;
  type?: string;
  messageContent?: string;
};

type GenerateLabelResponse = {
  messages?: ColissimoMessage[];
  parcelNumber?: string;
  parcelNumberPartner?: string;
  labelV31Response?: {
    parcelNumber?: string;
    parcelNumberPartner?: string;
    pdfUrl?: string | null;
  };
  labelV2Response?: {
    parcelNumber?: string;
    parcelNumberPartner?: string;
    pdfUrl?: string | null;
  };
};

/** Une partie d'une réponse multipart/related (MTOM) : ses headers et son corps en bytes bruts. */
type MultipartSection = { headers: Record<string, string>; body: Buffer };

/**
 * Découpe une réponse multipart/related (MTOM/XOP) en sections, en travaillant
 * sur les bytes bruts — nécessaire car une section (le PDF) est binaire et
 * serait corrompue par un décodage texte intermédiaire.
 */
function splitMultipart(buffer: Buffer, boundary: string): MultipartSection[] {
  const boundaryMarker = Buffer.from(`--${boundary}`);
  const sections: MultipartSection[] = [];
  let searchStart = 0;

  while (true) {
    const start = buffer.indexOf(boundaryMarker, searchStart);
    if (start === -1) break;
    const partStart = start + boundaryMarker.length;
    const nextBoundary = buffer.indexOf(boundaryMarker, partStart);
    if (nextBoundary === -1) break;

    const partBuffer = buffer.subarray(partStart, nextBoundary);
    const headerEnd = partBuffer.indexOf("\r\n\r\n");
    if (headerEnd !== -1) {
      const headerText = partBuffer.subarray(0, headerEnd).toString("utf8");
      const bodyStart = headerEnd + 4;
      // Retire le \r\n final précédant le prochain boundary.
      const bodyEnd = partBuffer.subarray(bodyStart).lastIndexOf("\r\n--");
      const body = partBuffer.subarray(
        bodyStart,
        bodyEnd === -1 ? partBuffer.length : bodyStart + bodyEnd,
      );

      const headers: Record<string, string> = {};
      for (const line of headerText.split("\r\n")) {
        const sep = line.indexOf(":");
        if (sep === -1) continue;
        headers[line.slice(0, sep).trim().toLowerCase()] = line
          .slice(sep + 1)
          .trim();
      }

      sections.push({ headers, body });
    }

    searchStart = nextBoundary;
  }

  return sections;
}

/** Extrait le boundary d'un header Content-Type multipart/related. */
function extractBoundary(contentType: string | null): string | null {
  if (!contentType) return null;
  const match = contentType.match(/boundary="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

/**
 * Génère une étiquette Colissimo Domicile (productCode DOM) via l'API REST SLS.
 * La réponse est multipart/related (MTOM) : une partie JSON + une partie PDF
 * brute (`application/pdf` ou `application/octet-stream`) — cf. commentaire
 * d'en-tête. Le PDF est extrait directement, jamais via `pdfUrl` (toujours null).
 * À appeler uniquement depuis l'espace admin (via route API serveur).
 */
export async function createColissimoLabel(
  input: CreateShippingLabelInput,
): Promise<CreateShippingLabelResult> {
  const config = getConfig();

  if (!config.apiKey) {
    return buildMockLabel(input);
  }

  const sender = getSenderAddress();
  if (!sender.name || !sender.line1 || !sender.city || !sender.zipCode) {
    throw new Error(
      "Colissimo sender address is not configured (SHIPPING_SENDER_* env vars)",
    );
  }

  const { firstName, lastName } = splitName(input.recipient.fullName);
  const weightKg = Math.max(0.01, (input.weightGrams ?? 500) / 1000);

  const body = {
    outputFormat: {
      x: 0,
      y: 0,
      outputPrintingType: "PDF_A4_300dpi",
    },
    letter: {
      service: {
        productCode: "DOM",
        depositDate: new Date().toISOString().slice(0, 10),
        orderNumber: input.orderId,
        commercialName: sender.name,
      },
      parcel: {
        weight: Math.round(weightKg * 100) / 100,
      },
      sender: {
        senderParcelRef: input.orderId.slice(0, 17),
        address: {
          companyName: sender.name,
          line2: sender.line1,
          countryCode: sender.country || "FR",
          city: sender.city,
          zipCode: sender.zipCode,
          phoneNumber: sender.phone || undefined,
          email: sender.email || undefined,
        },
      },
      addressee: {
        addresseeParcelRef: input.orderId.slice(0, 17),
        address: {
          lastName,
          firstName,
          line2: input.recipient.line1,
          countryCode: input.recipient.country || "FR",
          city: input.recipient.city,
          zipCode: input.recipient.postalCode,
          phoneNumber: input.recipient.phone || undefined,
          email: input.recipient.email || undefined,
        },
      },
    },
  };

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      apiKey: config.apiKey,
    },
    body: JSON.stringify(body),
  });

  const rawBuffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type");
  const boundary = extractBoundary(contentType);

  let json: GenerateLabelResponse = {};
  let pdfBytes: Buffer | null = null;

  if (boundary) {
    const sections = splitMultipart(rawBuffer, boundary);
    for (const section of sections) {
      const sectionType = section.headers["content-type"] ?? "";
      if (sectionType.includes("json")) {
        try {
          json = JSON.parse(section.body.toString("utf8")) as GenerateLabelResponse;
        } catch {
          // Section JSON illisible — on retente via le corps complet plus bas.
        }
      } else if (
        sectionType.includes("pdf") ||
        sectionType.includes("octet-stream")
      ) {
        pdfBytes = section.body;
      }
    }
  } else {
    // Pas de multipart (ex. réponse d'erreur simple) : JSON direct.
    try {
      json = rawBuffer.length
        ? (JSON.parse(rawBuffer.toString("utf8")) as GenerateLabelResponse)
        : {};
    } catch {
      throw new Error(
        `Colissimo label error (${response.status}): réponse illisible`,
      );
    }
  }

  if (!response.ok) {
    const message =
      json.messages?.map((m) => m.messageContent).filter(Boolean).join(" ; ") ||
      `Colissimo label error (${response.status})`;
    throw new Error(message);
  }

  const parcelNumber =
    json.labelV31Response?.parcelNumber ??
    json.labelV2Response?.parcelNumber ??
    json.parcelNumber ??
    buildMockLabel(input).trackingNumber;

  const labelBase64 = pdfBytes ? pdfBytes.toString("base64") : null;

  return {
    carrier: "laposte",
    trackingNumber: parcelNumber,
    labelUrl: null,
    labelBase64,
    rawStatus: "label_created",
  };
}

type TimelineStep = {
  stepId?: number;
  labelShort?: string | null;
  labelLong?: string | null;
  status?: string;
  date?: string | null;
};

type TimelineEvent = {
  date?: string;
  code?: string;
  labelLong?: string;
};

type TimelineCompanyResponse = {
  status?: ColissimoMessage[] | { code?: string; message?: string }[];
  parcel?: {
    parcelNumber?: string;
    step?: TimelineStep[];
    event?: TimelineEvent[];
  };
};

/** Étape TL active la plus avancée (le plus grand stepId avec status ACTIVE) — reflète la progression réelle du colis. */
function latestActiveStep(steps: TimelineStep[] | undefined): TimelineStep | null {
  if (!steps?.length) return null;
  const active = steps.filter((s) => s.status === "STEP_STATUS_ACTIVE");
  if (!active.length) return null;
  return active.reduce((latest, step) =>
    (step.stepId ?? -1) > (latest.stepId ?? -1) ? step : latest,
  );
}

/** stepId TL (0 Notification → 5 Livré) vers le statut d'expédition interne. */
function stepIdToShippingStatus(stepId: number | undefined) {
  if (stepId === undefined) return mapCarrierStatusToShippingStatus("laposte", "");
  if (stepId >= 5) return "delivered" as const;
  if (stepId >= 3) return "in_transit" as const;
  if (stepId >= 1) return "shipped" as const;
  return "preparing" as const;
}

/**
 * Suivi Colissimo via le Web Service TL (timelineCompany) — même clé/contrat
 * que la génération d'étiquette (COLISSIMO_API_KEY + COLISSIMO_CONTRACT_NUMBER
 * en tant que `login`). Remplace l'ancienne intégration Okapi.
 */
export async function getColissimoTracking(
  trackingNumber: string,
): Promise<TrackingResult> {
  const config = getConfig();

  if (!config.apiKey || !config.contractNumber) {
    return {
      carrier: "laposte",
      trackingNumber,
      status: "in_transit",
      statusLabel: "En cours d'acheminement (mode démo)",
      events: [
        {
          date: new Date().toISOString(),
          code: "DEMO",
          label:
            "Suivi démo — configure COLISSIMO_API_KEY et COLISSIMO_CONTRACT_NUMBER pour le suivi réel",
        },
      ],
    };
  }

  const response = await fetch(config.trackingUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      login: config.contractNumber,
      apiKey: config.apiKey,
      parcelNumber: trackingNumber,
      lang: "fr_FR",
    }),
  });

  if (!response.ok) {
    throw new Error(`Colissimo tracking error (${response.status})`);
  }

  const json = (await response.json()) as TimelineCompanyResponse;

  const events: TrackingEvent[] = (json.parcel?.event ?? []).map((event) => ({
    date: event.date ?? new Date().toISOString(),
    code: event.code ?? "UNK",
    label: event.labelLong ?? "Mise à jour",
  }));

  const step = latestActiveStep(json.parcel?.step);
  const status = stepIdToShippingStatus(step?.stepId);
  const statusLabel =
    step?.labelShort || events[0]?.label || "Statut inconnu";

  return {
    carrier: "laposte",
    trackingNumber,
    status,
    statusLabel,
    events,
  };
}
