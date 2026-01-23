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
  console.log('[sw] Background message received:', payload);

  const { notification, data = {} } = payload;

  // Skip if no useful content
  if (!notification?.title && !data.title) return;

  const title = notification?.title || data.title || 'New Activity';
  const body  = notification?.body  || data.body  || 'Check whats new';

  const options = {
    body,
    icon: data.icon || '/logo.png',          // per-message icon if sent
    badge: '/badge.png',
    // image: data.image || '/large-preview.jpg', // large preview image (optional)
    tag: data.tag || `notification-${data.type || 'general'}-${data.postId || 'global'}`,
    renotify: true,
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
  console.log('[sw] Raw push event received:', event);

  // Parse the payload (FCM puts it in event.data)
  let payload;
  try {
    payload = event.data?.json() || {};
  } catch (e) {
    console.error('[sw] Failed to parse push payload:', e);
    // Still need to show something or Chrome will complain
    return event.waitUntil(
      self.registration.showNotification('Notification', {
        body: 'New update received',
      })
    );
  }

  const data = payload.data || {};
  const notification = payload.notification || {};

  const title = notification.title || data.title || 'New Notification';
  const options = {
    body: notification.body || data.body || 'You have a new message',
    icon: data.icon || '/logo.jpg',
    badge: '/badge.png',
    tag: data.tag || `push-${data.type || 'general'}-${data.postId || Date.now()}`,
    renotify: true,
    data: {
      url: data.click_action || data.url || '/notifications',
    },
  };

  // This is the key: wrap in event.waitUntil and return the promise
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[sw] Notification shown successfully');
      })
      .catch((err) => {
        console.error('[sw] Show notification failed:', err);
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
