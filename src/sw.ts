import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback — serve precached index.html for all navigation requests
// except /api/* routes
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/api\//],
});
registerRoute(navigationRoute);

// API caching — NetworkFirst with 24h expiration
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
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
self.addEventListener('push', (event) => {
  const data = (event as PushEvent).data?.json() ?? {};
  (event as ExtendableEvent).waitUntil(
    self.registration.showNotification(data.title ?? 'LearningHub', {
      body: data.body ?? '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: data.url ? { url: data.url } : undefined,
    }),
  );
});

// Open the relevant URL when a push notification is clicked
self.addEventListener('notificationclick', (event) => {
  (event as NotificationEvent).notification.close();
  const url = (event as NotificationEvent).notification.data?.url ?? '/dashboard';
  (event as ExtendableEvent).waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});
