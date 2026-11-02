/* Trang chủ một trang (30/10/2026): mục Di sản, mục Kết nối cộng đồng, trang Dữ liệu quản lí (có mật khẩu).
 * Dữ liệu di sản: data.js · tour: tours.js · làng nghề Hải Hậu: lang-nghe.js
 * Lượt đặt tour: máy chủ Apps Script (ECO_CONFIG.apiUrl) hoặc trình duyệt (bản demo, khoá eco_bookings).
 */
(function () {
  'use strict';

  const SITES = window.HERITAGE || [], REGIONS = window.REGIONS || {}, THEMES = window.THEMES || {};
  const Eco = window.Eco || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const vnd = (n) => Math.round(n || 0).toLocaleString('vi-VN') + ' đ';
  const REGION_ORDER = ['ha-nam', 'nam-dinh', 'ninh-binh'];

  /* ---------- Di sản ---------- */
  const ds = { region: 'all' };
  function renderHeritage() {
    const grid = $('#ds-grid');
    if (!grid) return;
    $('#ds-filter').innerHTML = [['all', 'Cả ba vùng']].concat(REGION_ORDER.map((r) => [r, REGIONS[r] || r]))
      .map(([v, l]) => '<button type="button" class="chip' + (ds.region === v ? ' on' : '') + '" data-r="' + v + '" aria-pressed="' + (ds.region === v) + '">' + esc(l) + '</button>').join('');
    const list = SITES.filter((s) => ds.region === 'all' || s.region === ds.region)
      .sort((a, b) => REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region));
    grid.innerHTML = list.map((s) =>
      '<article class="ds-card" data-region="' + s.region + '">' +
        '<a class="ds-img" href="#/' + s.id + '" aria-label="Xem 360°: ' + esc(s.name) + '"><img data-site="' + s.id + '" alt="' + esc(s.name) + '" width="480" height="270">' +
          '</a>' +
        '<div class="ds-top"><span class="ds-reg">' + esc(REGIONS[s.region] || '') + '</span>' +
          s.themes.map((t) => '<span class="ds-tag">' + esc((THEMES[t] || {}).label || t) + '</span>').join('') + '</div>' +
        '<h3>' + esc(s.name) + '</h3><p>' + esc(s.blurb) + '</p>' +
        '<dl>' + s.facts.slice(0, 2).map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>').join('') + '</dl>' +
        '<div class="ds-act"><a href="#/' + s.id + '">Xem 360° →</a><a href="#ban-do">Bản đồ</a></div>' +
      '</article>').join('');
    const byId = Object.fromEntries(SITES.map((s) => [s.id, s]));
    $$('img[data-site]', grid).forEach((img) => {
      if (window.EcoImg) window.EcoImg(byId[img.dataset.site], 640, 360).then((u) => { if (u) img.src = u; });
    });
  }

  /* ---------- Kết nối cộng đồng ---------- */
  const LN_DA_CO_VIDEO = ['xe-day', 'det-chieu', 'duc-nhom', 'lam-muoi', 'say-cau', 'ken-dong'];   // đã có ở mục Trải nghiệm thực
  function renderLivelihood() {
    const tours = $('#sk-tours');
    if (!tours) return;
    const byId = Object.fromEntries(SITES.map((s) => [s.id, s]));
    tours.innerHTML = (Eco.TOURS || []).map((t) =>
      '<li><button type="button" data-tour="' + t.id + '"><b>' + esc(t.name) + '</b><small>' + t.days + ' ngày · ' +
      esc(t.stops.map((id) => (byId[id] || {}).short || id).join(' → ')) + '</small></button></li>').join('');
    const addr = (s) => ((s.facts || []).find((f) => f[0] === 'Địa chỉ') || [])[1] || REGIONS[s.region] || '';
    const crafts = SITES.filter((s) => s.themes.includes('lang-nghe'))
      .map((s) => '<li><a href="#/' + s.id + '"><b>' + esc(s.short) + '</b><small>' + esc(addr(s)) + ' · xem 360°</small></a></li>');
    const haiHau = (window.LANG_NGHE || []).filter((n) => !LN_DA_CO_VIDEO.includes(n.ma)).map((n) =>
      '<li><a href="https://www.youtube.com/watch?v=' + n.video.id + '" target="_blank" rel="noopener"><b>' + esc(n.ten) + '</b><small>' + esc(n.dia_danh) + ' · video học sinh</small></a></li>');
    $('#sk-crafts').innerHTML = crafts.concat(haiHau).join('');

    tours.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tour]');
      if (b && window.EcoUI) window.EcoUI.showQuote(b.dataset.tour);
    });
    // bản đồ homestay của Google Maps: chỉ nạp khi trang Kết nối cộng đồng được mở (cần mạng)
    document.addEventListener('eco:page', (e) => {
      const box = $('#sk-map');
      if (e.detail !== 'ket-noi' || !box || box.dataset.loaded) return;
      box.dataset.loaded = '1';
      const f = document.createElement('iframe');
      f.src = box.dataset.src; f.title = 'Bản đồ homestay ở Ninh Bình (Google Maps)'; f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.prepend(f);
    });
  }

  /* ---------- Khu quản lí: SHA-256 (chạy cả khi mở file trực tiếp) ---------- */
  function sha256(str) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const bytes = Array.from(new TextEncoder().encode(str));
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bitLen >>> (i * 8)) & 0xff);
    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const rot = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < bytes.length; o += 64) {
      const w = new Array(64);
      for (let i = 0; i < 16; i++) w[i] = (bytes[o + 4 * i] << 24) | (bytes[o + 4 * i + 1] << 16) | (bytes[o + 4 * i + 2] << 8) | bytes[o + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, k] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (k + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        k = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h = h.map((x, i) => (x + [a, b, c, d, e, f, g, k][i]) | 0);
    }
    return h.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }

  /* ---------- Dữ liệu quản lí ----------
   * Có ECO_CONFIG.apiUrl: mật khẩu kiểm ở máy chủ Apps Script, máy chủ chỉ trả liên hệ đã che (trừ khi nhập lại mật khẩu).
   * Chưa có: bản demo — mã PIN và lượt đặt lưu ở trình duyệt máy này.
   */
  const API = () => ((window.ECO_CONFIG || {}).apiUrl || '').trim();
  const KEY_PIN = 'eco_admin_pin', KEY_SALT = 'eco_admin_salt', KEY_BOOK = 'eco_bookings';
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  // mật khẩu: máy này đã tự đặt riêng thì dùng của máy; chưa thì dùng mật khẩu cài sẵn trong config.js (muối + mã băm)
  const CAI_SAN = () => ((window.ECO_CONFIG || {}).matKhau || {});
  const pinBam = () => get(KEY_PIN) || CAI_SAN().bam || null;
  const pinMuoi = () => (get(KEY_PIN) ? get(KEY_SALT) : CAI_SAN().muoi) || '';
  const hashPin = (pin, muoi) => sha256((muoi == null ? pinMuoi() : muoi) + '|' + pin);

  /* che thông tin khách: tên còn chữ cái đầu, liên hệ còn 2 số cuối */
  const maskName = (n) => String(n || '').trim().split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + '.').join(' ') || '—';
  const maskContact = (c) => { const s = String(c || '').replace(/\s+/g, ''); return s.length <= 2 ? '••' : '•'.repeat(Math.min(8, s.length - 2)) + s.slice(-2); };

  let unlocked = false, showContact = false, secret = '', rows = [];

  async function server(action, matkhau) {
    const r = await fetch(API(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, matkhau }) });
    return r.json();
  }

  function bars(list, fmt) {
    const max = Math.max(1, ...list.map((r) => r[1]));
    return list.map(([label, v]) => '<div class="ql-bar"><span>' + esc(label) + '</span><i style="--w:' + (100 * v / max).toFixed(1) + '%"></i><b>' + esc(fmt ? fmt(v) : v) + '</b></div>').join('') ||
      '<p class="ql-empty">Chưa có dữ liệu.</p>';
  }
  function group(list, key, val) {
    const m = new Map();
    list.forEach((b) => m.set(key(b), (m.get(key(b)) || 0) + (val ? val(b) : 1)));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }

  function renderDash() {
    const list = rows;
    const people = list.reduce((s, b) => s + (Number(b.people) || 0), 0);
    const total = list.reduce((s, b) => s + (Number(b.total) || 0), 0);
    const local = list.reduce((s, b) => s + (Number(b.localMoney) || 0), 0);
    const co2 = list.reduce((s, b) => s + (Number(b.co2Saved) || 0), 0);
    $('#ql-mode').textContent = API() ? 'Nguồn: bảng tính Google của người quản lí (máy chủ Apps Script).' : 'Bản demo: số liệu của trình duyệt trên máy này.';
    $('#ql-kpi').innerHTML = [
      ['Lượt đặt tour', list.length.toLocaleString('vi-VN')],
      ['Tổng số khách', people.toLocaleString('vi-VN')],
      ['Giá trị đơn (dự kiến)', vnd(total)],
      ['Về cơ sở địa phương', vnd(local)],
      ['CO₂ tiết kiệm', co2.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' kg']
    ].map(([k, v]) => '<div><small>' + k + '</small><b>' + v + '</b></div>').join('');
    $('#ql-by-tour').innerHTML = bars(group(list, (b) => b.tourName || b.tourId));
    $('#ql-by-people').innerHTML = bars(group(list, (b) => b.tourName || b.tourId, (b) => Number(b.people) || 0), (v) => v + ' khách');
    $('#ql-by-plan').innerHTML = bars(group(list, (b) => b.plan || '—'));
    $('#ql-by-month').innerHTML = bars(group(list, (b) => String(b.date || b.at || '').slice(0, 7) || '—').sort((a, b) => a[0] < b[0] ? -1 : 1));
    const nm = (b) => (API() || showContact ? b.name : maskName(b.name));
    const ct = (b) => (API() || showContact ? b.contact : maskContact(b.contact));
    $('#ql-rows').innerHTML = list.slice().reverse().slice(0, 100).map((b) =>
      '<tr><td>' + esc(new Date(b.at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })) + '</td><td>' + esc(b.tourName) + '</td><td>' + esc(b.plan) +
      '</td><td class="r">' + esc(b.people) + '</td><td class="r">' + vnd(b.total) + '</td><td>' + esc(b.date || '—') +
      '</td><td>' + esc(nm(b)) + '</td><td>' + esc(ct(b)) + '</td></tr>').join('') ||
      '<tr><td colspan="8" class="ql-empty">Chưa có lượt đặt tour nào.</td></tr>';
    $('#ql-show').textContent = showContact ? 'Che lại thông tin khách' : 'Hiện liên hệ khách (nhập lại mật khẩu)';
    $('#ql-wipe').hidden = !!API();
  }

  function view(name) {
    ['ql-set', 'ql-login', 'ql-dash'].forEach((id) => { $('#' + id).hidden = id !== name; });
  }
  function lock() {
    unlocked = false; showContact = false; secret = ''; rows = [];
    $$('#du-lieu input').forEach((i) => { i.value = ''; });
    $$('#du-lieu .ql-err').forEach((e) => { e.hidden = true; });
    view(API() || pinBam() ? 'ql-login' : 'ql-set');
  }

  async function load(pass, withContact) {
    if (API()) {
      const j = await server(withContact ? 'lienhe' : 'thongke', pass);
      if (!j.ok) return j.loi || 'Mật khẩu chưa đúng.';
      rows = j.rows || [];
    } else {
      if (hashPin(pass) !== pinBam()) return 'Mật khẩu chưa đúng.';
      rows = read(KEY_BOOK, []);
    }
    return '';
  }

  function initAdmin() {
    if (!$('#du-lieu')) return;
    lock();
    $('#ql-set').addEventListener('submit', (e) => {
      e.preventDefault();
      const a = $('#ql-pin1').value.trim(), b = $('#ql-pin2').value.trim();
      const err = $('#ql-set .ql-err');
      if (a.length < 8) { err.textContent = 'Mật khẩu dài ít nhất 8 kí tự.'; err.hidden = false; return; }
      if (a !== b) { err.textContent = 'Hai lần nhập chưa giống nhau.'; err.hidden = false; return; }
      const muoi = Math.random().toString(36).slice(2) + Date.now().toString(36);
      set(KEY_SALT, muoi);
      if (!set(KEY_PIN, hashPin(a, muoi))) { err.textContent = 'Trình duyệt chặn lưu dữ liệu, chưa đặt được mật khẩu.'; err.hidden = false; return; }
      secret = a; rows = read(KEY_BOOK, []); unlocked = true; renderDash(); view('ql-dash');
    });
    $('#ql-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#ql-login .ql-err'), pass = $('#ql-pin').value.trim();
      err.hidden = true;
      try {
        const loi = await load(pass, false);
        if (loi) { err.textContent = loi; err.hidden = false; $('#ql-pin').value = ''; return; }
      } catch (x) { err.textContent = 'Chưa kết nối được máy chủ dữ liệu.'; err.hidden = false; return; }
      secret = pass; $('#ql-pin').value = ''; unlocked = true; renderDash(); view('ql-dash');
    });
    $('#ql-show').addEventListener('click', async () => {
      if (showContact) { showContact = false; await load(secret, false); renderDash(); return; }
      const pass = window.prompt('Nhập lại mật khẩu quản lí để xem liên hệ của khách:');
      if (!pass || pass.trim() !== secret) return;
      showContact = true;
      try { await load(secret, true); } catch (x) { showContact = false; }
      renderDash();
    });
    $('#ql-refresh').addEventListener('click', async () => { try { await load(secret, showContact); } catch (x) { /* giữ số cũ */ } renderDash(); });
    $('#ql-lock').addEventListener('click', lock);
    $('#ql-wipe').addEventListener('click', () => {
      if (!window.confirm('Xoá toàn bộ lượt đặt tour và mật khẩu riêng đã đặt trên máy này (trở về mật khẩu cài sẵn)? Không lấy lại được.')) return;
      try { [KEY_BOOK, KEY_PIN, KEY_SALT, 'eco_requests'].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* bỏ qua */ }
      lock();
    });
    document.addEventListener('eco:booking', () => { if (unlocked && !API()) { rows = read(KEY_BOOK, []); renderDash(); } });
    document.addEventListener('eco:page', (e) => { if (e.detail !== 'du-lieu' && unlocked) lock(); });   // rời trang là khoá lại
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHeritage();
    const f = $('#ds-filter');
    if (f) f.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { ds.region = b.dataset.r; renderHeritage(); } });
    renderLivelihood();
    initAdmin();
  });
})();
