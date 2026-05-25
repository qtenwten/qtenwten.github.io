const KILLER_VERSION = 'kill-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', async (event) => {
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of allClients) {
      try {
        await client.navigate(client.url)
      } catch (e) {
        // ignore navigation errors
      }
    }

    const cacheKeys = await caches.keys()
    await Promise.all(cacheKeys.map((key) => caches.delete(key)))

    await self.registration.unregister()
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', () => {
  // No caching — this SW kills itself after activation
})
