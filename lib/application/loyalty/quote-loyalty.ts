import {
  buildOrderTotals,
  clampRedeemablePoints,
  discountFromPoints,
  firstOrderDiscountAmount,
  pointsFromSubtotal,
  REFERRAL_FIRST_ORDER_PERCENT,
} from "@/lib/domain/loyalty";
import {
  getLoyaltyProfile,
  userHasPaidOrder,
} from "@/lib/infrastructure/supabase/loyalty";

/** Résultat du calcul des réductions (parrainage + points) et totaux appliqués à un panier. */
export type LoyaltyQuote = {
  balance: number;
  referralEligible: boolean;
  referralDiscount: number;
  referralPercent: number;
  pointsRedeemed: number;
  pointsDiscount: number;
  pointsToEarn: number;
  discountAmount: number;
  productSubtotalAfterDiscounts: number;
  total: number;
  maxRedeemablePoints: number;
};

/**
 * Calcule réductions parrainage + points pour un panier connecté.
 */
export async function quoteLoyalty(input: {
  userId: string | null | undefined;
  productSubtotal: number;
  shippingFee: number;
  /** Points demandés (seront bornés). */
  pointsToRedeem?: number;
}): Promise<LoyaltyQuote> {
  const productSubtotal = Math.max(0, input.productSubtotal);
  const shippingFee = Math.max(0, input.shippingFee);

  if (!input.userId) {
    const totals = buildOrderTotals({
      productSubtotal,
      shippingFee,
      referralDiscount: 0,
      pointsDiscount: 0,
    });
    return {
      balance: 0,
      referralEligible: false,
      referralDiscount: 0,
      referralPercent: REFERRAL_FIRST_ORDER_PERCENT,
      pointsRedeemed: 0,
      pointsDiscount: 0,
      pointsToEarn: 0,
      discountAmount: 0,
      productSubtotalAfterDiscounts: productSubtotal,
      total: totals.total,
      maxRedeemablePoints: 0,
    };
  }

  const profile = await getLoyaltyProfile(input.userId);
  const balance = profile?.loyalty_points ?? 0;
  const hasPaid = await userHasPaidOrder(input.userId);
  const referralEligible = Boolean(profile?.referred_by) && !hasPaid;
  const referralDiscount = referralEligible
    ? firstOrderDiscountAmount(productSubtotal)
    : 0;

  const afterReferral = Math.max(0, productSubtotal - referralDiscount);
  const maxRedeemablePoints = clampRedeemablePoints({
    requestedPoints: Number.MAX_SAFE_INTEGER,
    balance,
    productSubtotalAfterReferral: afterReferral,
  });
  const pointsRedeemed = clampRedeemablePoints({
    requestedPoints: input.pointsToRedeem ?? 0,
    balance,
    productSubtotalAfterReferral: afterReferral,
  });
  const pointsDiscount = discountFromPoints(pointsRedeemed);
  const totals = buildOrderTotals({
    productSubtotal,
    shippingFee,
    referralDiscount,
    pointsDiscount,
  });

  const productAfter = Math.max(
    0,
    Math.round((productSubtotal - totals.discountAmount) * 100) / 100,
  );

  return {
    balance,
    referralEligible,
    referralDiscount,
    referralPercent: REFERRAL_FIRST_ORDER_PERCENT,
    pointsRedeemed,
    pointsDiscount,
    pointsToEarn: pointsFromSubtotal(productAfter),
    discountAmount: totals.discountAmount,
    productSubtotalAfterDiscounts: productAfter,
    total: totals.total,
    maxRedeemablePoints,
  };
}
