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

messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message:", payload);

  const data = payload.data || {};

  self.registration.showNotification(data.title || "Notification", {
    body: data.body || "",
    icon: "/logo192.png",
    image: data.image || undefined,
    data: {
      url: data.url || "/home",
    },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/home";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
