/**
 * Connecteur La Poste / Colissimo — point d'entrée historique.
 *
 * Étiquette et suivi vivent désormais entièrement dans colissimo.ts (API
 * REST SLS + Web Service TL Tracking, même clé COLISSIMO_API_KEY) ; ce
 * fichier ne fait que réexporter sous les noms attendus par les appelants
 * existants (container, create-order-label.ts) pour éviter de les modifier.
 */

export { createColissimoLabel as createLaPosteLabel } from "@/lib/infrastructure/shipping/colissimo";
export { getColissimoTracking as getLaPosteTracking } from "@/lib/infrastructure/shipping/colissimo";
