const VERSION = 'v6'
const HTML_CACHE = `qsen-html-${VERSION}`
const ASSET_CACHE = `qsen-assets-${VERSION}`
const IMAGE_CACHE = `qsen-images-${VERSION}`
const STATIC_URLS = [
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(ASSET_CACHE)
    await cache.addAll(STATIC_URLS)
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((key) => ![HTML_CACHE, ASSET_CACHE, IMAGE_CACHE].includes(key))
        .map((key) => caches.delete(key))
    )
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document'
}

function isApiRequest(request) {
  return new URL(request.url).pathname.startsWith('/api/')
}

function isHashedAsset(request) {
  const pathname = new URL(request.url).pathname
  return /\/assets\/.+\.[a-z0-9_-]+\.(js|css)$/i.test(pathname)
}

function isImageRequest(request) {
  return request.destination === 'image'
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)

  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    throw error
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    eventWaitUntil(networkPromise)
    return cached
  }

  const networkResponse = await networkPromise
  if (networkResponse) return networkResponse

  throw new Error('Network request failed and no cache entry exists')
}

function eventWaitUntil(promise) {
  promise.catch(() => undefined)
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (!isSameOrigin(request) || request.method !== 'GET' || isApiRequest(request)) {
    return
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, HTML_CACHE))
    return
  }

  if (isHashedAsset(request)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE))
    return
  }

  if (isImageRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
    return
  }
})
