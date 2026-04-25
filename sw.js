const CACHE = 'trail-mapper-v1';
const PRECACHE = [
  '/trail-mapper/',
  '/trail-mapper/index.html',
  '/trail-mapper/manifest.json',
  '/trail-mapper/icon-192.png',
  '/trail-mapper/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Share+Tech+Mono&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache what we can, ignore failures (e.g. Google Fonts CORS)
      return Promise.allSettled(PRECACHE.map(url => c.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Let Google Maps API calls always go to network
  if (e.request.url.includes('maps.googleapis.com') ||
      e.request.url.includes('maps.gstatic.com') ||
      e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/trail-mapper/index.html'));
    })
  );
});
