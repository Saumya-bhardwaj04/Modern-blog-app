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
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = "/notifications";

  event.waitUntil(
    clients.openWindow(url)
  );
});


messaging.onBackgroundMessage(payload => {
  console.log("Background message:", payload);

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/logo192.png",
      data: {
        force : "/notifications"
      }
    }
  );
});