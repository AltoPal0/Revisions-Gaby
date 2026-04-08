const CACHE = 'histopardy-v2';

// Install : mettre en cache la page d'entrée uniquement
// (les assets JS/CSS seront mis en cache au premier chargement)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.add('/'))
  );
  self.skipWaiting();
});

// Activate : supprimer les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes cross-origin
  if (url.origin !== location.origin) return;

  // Navigation (HTML) : réseau d'abord, fallback sur '/' en cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Assets Vite (/assets/*.js, /assets/*.css) : cache-first
  // Ces fichiers ont un hash dans leur nom → immutables, jamais périmés
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Tout le reste (icônes, manifest, etc.) : réseau avec fallback cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
