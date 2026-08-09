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

function initMessaging(config) {
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Awura Beauty";
    const link = payload.data?.link || "/";
    const options = {
      body: payload.notification?.body || "",
      icon: "/favicon.png",
      data: { ...(payload.data || {}), link },
    };
    self.registration.showNotification(title, options);
  });
}

fetch(self.location.origin + "/api/push/firebase-config")
  .then((res) => (res.ok ? res.json() : null))
  .then((config) => {
    if (config?.apiKey) initMessaging(config);
  })
  .catch(() => undefined);

self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG" && event.data.config) {
    initMessaging(event.data.config);
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: "FIREBASE_READY" });
    }
  }
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
              client.postMessage({ type: "NOTIFICATION_NAVIGATE", url: targetUrl });
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
