const CACHE_NAME = 'histopardy-v1';
const DATA_CACHE = 'histopardy-data-v1';

const DATA_FILES = [
  '/data/Histoire_BFI_dates.json',
  '/data/Geo_BFI_dates.json',
  '/data/HGGSP_revision_dates.json',
];

// Installation: pré-cacher les données JSON
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(DATA_CACHE).then(cache => cache.addAll(DATA_FILES))
  );
  self.skipWaiting();
});

// Activation: nettoyer les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== DATA_CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first pour les données, network-first pour le reste
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Données JSON: cache-first
  if (DATA_FILES.some(f => url.pathname === f)) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // App shell: network-first avec fallback cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
