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
  const pending = registration.installing ?? registration.waiting;
  if (pending) {
    pending.postMessage({ type: "SKIP_WAITING" });
    await new Promise<void>((resolve) => {
      const done = () => {
        if (pending.state === "activated" || pending.state === "redundant") {
          resolve();
        }
      };
      pending.addEventListener("statechange", done);
      done();
    });
  }

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
      const type = event.data?.type;
      if (type === "FIREBASE_READY" || type === "FIREBASE_FAILED") {
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

/** Résultat de la demande de token FCM côté navigateur. */
export type WebPushTokenResult =
  | { ok: true; token: string }
  | {
      ok: false;
      reason: "denied" | "default" | "unsupported" | "push-service" | "failed";
    };

function errorText(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const cause =
      "cause" in err && err.cause ? errorText(err.cause) : "";
    return `${err.name} ${err.message} ${cause}`;
  }
  return String(err);
}

function isPushServiceUnavailable(err: unknown): boolean {
  return /push service not available/i.test(errorText(err));
}

/**
 * Demande la permission, enregistre le service worker et récupère le token FCM.
 * `permissionPromise` doit être créé dans le geste utilisateur (clic) pour Safari.
 */
export async function requestWebPushToken(
  permissionPromise?: Promise<NotificationPermission>,
): Promise<WebPushTokenResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "unsupported" };
  }
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || !isFirebaseClientConfigured()) {
    console.warn("[push] Firebase client not configured (missing env vars)");
    return { ok: false, reason: "unsupported" };
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("[push] Notification API or serviceWorker unsupported in this browser");
    return { ok: false, reason: "unsupported" };
  }

  try {
    const permission = permissionPromise
      ? await permissionPromise
      : await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn(`[push] Permission not granted: ${permission}`);
      return {
        ok: false,
        reason: permission === "denied" ? "denied" : "default",
      };
    }

    const registration = await registerMessagingServiceWorker();
    if (!registration?.active) {
      console.error("[push] Service worker registration failed or inactive");
      return { ok: false, reason: "failed" };
    }

    await ensureSwFirebaseConfig(registration.active, clientConfig());

    const messaging = await getFirebaseMessagingClient();
    if (!messaging) {
      console.error("[push] getFirebaseMessagingClient returned null (isSupported=false?)");
      return { ok: false, reason: "unsupported" };
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) {
      console.error("[push] getToken returned an empty token");
      return { ok: false, reason: "failed" };
    }
    return { ok: true, token };
  } catch (err) {
    if (isPushServiceUnavailable(err)) {
      console.warn("[push] Push service unavailable in this browser");
      return { ok: false, reason: "push-service" };
    }
    console.error("[push] requestWebPushToken failed:", err);
    return { ok: false, reason: "failed" };
  }
}
