// Service worker สำหรับ Web Push — แสดงแจ้งเตือน "ถึงคิวของคุณแล้ว" แม้ปิดแท็บ/สลับไปแอปอื่น
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || 'ถึงคิวของคุณแล้ว!';
  const options = {
    body: payload.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [0, 400, 150, 400, 150, 400],
    data: payload.data || {},
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
