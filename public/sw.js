// Service Worker – Reklamsidan PWA
const CACHE_NAME = 'reklamsidan-v2'

// Resurser som cachas vid installation
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ── Installation ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Aktivering – rensa gamla cacher ──────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch – Network first, fallback till cache ────────────
self.addEventListener('fetch', event => {
  // Ignorera icke-GET och cross-origin-requests (Supabase, etc.)
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  // API-routes hanteras alltid live (aldrig cachade)
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cachea framgångsrika svar
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        // Offline-fallback: försök hämta från cache
        caches.match(event.request).then(cached => {
          if (cached) return cached
          // Ingen cache – returnera offline-svar för navigering
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
          return new Response('Offline', { status: 503 })
        })
      )
  )
})

// ── Push-notiser ───────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'Ny reklam!', body: '', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data:  { url: data.url },
      vibrate: [200, 100, 200],
    })
  )
})

// ── Klick på notis öppnar appen ────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Aktivera befintlig flik om möjligt
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Annars öppna ny flik
      return clients.openWindow(url)
    })
  )
})
