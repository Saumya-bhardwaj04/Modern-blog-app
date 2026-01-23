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
  const data = payload.data || {};

  const title = data.title || "New Activity";

  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/logo-192.png",
    badge: data.badge || "/badge-72.png",
    // image: data.image || '/large-preview.jpg', // large preview image (optional)
    tag: data.tag || `notification-${data.type || 'general'}-${data.postId || 'global'}`,
    data: {
      url: data.click_action || data.url || '/notifications',
      // any other data you want in click handler
    },
    // vibrate: [200, 100, 200],
    // requireInteraction: true,
  };

  self.registration.showNotification(title, options);
});
self.addEventListener('push', (event) => {
  // If Firebase handled it, do nothing
  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload?.data) {
        // Firebase will handle via onBackgroundMessage
        return;
      }
    } catch (_) {}
  }

  // Fallback notification ONLY to stop Chrome warning
  event.waitUntil(
    self.registration.showNotification(' ', {
      body: '',
      silent: true,
      tag: 'chrome-fallback',
    })
  );
});

// Handle click on notification → open app / specific page
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // always close it

  const url = event.notification.data?.url || '/notifications';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing tab if it matches
        for (const client of clientList) {
          if (client.url.includes(url) || client.url === '/') {
            return client.focus();
          }
        }
        // Open new tab/window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch((err) => console.error('Notification click failed:', err))
  );
});