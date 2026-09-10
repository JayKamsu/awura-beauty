/** Déclaration de rétractation en ligne (art. D221-5 du Code de la consommation). */
export type WithdrawalDeclaration = {
  firstName: string;
  lastName: string;
  /** Référence permettant d'identifier le contrat (n° de commande). */
  orderRef: string;
  /** Date de commande ou de réception, telle que saisie par le consommateur. */
  orderDate: string;
  /** Produits / contrat concernés. */
  contractDetails: string;
  /** Moyen électronique pour l'accusé de réception. */
  ackEmail: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clip(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

/**
 * Valide et normalise une déclaration de rétractation envoyée depuis le formulaire
 * en ligne. Retourne null si un champ obligatoire est manquant ou invalide.
 */
export function parseWithdrawalInput(body: unknown): WithdrawalDeclaration | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  const firstName = clip(raw.firstName, 80);
  const lastName = clip(raw.lastName, 80);
  const orderRef = clip(raw.orderRef, 80);
  const orderDate = clip(raw.orderDate, 40);
  const contractDetails = clip(raw.contractDetails, 2000);
  const ackEmail = clip(raw.ackEmail, 120).toLowerCase();

  if (firstName.length < 1 || lastName.length < 1) return null;
  if (orderRef.length < 2 || contractDetails.length < 2) return null;
  if (!EMAIL_RE.test(ackEmail)) return null;

  return {
    firstName,
    lastName,
    orderRef,
    orderDate,
    contractDetails,
    ackEmail,
  };
}
