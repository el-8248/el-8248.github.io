const CACHE_NAME = 'e11e-site-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './image.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './content/about.md',
  './content/links.md',
  './content/photos.md',
  './content/projects.md',
  './content/terminal.md',
  './photos/school/1.jpg',
  './photos/school/2.jpg',
  './photos/school/3.JPG',
  './photos/school/4.JPG',
  './doom/',
  './doom/index.html',
  './git/',
  './git/index.html',
  './mc/',
  './mc/index.html',
  './pong/',
  './pong/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('e11e-site-') && cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: 'no-cache' });
      if (response.ok && response.type === 'basic') {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch (error) {
          console.error('Unable to cache a site resource.', error);
        }
      }
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request, { ignoreSearch: true });
      if (cachedResponse) return cachedResponse;

      if (request.mode === 'navigate') {
        const cachedIndex = await cache.match('./index.html');
        if (cachedIndex) return cachedIndex;
      }

      throw error;
    }
  })());
});
