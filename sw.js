/* Chạy ngoại tuyến: trang và tệp đã mở một lần thì lần sau mở được khi mất mạng.
 * Đổi số phiên bản VERSION khi cập nhật lớn để xoá bộ nhớ cũ. */
const VERSION = 'eco-v1';
const CORE = ['./', 'index.html', 'css/style.css', 'css/home.css', 'css/lang-nghe.css', 'css/trang.css', 'thu-vien/phong-chu/phong-chu.css',
  'thu-vien/leaflet/leaflet.css', 'thu-vien/leaflet/leaflet.js', 'assets/thuong-hieu/logo.png', 'assets/thuong-hieu/logo-96.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // API đặt tour và bản đồ nền luôn đi mạng
  if (req.mode === 'navigate') {   // trang chính: mạng trước, mất mạng thì dùng bản đã lưu
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put('index.html', cp)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // tệp tĩnh: dùng bản đã lưu ngay, đồng thời tải bản mới ở nền
  e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});
