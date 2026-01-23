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

  self.registration.showNotification(
    payload.data.title,
    {
      body: payload.data.body,
      icon: "/logo192.png",
      data: {
        force: "/notifications",
        type: payload.data.type,
        blogSlug: payload.data.blogSlug || "",
        username: payload.data.username || "",
      }
    }
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { type, blogSlug, username } = event.notification.data;
  let url = "/notifications";

  if (type === "like") url = `/blog/${blogSlug}`;
  if (type === "follow") url = `/@${username}`;
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
