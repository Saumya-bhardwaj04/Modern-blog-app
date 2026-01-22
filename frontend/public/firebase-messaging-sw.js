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

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  let url = "/home";

  if (data.type === "like" || data.type === "comment") {
    url = `/blog/${data.blogId}`;
  }

  if (data.type === "follow") {
    url = `/@${data.username}`;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

messaging.onBackgroundMessage(payload => {
  console.log("Background message:", payload);

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/logo192.png"
    }
  );
});