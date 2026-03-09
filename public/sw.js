// Service Worker – Reklamsidan PWA
const CACHE_NAME = 'reklamsidan-v1'

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
