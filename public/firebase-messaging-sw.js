// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

self.addEventListener('install', () => {
  self.skipWaiting();
});

let isInitialized = false;

function parseFcmConfig(configStr) {
  try {
    return JSON.parse(configStr);
  } catch (e) {
    // Robust regex fallback to extract credentials from JavaScript snippets/objects
    var config = {};
    var keys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var regex = new RegExp('"?'+key+'"?\\s*:\\s*[\'"\\`]([^\'"\\`]+)[\'"\\`]', 'i');
      var match = configStr.match(regex);
      if (match && match[1]) {
        config[key] = match[1].trim();
      }
    }
    if (config.apiKey && config.projectId) {
      return config;
    }
    throw new Error("Could not parse config as valid JSON or JS object: " + e.message);
  }
}

async function initFirebase() {
  if (isInitialized) return;
  try {
    const response = await fetch('/api/settings');
    const settings = await response.json();
    const fcmConfigStr = settings.fcmConfigJson;
    
    if (!fcmConfigStr || !fcmConfigStr.trim()) {
      console.log('[FCM SW] No client FCM configuration found in settings.');
      return;
    }
    
    const firebaseConfig = parseFcmConfig(fcmConfigStr);
    
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();
      isInitialized = true;
      console.log('[FCM SW] Firebase messaging initialized successfully.');
      
      messaging.onBackgroundMessage((payload) => {
        console.log('[FCM SW] Received background message:', payload);
        
        const title = payload.notification?.title || payload.data?.title || 'New Alert! 🔔';
        const options = {
          body: payload.notification?.body || payload.data?.body || 'Check the latest update.',
          icon: settings.logoUrl || '/favicon.ico',
          badge: settings.faviconUrl || '/favicon.ico',
          data: {
            url: payload.data?.url || payload.data?.click_action || '/'
          }
        };
        
        self.registration.showNotification(title, options);
      });
    }
  } catch (err) {
    console.error('[FCM SW] Initialization failed:', err);
  }
}

// Intercept push events to ensure firebase is initialized before the push is displayed
self.addEventListener('push', (event) => {
  event.waitUntil(
    initFirebase().then(() => {
      // If the push had a notification payload, the browser automatically displays it.
      // If not, we could manually construct one here if needed.
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
