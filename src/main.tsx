import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept window.fetch to automatically include custom Supabase credentials from localStorage
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    value: async function (input: RequestInfo | URL, init?: RequestInit) {
      let urlStr = '';
      if (typeof input === 'string') {
        urlStr = input;
      } else if (input && typeof input === 'object' && 'url' in input) {
        urlStr = (input as any).url;
      }

      const isApi = urlStr.startsWith('/api/') || (typeof window !== 'undefined' && urlStr.includes(window.location.origin + '/api/'));
      if (isApi && typeof window !== 'undefined') {
        const url = localStorage.getItem('VITE_SUPABASE_URL');
        const anonKey = localStorage.getItem('VITE_SUPABASE_ANON_KEY');
        const serviceRoleKey = localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY');
        
        if (url || anonKey || serviceRoleKey) {
          init = init || {};
          const headers = new Headers(init.headers || {});
          if (url) headers.set('x-supabase-url', url);
          if (anonKey) headers.set('x-supabase-anon-key', anonKey);
          if (serviceRoleKey) headers.set('x-supabase-service-role-key', serviceRoleKey);
          init.headers = headers;
        }
      }
      return originalFetch(input, init);
    },
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn('Failed to intercept window.fetch via Object.defineProperty. Fallback used.', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
