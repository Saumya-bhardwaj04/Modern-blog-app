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
  const title = payload?.data?.title || "New notification";
  const body = payload?.data?.body || "";

  self.registration.showNotification(title, {
    body,
    icon: "/logo192.png",
    data: payload.data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = "/notifications";

  if (data.type === "like" && data.blogSlug) {
    url = `/blog/${data.blogSlug}`;
  }

  if (data.type === "follow" && data.username) {
    url = `/@${data.username}`;
  }
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        client.navigate(url);
        return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
