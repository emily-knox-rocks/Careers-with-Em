/* Mission Control service worker: makes the dashboard installable and
   fully usable offline. Bump CACHE on any asset change to roll out updates. */
var CACHE = 'cwem-mc-v1';
var ASSETS = [
  './dashboard.html',
  './dashboard.css',
  './dashboard.js',
  './plan-data.js',
  './styles.css',
  './manifest.webmanifest',
  './fonts/fonts.css',
  './fonts/albert-sans-latin-400-normal.woff2',
  './fonts/albert-sans-latin-500-normal.woff2',
  './fonts/albert-sans-latin-600-normal.woff2',
  './fonts/albert-sans-latin-700-normal.woff2',
  './fonts/albert-sans-latin-800-normal.woff2',
  './fonts/inter-latin-400-normal.woff2',
  './fonts/inter-latin-500-normal.woff2',
  './fonts/inter-latin-600-normal.woff2',
  './fonts/inter-latin-700-normal.woff2',
  './brand/logos/icon-192.png',
  './brand/logos/icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if(url.origin !== location.origin) return;

  /* The page itself: network first so updates land fast, cache when offline */
  if(url.pathname.endsWith('/dashboard.html')){
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){ return caches.match('./dashboard.html'); })
    );
    return;
  }

  /* Everything else: cache first, fill the cache from the network on miss */
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(res){
        if(res.ok){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
