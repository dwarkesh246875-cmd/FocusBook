self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('focusbook-store').then((cache) => cache.addAll([
      './index.html',
      './app.js',
      './style2.css'
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
