/**
 * Composition root — branche les ports sur les adapters.
 * UI / API appellent le container, jamais un adapter directement
 * (sauf types domaine).
 */

import type {
  CatalogPort,
  ContentPort,
  DiagnosticPort,
  NotificationPort,
  OrderPort,
  PageLayoutPort,
  PaymentPort,
  ShippingPort,
} from "@/lib/application/ports";
import { firebaseNotificationAdapter } from "@/lib/infrastructure/notifications/firebase";
import { createPayPalOrder, capturePayPalOrder } from "@/lib/infrastructure/payments/paypal";
import { createStripeCheckoutSession } from "@/lib/infrastructure/payments/stripe";
import { createLaPosteLabel, getLaPosteTracking } from "@/lib/infrastructure/shipping/laposte";
import {
  createMondialRelayLabel,
  getMondialRelayTracking,
} from "@/lib/infrastructure/shipping/mondialrelay";
import {
  getBlogPostBySlug,
  listBlogPosts,
  listBlogSlugs,
} from "@/lib/infrastructure/supabase/blog";
import { listMyDiagnostics, saveHairDiagnostic } from "@/lib/infrastructure/supabase/diagnostics";
import {
  createOrder,
  getOrderById,
  listAllOrders,
  listMyOrders,
  updateOrderPayment,
  updateOrderShipping,
} from "@/lib/infrastructure/supabase/orders";
import {
  getPageLayout,
  listPageLayouts,
  savePageLayout,
} from "@/lib/infrastructure/supabase/page-layouts";
import {
  getProductBySlug,
  getProductsBySlugs,
  getRelatedProducts,
  listAllProductSlugs,
  listProducts,
} from "@/lib/infrastructure/supabase/products";

export const catalogPort: CatalogPort = {
  listProducts,
  getProductBySlug,
  getProductsBySlugs,
  getRelatedProducts,
  listAllProductSlugs,
};

export const orderPort: OrderPort = {
  createOrder,
  listMyOrders,
  listAllOrders,
  getOrderById,
  updateOrderPayment,
  updateOrderShipping,
};

export const contentPort: ContentPort = {
  listBlogPosts,
  getBlogPostBySlug,
  listBlogSlugs,
};

export const diagnosticPort: DiagnosticPort = {
  saveHairDiagnostic: async (input) => {
    const result = await saveHairDiagnostic(input);
    return {
      id: result.id,
      error: result.saved ? null : "Unable to save diagnostic",
    };
  },
  listMyDiagnostics,
};

export const paymentPort: PaymentPort = {
  createStripeCheckout: createStripeCheckoutSession,
  createPayPalOrder,
  capturePayPalOrder,
};

export const shippingPort: ShippingPort = {
  createLabel: async (carrier, input) => {
    if (carrier === "mondial_relay") return createMondialRelayLabel(input);
    return createLaPosteLabel(input);
  },
  track: async (carrier, trackingNumber) => {
    if (carrier === "mondial_relay") {
      return getMondialRelayTracking(trackingNumber);
    }
    return getLaPosteTracking(trackingNumber);
  },
};

export const notificationPort: NotificationPort = firebaseNotificationAdapter;

export const pageLayoutPort: PageLayoutPort = {
  getPageLayout,
  listPageLayouts,
  savePageLayout,
};

/** Accès groupé (API routes / use-cases) */
export const container = {
  catalog: catalogPort,
  orders: orderPort,
  content: contentPort,
  diagnostics: diagnosticPort,
  payments: paymentPort,
  shipping: shippingPort,
  notifications: notificationPort,
  pages: pageLayoutPort,
} as const;
