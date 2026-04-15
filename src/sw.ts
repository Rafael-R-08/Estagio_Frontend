/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback — serve precached index.html for all navigation requests
// except /api/* routes. In development, index.html might not be precached,
// so we fall back to a manual fetch.
let NavigationHandler;
try {
  NavigationHandler = createHandlerBoundToURL('/index.html');
} catch {
  // Fallback for development where /index.html is not precached
  NavigationHandler = async () => {
    return fetch('/index.html');
  };
}

const navigationRoute = new NavigationRoute(NavigationHandler as any, {
  denylist: [/^\/api\//],
});
registerRoute(navigationRoute);

// API caching — NetworkFirst with 24h expiration
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// Push notification handler
self.addEventListener('push', (event: any) => {
  const data = (event as any).data?.json() ?? {};
  (event as any).waitUntil(
    self.registration.showNotification(data.title ?? 'LearningHub', {
      body: data.body ?? '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: data.url ? { url: data.url } : undefined,
    }),
  );
});

// Open the relevant URL when a push notification is clicked
self.addEventListener('notificationclick', (event: any) => {
  (event as any).notification.close();
  const url = (event as any).notification.data?.url ?? '/dashboard';
  (event as any).waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients: readonly WindowClient[]) => {
        const existing = clients.find((c: WindowClient) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});
