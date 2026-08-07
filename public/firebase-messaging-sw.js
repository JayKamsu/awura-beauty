/* eslint-disable no-undef */
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
    const options = {
      body: payload.notification?.body || "",
      icon: "/favicon.png",
      data: payload.data || {},
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
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(self.clients.openWindow(link));
});
