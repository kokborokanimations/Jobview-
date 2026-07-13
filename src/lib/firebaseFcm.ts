import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { AdminSettings } from '../types';

function parseFcmConfig(configStr: string): any {
  try {
    return JSON.parse(configStr);
  } catch (e: any) {
    // Robust regex fallback to extract credentials from JavaScript snippets/objects
    const config: any = {};
    const keys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];
    for (const key of keys) {
      const regex = new RegExp(`"?${key}"?\\s*:\\s*['"\`]([^'"\`]+)['"\`]`, 'i');
      const match = configStr.match(regex);
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

export async function registerFcm(settings: AdminSettings): Promise<{ success: boolean; token?: string; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is undefined' };
  }
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('[FCM] Service worker or Notifications are not supported in this browser.');
    return { success: false, error: 'Your browser does not support Service Workers or Web Notifications. Please use Chrome, Edge, or Safari.' };
  }

  const fcmConfigStr = settings.fcmConfigJson;
  const vapidKey = settings.fcmVapidKey;

  if (!fcmConfigStr || !fcmConfigStr.trim()) {
    console.log('[FCM] Client configuration is not set up in Admin settings.');
    return { success: false, error: 'Firebase FCM client configuration is empty or not set up in Admin Settings.' };
  }

  try {
    const firebaseConfig = parseFcmConfig(fcmConfigStr);
    
    // Check if App already initialized
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const messaging = getMessaging(app);

    // Register service worker explicitly for Firebase Messaging if not already done
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('[FCM] Service Worker registered with scope:', registration.scope);

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied by user.');
      return { success: false, error: 'Notification permission was denied by the user.' };
    }

    // Retrieve FCM Registration Token
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey || undefined
    });

    if (token) {
      console.log('[FCM] Generated client registration token:', token);
      
      // Save token to backend server
      const response = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server registration endpoint returned HTTP ${response.status}`);
      }
      
      console.log('[FCM] Registration token successfully submitted to backend.');
      
      // Set up foreground message listener
      onMessage(messaging, (payload) => {
        console.log('[FCM] Received foreground message:', payload);
        const title = payload.notification?.title || payload.data?.title || 'Notification! 🔔';
        const body = payload.notification?.body || payload.data?.body || '';
        
        if (typeof (window as any).showJobSavedToast === 'function') {
          (window as any).showJobSavedToast(`${title}: ${body}`);
        } else {
          new Notification(title, {
            body,
            icon: settings.logoUrl || '/favicon.ico'
          });
        }
      });

      return { success: true, token };
    } else {
      console.warn('[FCM] No registration token received. Check your Firebase console settings.');
      return { success: false, error: 'No registration token received. Please make sure your VAPID Key and Firebase credentials are correct.' };
    }

  } catch (err: any) {
    console.error('[FCM] Setup failed:', err);
    return { success: false, error: err.message || String(err) };
  }
}
