export { createSupabaseClient, getSupabaseEnv } from "./client";
export {
  getCurrentUser,
  getCurrentUserId,
  getSession,
  onAuthStateChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from "./auth";
export type { AuthResult } from "./auth";
export {
  getBlogPostBySlug,
  listBlogPosts,
  listBlogSlugs,
} from "./blog";
export type {
  BlogContentBlock,
  BlogPost,
  BlogPostKind,
} from "./blog-types";
export { listMyDiagnostics, saveHairDiagnostic } from "./diagnostics";
export type { SaveDiagnosticInput } from "./diagnostics";
export type {
  DiagnosticAnswers,
  DiagnosticProfile,
  DiagnosticRecord,
  GoalAnswer,
  HabitsAnswer,
  HairTypeAnswer,
  ScalpAnswer,
} from "./diagnostic-types";
export {
  createOrder,
  getOrderById,
  listAllOrders,
  listMyOrders,
  updateOrderPayment,
  updateOrderShipping,
} from "./orders";
export type { CreateOrderInput } from "./orders";
export type {
  OrderItem,
  OrderRow,
  OrderStatus,
  PaymentMethod,
  ShippingCarrier,
  ShippingStatus,
} from "./order-types";
export {
  getProductBySlug,
  getProductsBySlugs,
  getRelatedProducts,
  listAllProductSlugs,
  listProducts,
} from "./products";
export type {
  ListProductsParams,
  ListProductsResult,
  ProductCategory,
  ProductRow,
} from "./types";
