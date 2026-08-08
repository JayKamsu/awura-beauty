import type {
  BlogPost,
  BlogPostKind,
  CreateShippingLabelInput,
  CreateShippingLabelResult,
  DiagnosticAnswers,
  DiagnosticProfile,
  DiagnosticRecord,
  ListProductsParams,
  ListProductsResult,
  NotificationPayload,
  OrderItem,
  OrderRow,
  PageLayout,
  PageLocale,
  PageSectionConfig,
  PaymentMethod,
  ProductRow,
  ShippingCarrier,
  ShippingStatus,
  TrackingResult,
} from "@/lib/domain";
import type {
  ProfileRow,
  ProfileUpdateInput,
} from "@/lib/infrastructure/supabase/profile-types";

export type CatalogPort = {
  listProducts: (params?: ListProductsParams) => Promise<ListProductsResult>;
  getProductBySlug: (slug: string) => Promise<ProductRow | null>;
  getProductsBySlugs: (slugs: string[]) => Promise<ProductRow[]>;
  getRelatedProducts: (product: ProductRow, limit?: number) => Promise<ProductRow[]>;
  listAllProductSlugs: () => Promise<string[]>;
};

export type OrderPort = {
  createOrder: (input: {
    email: string;
    paymentMethod: PaymentMethod;
    currency: string;
    items: OrderItem[];
    shippingAddress: NonNullable<OrderRow["shipping_address"]>;
    paymentStatus?: string;
    status?: OrderRow["status"];
    relayPointId?: string | null;
    shippingCarrier?: ShippingCarrier | null;
    shippingFee?: number;
    total?: number;
    pointsEarned?: number;
    pointsRedeemed?: number;
    discountAmount?: number;
    referralDiscountApplied?: boolean;
    userId?: string | null;
  }) => Promise<{ order: OrderRow | null; error: string | null }>;
  listMyOrders: () => Promise<OrderRow[]>;
  listAllOrders: () => Promise<OrderRow[]>;
  getOrderById: (id: string) => Promise<OrderRow | null>;
  updateOrderPayment: (
    id: string,
    patch: { paymentStatus: string; status: OrderRow["status"] },
  ) => Promise<boolean>;
  updateOrderShipping: (
    id: string,
    patch: {
      shippingStatus: ShippingStatus;
      shippingCarrier?: ShippingCarrier | null;
      trackingNumber?: string | null;
      labelUrl?: string | null;
      relayPointId?: string | null;
    },
  ) => Promise<boolean>;
};

export type ContentPort = {
  listBlogPosts: (
    kind?: BlogPostKind,
  ) => Promise<{ posts: BlogPost[]; source: "supabase" | "fallback" }>;
  getBlogPostBySlug: (slug: string) => Promise<BlogPost | null>;
  listBlogSlugs: (kind?: BlogPostKind) => Promise<string[]>;
};

export type DiagnosticPort = {
  saveHairDiagnostic: (input: {
    answers: DiagnosticAnswers;
    profile: DiagnosticProfile;
    recommendedProductSlugs: string[];
  }) => Promise<{ id: string | null; error: string | null }>;
  listMyDiagnostics: () => Promise<DiagnosticRecord[]>;
};

export type ProfilePort = {
  getMyProfile: () => Promise<ProfileRow | null>;
  updateMyProfile: (
    input: ProfileUpdateInput,
  ) => Promise<{ profile: ProfileRow | null; error: string | null }>;
};

export type PaymentPort = {
  createStripeCheckout: (input: {
    orderId: string;
    customerEmail: string;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    lineItems: Array<{
      name: string;
      quantity: number;
      unitAmountCents: number;
      imageUrl?: string;
    }>;
  }) => Promise<{ url: string | null; error: string | null }>;
  createPayPalOrder: (input: {
    orderId: string;
    amount: { currencyCode: string; value: string };
  }) => Promise<{ id: string | null; error: string | null }>;
  capturePayPalOrder: (paypalOrderId: string) => Promise<{
    ok: boolean;
    error?: string | null;
    status?: string | null;
    awuraOrderId?: string | null;
    amountValue?: string | null;
    currencyCode?: string | null;
  }>;
};

export type ShippingPort = {
  createLabel: (
    carrier: ShippingCarrier,
    input: CreateShippingLabelInput,
  ) => Promise<CreateShippingLabelResult>;
  track: (
    carrier: ShippingCarrier,
    trackingNumber: string,
  ) => Promise<TrackingResult>;
};

export type NotificationPort = {
  send: (
    payload: NotificationPayload,
  ) => Promise<{ ok: boolean; error?: string; stub?: boolean }>;
  configured: () => boolean;
};

/** Port mise en page des pages (CMS affichage) */
export type PageLayoutPort = {
  getPageLayout: (pageKey: string, locale?: PageLocale) => Promise<PageLayout>;
  listPageLayouts: () => Promise<PageLayout[]>;
  savePageLayout: (
    pageKey: string,
    sections: PageSectionConfig[],
  ) => Promise<{ layout: PageLayout | null; error: string | null }>;
};
