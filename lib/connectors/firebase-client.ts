/**
 * Init Firebase Messaging côté navigateur (module notifications uniquement).
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  type Messaging,
} from "firebase/messaging";

const SW_PATH = "/firebase-messaging-sw.js";

function clientConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

/** Vérifie que toutes les variables d'env nécessaires au push web (Firebase + VAPID) sont présentes. */
export function isFirebaseClientConfigured(): boolean {
  const c = clientConfig();
  return Boolean(
    c.apiKey &&
      c.projectId &&
      c.messagingSenderId &&
      c.appId &&
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  );
}

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseClientConfigured()) return null;
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp(clientConfig());
}

/** Instance Messaging côté client, uniquement si le navigateur supporte le push et Firebase est configuré. */
export async function getFirebaseMessagingClient(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  return getMessaging(app);
}

async function waitForServiceWorkerActive(
  registration: ServiceWorkerRegistration,
): Promise<ServiceWorker | null> {
  if (registration.active) return registration.active;

  const pending = registration.installing ?? registration.waiting;
  if (!pending) {
    await navigator.serviceWorker.ready;
    return registration.active;
  }

  await new Promise<void>((resolve) => {
    pending.addEventListener("statechange", () => {
      if (pending.state === "activated" || pending.state === "redundant") {
        resolve();
      }
    });
  });

  await navigator.serviceWorker.ready;
  return registration.active;
}

async function ensureSwFirebaseConfig(
  worker: ServiceWorker,
  config: ReturnType<typeof clientConfig>,
): Promise<void> {
  await new Promise<void>((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(), 2500);
    channel.port1.onmessage = (event) => {
      if (event.data?.type === "FIREBASE_READY") {
        window.clearTimeout(timer);
        resolve();
      }
    };
    worker.postMessage({ type: "FIREBASE_CONFIG", config }, [channel.port2]);
  });
}

/** Enregistre le SW (nécessaire push + installabilité PWA). */
export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
    });
    await waitForServiceWorkerActive(registration);
    return registration;
  } catch {
    return null;
  }
}

/** Demande la permission de notification, enregistre le service worker et récupère le token push (null si refusé/indisponible). */
export async function requestWebPushToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || !isFirebaseClientConfigured()) {
    console.warn("[push] Firebase client not configured (missing env vars)");
    return null;
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("[push] Notification API or serviceWorker unsupported in this browser");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn(`[push] Permission not granted: ${permission}`);
      return null;
    }

    const registration = await registerMessagingServiceWorker();
    if (!registration?.active) {
      console.error("[push] Service worker registration failed or inactive");
      return null;
    }

    await ensureSwFirebaseConfig(registration.active, clientConfig());

    const messaging = await getFirebaseMessagingClient();
    if (!messaging) {
      console.error("[push] getFirebaseMessagingClient returned null (isSupported=false?)");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) {
      console.error("[push] getToken returned an empty token");
    }
    return token || null;
  } catch (err) {
    console.error("[push] requestWebPushToken failed:", err);
    return null;
  }
}
