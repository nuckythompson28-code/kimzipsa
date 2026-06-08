// 김집사 서비스워커 — 앱 셸 캐시(오프라인) + 백그라운드 갱신
const CACHE = 'kimzipsa-v6';
const ASSETS = [
  './', 'index.html', 'butler.html', 'storage.html', 'vehicle.html',
  'schedule.html', 'shopping.html', 'fines.html', 'info.html', 'recipe.html',
  'anniversary.html', 'recurring.html', 'todo.html', 'engcat.html', 'tax.html', 'o0852.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 다른 도메인(Firebase 실시간 DB, gstatic SDK, jsdelivr 등)은 항상 네트워크로 — 캐시하지 않음
  if (url.origin !== location.origin) return;
  // 앱 셸: 캐시 우선 + 백그라운드로 최신화(stale-while-revalidate)
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
        }
        return resp;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
