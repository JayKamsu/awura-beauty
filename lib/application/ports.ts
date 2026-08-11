import type {
  BlogPost,
  BlogPostKind,
  CreateShippingLabelInput,
  CreateShippingLabelResult,
  DiagnosticAnswers,
  DiagnosticChannel,
  DiagnosticPhoto,
  DiagnosticProfile,
  DiagnosticRecord,
  DiagnosticRoutineStep,
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

/** Port catalogue produits (lecture). */
export type CatalogPort = {
  listProducts: (params?: ListProductsParams) => Promise<ListProductsResult>;
  getProductBySlug: (slug: string) => Promise<ProductRow | null>;
  getProductsBySlugs: (slugs: string[]) => Promise<ProductRow[]>;
  getRelatedProducts: (product: ProductRow, limit?: number) => Promise<ProductRow[]>;
  listAllProductSlugs: () => Promise<string[]>;
};

/** Port commandes (création, lecture, mise à jour paiement/livraison). */
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
      labelPath?: string | null;
      relayPointId?: string | null;
    },
  ) => Promise<boolean>;
};

/** Port contenu éditorial (blog), avec source de repli si Supabase indisponible. */
export type ContentPort = {
  listBlogPosts: (
    kind?: BlogPostKind,
  ) => Promise<{ posts: BlogPost[]; source: "supabase" | "fallback" }>;
  getBlogPostBySlug: (slug: string) => Promise<BlogPost | null>;
  listBlogSlugs: (kind?: BlogPostKind) => Promise<string[]>;
};

/** Port diagnostics capillaires (sauvegarde + lecture des diagnostics du client courant). */
export type DiagnosticPort = {
  saveHairDiagnostic: (input: {
    answers: DiagnosticAnswers;
    profile: DiagnosticProfile;
    recommendedProductSlugs: string[];
    channel?: DiagnosticChannel;
    appointmentId?: string | null;
    routine?: DiagnosticRoutineStep[];
    userId?: string | null;
    notes?: string;
    photos?: DiagnosticPhoto[];
  }) => Promise<{ id: string | null; error: string | null }>;
  listMyDiagnostics: () => Promise<DiagnosticRecord[]>;
};

/** Port profil du client connecté (lecture/mise à jour). */
export type ProfilePort = {
  getMyProfile: () => Promise<ProfileRow | null>;
  updateMyProfile: (
    input: ProfileUpdateInput,
  ) => Promise<{ profile: ProfileRow | null; error: string | null }>;
};

/** Port paiement multi-fournisseurs (Stripe Checkout + PayPal). */
export type PaymentPort = {
  createStripeCheckout: (input: {
    orderId: string;
    customerEmail: string;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    lineItems: Array<{
      name: string;
      quantity: number;
      unitAmountCents: number;
      imageUrl?: string;
    }>;
  }) => Promise<{
    url: string | null;
    sessionId?: string | null;
    error: string | null;
  }>;
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

/** Port transporteurs (création d'étiquette + suivi de colis). */
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

/** Port notifications push, avec indicateur `configured` pour dégrader silencieusement si non configuré. */
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
