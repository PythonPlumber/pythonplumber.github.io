const CACHE_NAME = 'pythonplumber-cache-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/blog.html',
  '/repo.html',
  '/style.css',
  '/threejs_scene.js',
  '/threejs_ui.js',
  '/manifest.json',
  '/img/dp.png',
  '/img/cropped.jpg',
  '/img/512.gif'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then(response => {
          const responseClone = response.clone();
          if (request.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
