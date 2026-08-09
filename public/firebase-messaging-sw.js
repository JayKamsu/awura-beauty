/* Service worker FCM — handlers push/notification au top-level (exigence Chrome). */
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js",
);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function showPushNotification(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "Awura Beauty";
  const link = data.link || "/";
  const options = {
    body: notification.body || data.body || "",
    icon: "/favicon.png",
    data: { ...data, link },
  };
  return self.registration.showNotification(title, options);
}

/** Doit être enregistré dès l’évaluation initiale du script. */
self.addEventListener("push", (event) => {
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

self.addEventListener("pushsubscriptionchange", () => {
  // Renouvellement géré côté client (use-push-subscription).
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data?.link || "/";
  const targetUrl = new URL(raw, self.location.origin).href;

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
  if (!config?.apiKey) return;
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }
  // Initialise FCM sans onBackgroundMessage (push déjà géré au top-level).
  try {
    firebase.messaging();
  } catch {
    // ignore
  }
}

fetch(self.location.origin + "/api/push/firebase-config")
  .then((res) => (res.ok ? res.json() : null))
  .then((config) => initMessaging(config))
  .catch(() => undefined);

self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG" && event.data.config) {
    initMessaging(event.data.config);
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: "FIREBASE_READY" });
    }
  }
});
