/**
 * Domaine Awura — types métier (indépendants des adapters).
 * Les adapters / UI importent depuis ici, jamais l'inverse.
 */

export type {
  ProductRow,
  ProductCategory,
  ListProductsParams,
  ListProductsResult,
} from "@/lib/infrastructure/supabase/types";

export type {
  OrderItem,
  OrderRow,
  OrderStatus,
  PaymentMethod,
  ShippingCarrier,
  ShippingStatus,
} from "@/lib/infrastructure/supabase/order-types";

export type {
  BlogContentBlock,
  BlogPost,
  BlogPostKind,
} from "@/lib/infrastructure/supabase/blog-types";

export type {
  DiagnosticAnswerMap,
  DiagnosticAnswers,
  DiagnosticAppointment,
  DiagnosticChannel,
  DiagnosticLocale,
  DiagnosticOption,
  DiagnosticProfile,
  DiagnosticQuestion,
  DiagnosticRecord,
  DiagnosticRoutineStep,
  DiagnosticSettings,
  DiagnosticSlot,
  GoalAnswer,
  HabitsAnswer,
  HairTypeAnswer,
  ScalpAnswer,
} from "@/lib/domain/diagnostic";

export type {
  CreateShippingLabelInput,
  CreateShippingLabelResult,
  ShippingAddress,
  TrackingEvent,
  TrackingResult,
} from "@/lib/infrastructure/shipping/types";

export { mapCarrierStatusToShippingStatus } from "@/lib/infrastructure/shipping/types";

export type NotificationChannel = "push" | "email" | "in_app";

export type NotificationPayload = {
  userId?: string;
  email?: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  data?: Record<string, string>;
};

export type {
  PageFieldKey,
  PageLayout,
  PageLocale,
  PageSectionConfig,
  PageSectionFields,
  PageSectionId,
} from "@/lib/domain/page-layout";

export type { RelayPoint, ShippingMethod } from "@/lib/domain/shipping";

export {
  POINTS_PER_EURO,
  REDEEM_STEP_POINTS,
  REDEEM_STEP_EURO,
  REFERRAL_FIRST_ORDER_PERCENT,
  REFERRAL_REFERRER_BONUS,
  REFERRAL_REFEREE_BONUS,
  pointsFromSubtotal,
  discountFromPoints,
  clampRedeemablePoints,
  firstOrderDiscountAmount,
  buildOrderTotals,
} from "@/lib/domain/loyalty";
export type { LoyaltyReason } from "@/lib/domain/loyalty";

export {
  DEFAULT_ABOUT_SECTIONS,
  DEFAULT_HOME_SECTIONS,
  PAGE_FIELD_KEYS,
  PAGE_LOCALES,
  defaultLayoutFor,
  isPageSectionId,
} from "@/lib/domain/page-layout";
