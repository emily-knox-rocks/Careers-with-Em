/* Knox Life Dashboard service worker: installable, fully usable offline.
   Bump CACHE on any asset change to roll out updates. */
var CACHE = 'knox-dash-v2';
var ASSETS = [
  './dashboard.html',
  './dashboard.css',
  './dashboard.js',
  './manifest.webmanifest',
  './fonts/knox-fonts.css',
  './fonts/cormorant-garamond-latin-500-normal.woff2',
  './fonts/cormorant-garamond-latin-600-normal.woff2',
  './fonts/cormorant-garamond-latin-700-normal.woff2',
  './fonts/cormorant-garamond-latin-600-italic.woff2',
  './fonts/jost-latin-400-normal.woff2',
  './fonts/jost-latin-500-normal.woff2',
  './fonts/jost-latin-600-normal.woff2',
  './icons/knox-192.png',
  './icons/knox-512.png'
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
