// Handlers de Web Push, importados pelo service worker gerado (Workbox) via
// `workbox.importScripts`. Conteúdo PT-BR vem do payload enviado pelo servidor.
/* global self */

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: 'Devocional', body: event.data.text() };
    }
  }
  const title = payload.title || 'Devocional';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const clientsArr = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const focused = clientsArr.find((client) => client.url.includes(target));
      if (focused) {
        return focused.focus();
      }
      return self.clients.openWindow(target);
    })(),
  );
});
