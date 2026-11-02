/* BẢN ĐỒ DI SẢN SỐ — sơ đồ minh hoạ vẽ bằng SVG, chạy không cần mạng.
 * Vị trí các điểm theo toạ độ gần đúng trong data.js (cùng tỉ lệ ngang – dọc); sông Hồng, sông Đáy, bờ biển vẽ PHỎNG THEO, không đúng tỉ lệ bản đồ.
 * Ghim theo loại (Tâm linh · Làng nghề · Thiên nhiên), đường đi của từng tour, khung phóng to cụm Tràng An – Hoa Lư.
 * Bấm ghim → thẻ thông tin + «Xem 360°»; bấm tên tour → tô đường đi + «Xem video hành trình».
 */
(function () {
  'use strict';
  const SITES = window.HERITAGE, THEMES = window.THEMES, REGIONS = window.REGIONS, Eco = window.Eco;
  const box = document.getElementById('bdso');
  if (!SITES || !Eco || !box) return;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = Object.fromEntries(SITES.map((s) => [s.id, s]));
  const W = 1000, H = 760, LNG0 = 105.76, LAT0 = 20.67, KX = 1120, KY = 1190;
  const P = (lat, lng) => [(lng - LNG0) * KX, (LAT0 - lat) * KY];
  const pts = (arr) => arr.map(([la, ln]) => P(la, ln).map((v) => v.toFixed(1)).join(',')).join(' ');
  const smooth = (arr) => {               // đường cong mềm qua các điểm (Catmull-Rom → Bézier)
    const p = arr.map(([la, ln]) => P(la, ln));
    let d = 'M' + p[0].join(',');
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += ' C' + [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6, c[0], c[1]].map((v) => v.toFixed(1)).join(',');
    }
    return d;
  };
  const TOUR_COLOR = ['#e0672c', '#2f7d3a', '#1f8f9b', '#8a4fc0', '#c9972b', '#d9577a', '#0b4f5f'];
  const ICON = {   // biểu tượng nhỏ trong ghim
    'tam-linh': '<path d="M-5 2h10M-4 2v-4h8v4M-6-2l6-5 6 5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>',
    'lang-nghe': '<path d="M-5 4l3-8h4l3 8M-3 0h6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>',
    'thien-nhien': '<path d="M-6 4l4-7 3 4 2-3 3 6z" fill="#fff"/>'
  };

  /* ---------- nền: biển, sông, vùng ---------- */
  const COAST = [[19.98, 106.0], [20.05, 106.2], [20.15, 106.45], [20.19, 106.56], [20.26, 106.66]];
  const SONG_HONG = [[20.69, 105.98], [20.55, 106.05], [20.43, 106.18], [20.33, 106.33], [20.27, 106.48], [20.22, 106.58]];
  const SONG_DAY = [[20.69, 105.86], [20.54, 105.91], [20.45, 105.95], [20.25, 105.97], [20.15, 106.05], [20.02, 106.12]];
  const REGION_LABEL = { 'ha-nam': [20.54, 105.775], 'nam-dinh': [20.52, 106.33], 'ninh-binh': [20.12, 105.80] };

  function hull(points) {                   // bao lồi để vẽ «vùng» mềm quanh các điểm cùng vùng
    const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    p.forEach((q) => { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
    p.slice().reverse().forEach((q) => { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function regionShape(reg) {
    const own = SITES.filter((s) => s.region === reg).map((s) => P(s.lat, s.lng));
    const ring = [];
    own.forEach(([x, y]) => { for (let a = 0; a < 12; a++) ring.push([x + 70 * Math.cos(a * Math.PI / 6), y + 62 * Math.sin(a * Math.PI / 6)]); });
    const h = hull(ring);
    return 'M' + h.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' L') + 'Z';
  }

  /* ---------- cụm Tràng An – Hoa Lư: khung phóng to ---------- */
  const CUM = ['trang-an', 'tam-coc', 'hoa-lu', 'bai-dinh', 'van-lam'];
  const IN = { x: 640, y: 18, w: 340, h: 320, lng0: 105.835, lat0: 20.305, k: 2400 };
  const PI = (lat, lng) => [IN.x + 20 + (lng - IN.lng0) * IN.k, IN.y + 34 + (IN.lat0 - lat) * IN.k * 1.06];

  function pin(s, x, y, small) {
    const th = s.themes[0], col = THEMES[th].color, r = small ? 9 : 11;
    return '<g class="bd-pin" data-id="' + s.id + '" transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')" tabindex="0" role="button" aria-label="' + esc(s.name) + '">' +
      '<circle r="' + (r + 6) + '" class="bd-halo" fill="' + col + '"/>' +
      '<path d="M0 ' + (r + 9) + ' L-' + (r * 0.7).toFixed(1) + ' 4 A' + r + ' ' + r + ' 0 1 1 ' + (r * 0.7).toFixed(1) + ' 4Z" fill="' + col + '" stroke="#fff" stroke-width="2" transform="translate(0,-' + (r + 4) + ')"/>' +
      '<g transform="translate(0,-' + (r + 4) + ')">' + ICON[th] + '</g></g>';
  }
  function label(s, x, y, side) {
    const a = side === 'l' ? 'end' : 'start', dx = side === 'l' ? -16 : 16;
    return '<text class="bd-lb" x="' + (x + dx).toFixed(1) + '" y="' + (y - 10).toFixed(1) + '" text-anchor="' + a + '">' + esc(s.short) + '</text>';
  }
  const SIDE = { 'nha-xa': 'r', 'doi-tam': 'l', 'tam-chuc': 'r', 'phu-day': 'r', 'y-yen': 'l', 'den-tran': 'r', 'xuan-thuy': 'l', 'bach-long': 'l', 'phat-diem': 'r',
    'trang-an': 'r', 'tam-coc': 'l', 'hoa-lu': 'r', 'bai-dinh': 'r', 'van-lam': 'l' };

  function where(id) { return CUM.includes(id) ? null : P(byId[id].lat, byId[id].lng); }
  function whereIn(id) { return PI(byId[id].lat, byId[id].lng); }

  function routes() {
    return Eco.TOURS.map((t, i) => {
      const main = t.stops.map((id) => P(byId[id].lat, byId[id].lng));
      const d = 'M' + main.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' L');
      const inside = t.stops.filter((id) => CUM.includes(id));
      const din = inside.length > 1 ? 'M' + inside.map((id) => whereIn(id).map((v) => v.toFixed(1)).join(',')).join(' L') : '';
      return '<g class="bd-route" data-tour="' + t.id + '" style="--c:' + TOUR_COLOR[i % TOUR_COLOR.length] + '"><path d="' + d + '"/>' + (din ? '<path class="in" d="' + din + '"/>' : '') + '</g>';
    }).join('');
  }

  function svg() {
    const cum = CUM.map((id) => P(byId[id].lat, byId[id].lng));
    const cx = cum.reduce((a, q) => a + q[0], 0) / cum.length, cy = cum.reduce((a, q) => a + q[1], 0) / cum.length;
    const coast = COAST.map(([la, ln]) => P(la, ln));
    const sea = 'M' + coast.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' L') + ' L' + W + ',' + H + ' L' + coast[0][0].toFixed(1) + ',' + H + 'Z';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="bdso-t">' +
      '<title id="bdso-t">Bản đồ di sản số Hà Nam – Nam Định – Ninh Bình (sơ đồ minh hoạ)</title>' +
      '<defs><linearGradient id="bd-sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe3ea"/><stop offset="1" stop-color="#7cc3d1"/></linearGradient>' +
      '<pattern id="bd-dot" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#cfe0c4"/></pattern></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="#f6f1e2"/><rect width="' + W + '" height="' + H + '" fill="url(#bd-dot)"/>' +
      Object.keys(REGIONS).map((r, i) => '<path class="bd-reg r' + i + '" d="' + regionShape(r) + '"/>').join('') +
      '<path d="' + sea + '" fill="url(#bd-sea)"/><path d="' + smooth(COAST) + '" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>' +
      '<text class="bd-sea" x="760" y="700">BIỂN ĐÔNG</text>' +
      '<path class="bd-river" d="' + smooth(SONG_HONG) + '"/><path class="bd-river" d="' + smooth(SONG_DAY) + '"/>' +
      '<text class="bd-rv" transform="translate(' + P(20.36, 106.27).join(',') + ') rotate(-38)">sông Hồng</text>' +
      '<text class="bd-rv" transform="translate(' + P(20.40, 105.975).join(',') + ') rotate(-80)">sông Đáy</text>' +
      Object.entries(REGION_LABEL).map(([r, q]) => '<text class="bd-rg" x="' + P(q[0], q[1])[0].toFixed(1) + '" y="' + P(q[0], q[1])[1].toFixed(1) + '">' + esc(REGIONS[r]).toUpperCase() + '</text>').join('') +
      '<g class="bd-routes">' + routes() + '</g>' +
      // cụm Tràng An – Hoa Lư: vòng nét đứt + đường dẫn tới khung phóng to
      '<circle class="bd-cum" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="62"/>' +
      '<path class="bd-lead" d="M' + (cx + 44).toFixed(1) + ',' + (cy - 44).toFixed(1) + ' Q' + (IN.x - 120) + ',' + (cy - 200).toFixed(1) + ' ' + IN.x + ',' + (IN.y + IN.h - 40) + '"/>' +
      '<text class="bd-cumlb" x="' + cx.toFixed(1) + '" y="' + (cy + 82).toFixed(1) + '" text-anchor="middle">Cụm Tràng An – Hoa Lư</text>' +
      SITES.filter((s) => !CUM.includes(s.id)).map((s) => { const [x, y] = where(s.id); return label(s, x, y, SIDE[s.id]) + pin(s, x, y); }).join('') +
      CUM.map((id) => { const [x, y] = P(byId[id].lat, byId[id].lng); return '<circle class="bd-mini" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" fill="' + THEMES[byId[id].themes[0]].color + '"/>'; }).join('') +
      // khung phóng to
      '<g class="bd-inset"><rect x="' + IN.x + '" y="' + IN.y + '" width="' + IN.w + '" height="' + IN.h + '" rx="18"/>' +
      '<text class="bd-inlb" x="' + (IN.x + 16) + '" y="' + (IN.y + 24) + '">Phóng to · Cụm Tràng An – Hoa Lư</text>' +
      CUM.map((id) => { const [x, y] = whereIn(id); return label(byId[id], x, y, SIDE[id]) + pin(byId[id], x, y, true); }).join('') + '</g>' +
      // la bàn
      '<g class="bd-n" transform="translate(955,395)"><circle r="24"/><path d="M0-17 L7 6 L0 1 L-7 6Z"/><text y="-28" text-anchor="middle">B</text></g>' +
      '</svg>';
  }

  /* ---------- thẻ thông tin ---------- */
  const info = document.getElementById('bdso-info');
  function showSite(id) {
    const s = byId[id];
    if (!s) return;
    box.querySelectorAll('.bd-pin').forEach((g) => g.classList.toggle('on', g.dataset.id === id));
    const tours = Eco.TOURS.filter((t) => t.stops.includes(id));
    info.innerHTML = ((window.ANH_AI || {})[id] ? '<img src="assets/anh-ai/' + id + '.webp" alt="' + esc(s.name) + '" width="1280" height="720">' : '') +
      '<div class="bdi-b"><span class="bdi-tag" style="--c:' + THEMES[s.themes[0]].color + '">' + esc(THEMES[s.themes[0]].label) + ' · ' + esc(REGIONS[s.region]) + '</span>' +
      '<h3>' + esc(s.name) + '</h3><p>' + esc(s.blurb) + '</p>' +
      (tours.length ? '<p class="bdi-t">Có trong tour: ' + tours.map((t) => '<button type="button" data-bd-tour="' + t.id + '">' + esc(t.name) + '</button>').join(' ') + '</p>' : '') +
      '<div class="bdi-a"><a class="btn btn-primary btn-sm" href="#/' + id + '">Xem 360°</a>' +
      '<a class="btn btn-line btn-sm" href="https://www.google.com/maps/search/?api=1&amp;query=' + s.lat + ',' + s.lng + '" target="_blank" rel="noopener">Chỉ đường</a></div></div>';
  }
  function showTour(tid) {
    const t = Eco.tourById[tid];
    box.querySelectorAll('.bd-route').forEach((g) => g.classList.toggle('on', g.dataset.tour === tid));
    box.classList.toggle('co-tour', !!t);
    box.querySelectorAll('[data-bd-chip]').forEach((b) => b.classList.toggle('on', b.dataset.bdChip === (tid || '')));
    if (!t) return;
    box.querySelectorAll('.bd-pin').forEach((g) => g.classList.toggle('mo', !t.stops.includes(g.dataset.id)));
    info.innerHTML = '<div class="bdi-b"><span class="bdi-tag" style="--c:' + getComputedStyle(box.querySelector('.bd-route.on')).getPropertyValue('--c') + '">Tour ' + t.days + ' ngày</span>' +
      '<h3>' + esc(t.name) + '</h3><p>' + esc(t.tagline) + '</p>' +
      '<ol class="bdi-stops">' + t.stops.map((id) => '<li><button type="button" data-bd-site="' + id + '">' + esc(byId[id].short) + '</button></li>').join('') + '</ol>' +
      '<div class="bdi-a"><button class="btn btn-primary btn-sm" type="button" data-bd-video="' + t.id + '">▶ Xem video hành trình</button></div></div>';
  }

  /* ---------- dựng ---------- */
  box.querySelector('.bdso-map').innerHTML = svg();
  document.getElementById('bdso-tours').innerHTML = '<button type="button" class="on" data-bd-chip="">Tất cả điểm</button>' +
    Eco.TOURS.map((t, i) => '<button type="button" data-bd-chip="' + t.id + '" style="--c:' + TOUR_COLOR[i % TOUR_COLOR.length] + '"><i></i>' + esc(t.name) + '</button>').join('');
  document.getElementById('bdso-legend').innerHTML = Object.values(THEMES).map((t) => '<span><i style="background:' + t.color + '"></i>' + esc(t.label) + '</span>').join('') +
    '<span><i class="ln"></i>Đường đi của tour</span><span><i class="rv"></i>Sông (vẽ phỏng theo)</span>';
  info.innerHTML = '<div class="bdi-b bdi-hint"><h3>Chạm vào một ghim</h3><p>để xem điểm di sản, hoặc chọn một tour phía trên để thấy đường đi.</p></div>';

  box.addEventListener('click', (e) => {
    const g = e.target.closest('.bd-pin');
    if (g) { showSite(g.dataset.id); return; }
    const c = e.target.closest('[data-bd-chip]');
    if (c) {
      if (!c.dataset.bdChip) { showTour(''); box.querySelectorAll('.bd-pin').forEach((p) => p.classList.remove('mo')); box.querySelectorAll('.bd-route').forEach((r) => r.classList.remove('on')); info.innerHTML = '<div class="bdi-b bdi-hint"><h3>Chạm vào một ghim</h3><p>để xem điểm di sản, hoặc chọn một tour phía trên để thấy đường đi.</p></div>'; }
      else showTour(c.dataset.bdChip);
      return;
    }
    const t = e.target.closest('[data-bd-tour]');
    if (t) { showTour(t.dataset.bdTour); return; }
    const s = e.target.closest('[data-bd-site]');
    if (s) { showSite(s.dataset.bdSite); return; }
    const v = e.target.closest('[data-bd-video]');
    if (v && window.EcoUI) window.EcoUI.showQuote(v.dataset.bdVideo);
  });
  box.addEventListener('keydown', (e) => {
    const g = e.target.closest('.bd-pin');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showSite(g.dataset.id); }
  });
})();
