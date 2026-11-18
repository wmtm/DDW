// Minimal service worker: just enough for "Add to Home Screen" / standalone
// install to qualify (that needs a registered SW with a fetch handler), plus
// a cached shell to fall back to if a page load happens while offline.
//
// Deliberately does NOT cache anything else — not the hashed JS/CSS bundles
// (those change on every deploy; caching them risks serving a stale build),
// not Firestore reads/writes, not MapTiler tiles. Every request other than
// a top-level page navigation passes straight through to the network
// exactly as if this file didn't exist.
const SHELL_CACHE = 'ddw-shell-v1'
const SHELL_URL = '/DDW/index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add(SHELL_URL))
      .catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(fetch(event.request).catch(() => caches.match(SHELL_URL)))
})
