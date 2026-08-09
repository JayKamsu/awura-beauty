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

export async function requestWebPushToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || !isFirebaseClientConfigured()) return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await registerMessagingServiceWorker();
    if (!registration?.active) return null;

    await ensureSwFirebaseConfig(registration.active, clientConfig());

    const messaging = await getFirebaseMessagingClient();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch {
    return null;
  }
}
