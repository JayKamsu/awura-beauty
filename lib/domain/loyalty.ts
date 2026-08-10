/** Constantes + helpers purs — programme fidélité / parrainage. */

export const POINTS_PER_EURO = 1;
/** Palier minimum pour utiliser des points. */
export const REDEEM_STEP_POINTS = 100;
/** Valeur d’un palier en euros. */
export const REDEEM_STEP_EURO = 5;
/** % de réduction 1re commande filleul (sous-total produits). */
export const REFERRAL_FIRST_ORDER_PERCENT = 10;
export const REFERRAL_REFERRER_BONUS = 200;
export const REFERRAL_REFEREE_BONUS = 100;

/** Motif d'un mouvement de points fidélité (historique/audit). */
export type LoyaltyReason =
  | "order_earn"
  | "order_redeem"
  | "referral_referrer"
  | "referral_referee"
  | "admin_adjust";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/** Points gagnés sur un sous-total produits (hors livraison), arrondi inférieur. */
export function pointsFromSubtotal(productSubtotal: number): number {
  const base = Math.max(0, productSubtotal);
  return Math.floor(base * POINTS_PER_EURO);
}

/** Montant € pour un nombre de points (paliers complets uniquement). */
export function discountFromPoints(points: number): number {
  const steps = Math.floor(Math.max(0, points) / REDEEM_STEP_POINTS);
  return roundMoney(steps * REDEEM_STEP_EURO);
}

/**
 * Borne les points utilisables : paliers de 100, ≤ solde, ≤ plafond sous-total.
 */
export function clampRedeemablePoints(input: {
  requestedPoints: number;
  balance: number;
  productSubtotalAfterReferral: number;
}): number {
  const maxByBalance =
    Math.floor(Math.max(0, input.balance) / REDEEM_STEP_POINTS) *
    REDEEM_STEP_POINTS;
  const maxEuro = Math.max(0, input.productSubtotalAfterReferral);
  const maxBySubtotal =
    Math.floor(maxEuro / REDEEM_STEP_EURO) * REDEEM_STEP_POINTS;

  const requested =
    Math.floor(Math.max(0, input.requestedPoints) / REDEEM_STEP_POINTS) *
    REDEEM_STEP_POINTS;

  return Math.min(requested, maxByBalance, maxBySubtotal);
}

/** Remise de bienvenue (% sous-total) sur la 1re commande d'un filleul. */
export function firstOrderDiscountAmount(productSubtotal: number): number {
  return roundMoney(
    Math.max(0, productSubtotal) * (REFERRAL_FIRST_ORDER_PERCENT / 100),
  );
}

/** Calcule remise totale et total final d'une commande (parrainage + points cumulés, jamais négatifs). */
export function buildOrderTotals(input: {
  productSubtotal: number;
  shippingFee: number;
  referralDiscount: number;
  pointsDiscount: number;
}): {
  discountAmount: number;
  total: number;
} {
  const discountAmount = roundMoney(
    Math.max(0, input.referralDiscount) + Math.max(0, input.pointsDiscount),
  );
  const afterDiscount = Math.max(
    0,
    roundMoney(input.productSubtotal - discountAmount),
  );
  return {
    discountAmount,
    total: roundMoney(afterDiscount + Math.max(0, input.shippingFee)),
  };
}
