// 오프라인 실행용 서비스 워커
// 문제나 화면을 수정해 다시 배포할 때는 아래 VERSION 숫자를 올려야 태블릿에 새 버전이 반영됩니다.
const VERSION = 'oxquiz-v7';
const FILES = [
  './', './index.html', './app.js', './config.js', './questions.js', './manifest.json',
  './assets/lab.png', './assets/gist.png', './icons/icon-192.png', './icons/icon-512.png',
  './fonts/Jua-Regular.ttf', './assets/bgm.wav',
  './assets/prize1.jpg', './assets/prize2.jpg', './assets/prize3.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 앱 파일: 네트워크 우선(최신 반영), 끊기면 캐시 / 글꼴(Google Fonts): 캐시 우선
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (isFont) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      }))
    );
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
