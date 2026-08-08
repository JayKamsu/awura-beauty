import {
  pointsFromSubtotal,
  REFERRAL_REFEREE_BONUS,
  REFERRAL_REFERRER_BONUS,
} from "@/lib/domain/loyalty";
import type { OrderRow } from "@/lib/infrastructure/supabase/order-types";
import {
  applyLoyaltyDelta,
  getLoyaltyProfile,
  markReferralRewarded,
  userHasPaidOrder,
} from "@/lib/infrastructure/supabase/loyalty";

/**
 * Crédite les points commande + débite les points utilisés (idempotent via ledger).
 */
export async function settleOrderLoyalty(order: OrderRow): Promise<void> {
  if (!order.user_id) return;

  const productSubtotal = order.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const afterDiscount = Math.max(
    0,
    Math.round((productSubtotal - (order.discount_amount || 0)) * 100) / 100,
  );

  const pointsToEarn =
    order.points_earned > 0
      ? order.points_earned
      : pointsFromSubtotal(afterDiscount);

  if (order.points_redeemed > 0) {
    await applyLoyaltyDelta({
      userId: order.user_id,
      delta: -order.points_redeemed,
      reason: "order_redeem",
      orderId: order.id,
      meta: { discount: order.discount_amount },
    });
  }

  if (pointsToEarn > 0) {
    await applyLoyaltyDelta({
      userId: order.user_id,
      delta: pointsToEarn,
      reason: "order_earn",
      orderId: order.id,
      meta: { productSubtotal: afterDiscount },
    });
  }

  await applyReferralRewardsIfNeeded(order);
}

async function applyReferralRewardsIfNeeded(order: OrderRow): Promise<void> {
  if (!order.user_id) return;

  const profile = await getLoyaltyProfile(order.user_id);
  if (!profile?.referred_by || profile.referral_rewarded_at) return;

  const hadPriorPaid = await userHasPaidOrder(order.user_id, {
    excludeOrderId: order.id,
  });
  if (hadPriorPaid) return;

  const marked = await markReferralRewarded(order.user_id);
  if (!marked) return;

  await applyLoyaltyDelta({
    userId: order.user_id,
    delta: REFERRAL_REFEREE_BONUS,
    reason: "referral_referee",
    orderId: order.id,
  });

  await applyLoyaltyDelta({
    userId: profile.referred_by,
    delta: REFERRAL_REFERRER_BONUS,
    reason: "referral_referrer",
    orderId: order.id,
    meta: { refereeId: order.user_id },
  });
}
