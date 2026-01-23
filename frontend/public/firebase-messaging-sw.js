importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBIVnECDvu8b-zAwJQ_LYxOGxfBJ0IXyng",
  authDomain: "blogapp-7b3e6.firebaseapp.com",
  projectId: "blogapp-7b3e6",
  messagingSenderId: "243299068272",
  appId: "1:243299068272:web:06a0bd84f34daa8dcac7b5",
});

const messaging = firebase.messaging();

// Flag to know Firebase showed a notification
let firebaseHandledPush = false;

/* ---------------- BACKGROUND (FCM) ---------------- */
messaging.onBackgroundMessage((payload) => {
  firebaseHandledPush = true;

  const data = payload.data || {};
  const title = data.title || "New Activity";

  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/logo-192.png",
    badge: data.badge || "/badge-72.png",
    tag: data.tag || `notification-${data.type || 'general'}-${data.postId || 'global'}`,
    data: {
      url: data.click_action || data.url || "/notifications",
    },
  };

  self.registration.showNotification(title, options);
});

/* ---------------- FALLBACK (CHROME QUIET) ---------------- */
self.addEventListener("push", (event) => {
  if (firebaseHandledPush) return;

  event.waitUntil(
    self.registration.showNotification(" ", {
      body: "",
      silent: true,
      tag: "chrome-fallback",
    })
  );
});

/* ---------------- CLICK HANDLER ---------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/notifications";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) || client.url === "/") {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
