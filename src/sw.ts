/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ─── Push notification handler ────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json() as { title: string; body: string; icon?: string }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon ?? '/icons/logo512.png',
      badge: '/icons/logo512.png',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vibrate: [100, 50, 100],
    } as NotificationOptions & Record<string, any>)
  )
})

// ─── Notification click → open app ───────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app already open, focus it
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }
        // Otherwise open new window
        if (self.clients.openWindow) return self.clients.openWindow('/dashboard')
      })
  )
})
