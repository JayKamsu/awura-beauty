/* Service worker FCM — handlers push/notification au top-level (exigence Chrome).
   Version alignée sur le SDK client (package.json : firebase 12.17.1). */
const SW_VERSION = "2026-11-25-2";
importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js",
);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

let messagingReady = false;

function notificationLink(notification) {
  const data = notification.data || {};
  if (typeof data.link === "string" && data.link) return data.link;
  const fcmData = data.FCM_MSG && data.FCM_MSG.data;
  if (fcmData && typeof fcmData.link === "string" && fcmData.link) {
    return fcmData.link;
  }
  return "/";
}

function showPushNotification(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "Awura Beauty";
  const link = data.link || "/";
  return self.registration.showNotification(title, {
    body: notification.body || data.body || "",
    icon: "/icon",
    data: { ...data, link },
  });
}

/** Filet de sécurité tant que Firebase Messaging n'est pas initialisé. */
self.addEventListener("push", (event) => {
  if (messagingReady) return;
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      notification: { body: event.data ? event.data.text() : "" },
    };
  }
  event.waitUntil(showPushNotification(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation();
  }
  const targetUrl = new URL(
    notificationLink(event.notification),
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            if (typeof client.navigate === "function") {
              return client.navigate(targetUrl).then((navigated) => {
                return navigated ? navigated.focus() : client.focus();
              });
            }
            return client.focus().then(() => {
              client.postMessage({
                type: "NOTIFICATION_NAVIGATE",
                url: targetUrl,
              });
            });
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});

function initMessaging(config) {
  if (!config?.apiKey || typeof firebase === "undefined") return false;
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }
  try {
    const messaging = firebase.messaging();
    if (!self.__awuraBgBound) {
      self.__awuraBgBound = true;
      messaging.onBackgroundMessage((payload) => showPushNotification(payload));
    }
    messagingReady = true;
    return true;
  } catch {
    return false;
  }
}

fetch(self.location.origin + "/api/push/firebase-config")
  .then((res) => (res.ok ? res.json() : null))
  .then((config) => initMessaging(config))
  .catch(() => undefined);

self.addEventListener("message", (event) => {
  if (event.data?.type === "SW_VERSION") {
    event.source?.postMessage({ type: "SW_VERSION", version: SW_VERSION });
    return;
  }
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === "FIREBASE_CONFIG" && event.data.config) {
    const ready = initMessaging(event.data.config);
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        type: ready ? "FIREBASE_READY" : "FIREBASE_FAILED",
      });
    }
  }
});
