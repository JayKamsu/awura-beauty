/**
 * Connecteur Firebase — accès notifications depuis API / use-cases.
 */
export {
  firebaseNotificationAdapter,
  broadcastPush,
  notifyAdminUsers,
  notifyOrderUser,
} from "@/lib/infrastructure/notifications/firebase";

export { isFirebaseAdminConfigured } from "@/lib/infrastructure/notifications/firebase-admin";
