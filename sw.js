/* Capacitación Cafilibano – trabajo sin conexión.
   Cambie VERSION cada vez que publique un index.html nuevo. */
const VERSION = 'cap-cafilibano-v2.0';
const CORE = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
const OPTIONAL = ['./firma-gerente-cafilibano.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE);
    await Promise.all(OPTIONAL.map(u => fetch(u).then(r => { if (r.ok) return c.put(u, r); }).catch(() => {})));
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const nav = req.mode === 'navigate';
    const hit = await cache.match(nav ? './index.html' : req, { ignoreSearch: true });
    const net = fetch(req).then(r => {
      if (r && r.ok) cache.put(nav ? './index.html' : url.pathname, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net;
    return r || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
