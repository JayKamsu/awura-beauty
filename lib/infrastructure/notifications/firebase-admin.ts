import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

function privateKey(): string | undefined {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n");
}

/** Vérifie que les credentials Firebase Admin (env) sont présents avant tout appel serveur. */
export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      privateKey(),
  );
}

/** App Firebase Admin singleton (réutilise l'instance existante pour éviter une double init). */
export function getFirebaseAdminApp(): App | null {
  if (!isFirebaseAdminConfigured()) return null;
  const existing = getApps()[0];
  if (existing) return existing;

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey(),
    }),
  });
}

/** Client FCM prêt à l'emploi, ou null si Firebase Admin n'est pas configuré. */
export function getFirebaseMessaging(): Messaging | null {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getMessaging(app);
}
