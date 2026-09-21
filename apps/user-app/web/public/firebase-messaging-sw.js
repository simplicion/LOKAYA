// Firebase Messaging Service Worker for Web Push Notifications
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyC_droV1ayojZ2wSABtJ4FYyWa7tIhI-c8',
  authDomain: 'lokaya.firebaseapp.com',
  projectId: 'lokaya',
  storageBucket: 'lokaya.firebasestorage.app',
  messagingSenderId: '924762867355',
  appId: '1:924762867355:android:0433ff1d871f650a87a83e',
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'LOKAYA Update';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || '/icon.png',
    badge: '/icon.png',
    image: payload.notification?.image || payload.data?.imageUrl,
    data: {
      deepLink: payload.data?.deepLink || payload.fcmOptions?.link || '/',
    },
    actions: [
      {
        action: 'open_url',
        title: 'View Details',
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const deepLink = event.notification.data?.deepLink || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window tab is already open, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return client.navigate(deepLink);
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(deepLink);
      }
    })
  );
});
