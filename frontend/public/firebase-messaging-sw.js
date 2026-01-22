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

/**
 * 🔔 BACKGROUND NOTIFICATION
 * data fields MUST be strings
 */
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message:", payload);

  const title = payload.data?.title || "New notification";
  const body = payload.data?.body || "";

  self.registration.showNotification(title, {
    body,
    icon: "/logo192.png",
    badge: "/badge.png",

    // 👇 STRING ONLY
    data: {
      type: payload.data?.type || "",
      blogSlug: payload.data?.blogSlug || "",
      username: payload.data?.username || "",
    },
  });
});

/**
 * 👉 HANDLE CLICK
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { type, blogSlug, username } = event.notification.data || {};

  let url = "/notifications";

  if (type === "like" && blogSlug) {
    url = `/blog/${blogSlug}`;
  } 
  else if (type === "follow" && username) {
    url = `/@${username}`;
  } 
  else if (type === "comment") {
    url = "/notifications";
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

