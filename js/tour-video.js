/* «Video hành trình»: khách chọn tour → trình chiếu tự chạy từng điểm dừng (ảnh, ngày, chặng đi, câu chuyện ngắn),
 * thanh tiến trình, tạm dừng, xem lại, thuyết minh bằng giọng đọc của trình duyệt (nếu máy có giọng tiếng Việt).
 * Ảnh: ưu tiên ảnh AI ở assets/anh-ai/<mã>.webp (khai báo trong window.ANH_AI), chưa có thì dùng hình vẽ minh hoạ của cảnh 360°.
 */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = Object.fromEntries((window.HERITAGE || []).map((s) => [s.id, s]));

  /* ---------- ảnh cho mỗi di sản: AI nếu có, không thì hình vẽ 360° ---------- */
  const cache = {};
  window.EcoImg = function (site, w, h) {
    if (!site) return Promise.resolve('');
    if ((window.ANH_AI || {})[site.id]) return Promise.resolve('assets/anh-ai/' + site.id + '.webp');
    const k = site.id + w;
    if (!cache[k]) cache[k] = window.Scenes ? window.Scenes.thumb(site, w || 960, h || 540).then((c) => c.toDataURL('image/jpeg', 0.85)) : Promise.resolve('');
    return cache[k];
  };
  window.EcoImgLabel = (site) => ((window.ANH_AI || {})[site.id] ? 'Ảnh minh hoạ do AI tạo' : 'Hình vẽ minh hoạ');

  const DUR = { title: 3800, stop: 6000, end: 5200 };
  let scenes = [], total = 0, elapsed = 0, playing = false, last = 0, cur = -1, raf = 0, voice = true, tour = null;
  const LB = () => window.LOI_BINH || { files: {}, text: {} };
  const audio = new Audio();
  audio.preload = 'auto';
  audio.addEventListener('ended', () => document.dispatchEvent(new CustomEvent('eco:loibinh', { detail: false })));

  function build(t, q) {
    tour = t;
    scenes = [{ kind: 'title', key: 'tour-' + t.id }];
    let legBefore = null;
    q.days.forEach((d) => d.items.forEach((it) => {
      if (it.type === 'leg') legBefore = it;
      else { scenes.push({ kind: 'stop', site: byId[it.id], day: d.day, leg: legBefore, key: it.id }); legBefore = null; }
    }));
    scenes.push({ kind: 'end', q, key: 'ket-thuc' });
    let t0 = 0;
    scenes.forEach((s) => {
      const f = LB().files[s.key];
      s.start = t0; s.dur = Math.max(DUR[s.kind], f ? Math.round(f.dur * 1000) + 900 : 0); t0 += s.dur;
    });
    total = t0;
  }

  function routeStrip(activeIdx) {
    const stops = scenes.filter((s) => s.kind === 'stop');
    return '<ol class="tv-route">' + stops.map((s, i) => {
      const n = scenes.indexOf(s);
      return '<li class="' + (n < activeIdx ? 'done' : n === activeIdx ? 'now' : '') + '"><i></i><span>' + esc(s.site.short) + '</span></li>';
    }).join('') + '</ol>';
  }

  function hush() {
    audio.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    document.dispatchEvent(new CustomEvent('eco:loibinh', { detail: false }));
  }

  /* lời bình: tệp giọng đọc đã tạo (EverAI) nếu có, không thì giọng đọc của trình duyệt */
  function say(text, key) {
    if (!voice) return;
    hush();
    const f = LB().files[key];
    text = LB().text[key] || text;
    if (f) {
      audio.src = f.src;
      audio.play().then(() => document.dispatchEvent(new CustomEvent('eco:loibinh', { detail: true }))).catch(() => {});
      return;
    }
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    const v = window.speechSynthesis.getVoices().find((x) => /^vi/i.test(x.lang));
    if (v) u.voice = v;
    u.rate = 1;
    window.speechSynthesis.speak(u);
  }

  async function show(i) {
    cur = i;
    const s = scenes[i], stage = $('#tv-stage');
    if (!stage || !s) return;
    const frame = document.createElement('div');
    frame.className = 'tv-frame';
    let text = '';
    if (s.kind === 'title') {
      const first = scenes.find((x) => x.kind === 'stop');
      const img = first ? await window.EcoImg(first.site, 960, 540) : '';
      frame.innerHTML = '<img class="tv-bg blur" src="' + img + '" alt="">' +
        '<div class="tv-title"><img src="assets/thuong-hieu/logo-96.png" alt="" width="64" height="67"><small>EcoHeritage · Hành trình xanh</small>' +
        '<h3>' + esc(tour.name) + '</h3><p>' + tour.days + ' ngày · ' + (scenes.length - 2) + ' điểm dừng</p><p class="tv-tagline">' + esc(tour.tagline) + '</p></div>';
      text = 'Hành trình ' + tour.name + ', ' + tour.days + ' ngày, ' + (scenes.length - 2) + ' điểm dừng. ' + tour.tagline;
    } else if (s.kind === 'stop') {
      const img = await window.EcoImg(s.site, 960, 540);
      const leg = s.leg ? '<span class="tv-leg">↳ ' + esc(s.leg.label) + (s.leg.km ? ' · ' + s.leg.km + ' km' : '') + '</span>' : '';
      frame.innerHTML = '<img class="tv-bg kb' + (i % 2 ? ' kb2' : '') + '" src="' + img + '" alt="' + esc(s.site.name) + '">' +
        '<div class="tv-lower"><span class="tv-day">Ngày ' + s.day + '</span>' + leg + '<h4>' + esc(s.site.name) + '</h4><p>' + esc(s.site.blurb) + '</p></div>' +
        routeStrip(i);
      text = 'Ngày ' + s.day + '. ' + s.site.name + '. ' + s.site.blurb;
    } else {
      const q = s.q, share = q.total ? Math.round(100 * q.localMoney / q.total) : 0;
      frame.innerHTML = '<div class="tv-end"><h3>Kết thúc hành trình «' + esc(tour.name) + '»</h3>' +
        '<ul><li><b>' + q.km.toLocaleString('vi-VN') + ' km</b><span>quãng đường</span></li>' +
        '<li><b>≈ ' + q.co2Saved.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' kg</b><span>CO₂ tiết kiệm mỗi người</span></li>' +
        '<li><b>≈ ' + share + '%</b><span>tiền về cơ sở địa phương</span></li></ul>' +
        '<p class="tv-note">Số ước tính theo phương án Xanh nhất (số minh hoạ của bản demo).</p>' +
        '<button class="btn btn-primary" type="button" data-book>Đặt tour này</button></div>' + routeStrip(scenes.length);
      text = 'Kết thúc hành trình. Mỗi người tiết kiệm khoảng ' + Math.round(q.co2Saved) + ' ki lô gam CO2.';
    }
    stage.appendChild(frame);
    requestAnimationFrame(() => frame.classList.add('in'));
    Array.from(stage.querySelectorAll('.tv-frame')).slice(0, -1).forEach((old) => { old.classList.add('out'); setTimeout(() => old.remove(), 900); });
    say(text, s.key);
  }

  function sceneAt(t) { for (let i = scenes.length - 1; i >= 0; i--) if (t >= scenes[i].start) return i; return 0; }

  function tick(now) {
    if (!playing) return;
    elapsed += now - last; last = now;
    if (elapsed >= total) { elapsed = total; playing = false; ui(); return; }
    const i = sceneAt(elapsed);
    if (i !== cur) show(i);
    ui();
    raf = setTimeout(() => tick(performance.now()), 60);
  }

  function ui() {
    const f = $('#tv-fill'), tm = $('#tv-time'), b = $('#tv-play'), big = $('#tv-big');
    if (f) f.style.width = (total ? 100 * elapsed / total : 0).toFixed(2) + '%';
    if (tm) tm.textContent = Math.floor(elapsed / 1000) + ' / ' + Math.round(total / 1000) + ' giây';
    if (b) { b.textContent = playing ? '❚❚' : '▶'; b.setAttribute('aria-label', playing ? 'Tạm dừng video' : 'Phát video'); }
    if (big) big.hidden = playing;
    const st = $('#tv-stage');
    if (st) st.classList.toggle('paused', !playing);
  }

  function play() {
    if (!scenes.length) return;
    if (elapsed >= total) { elapsed = 0; cur = -1; }
    playing = true; last = performance.now();
    if (cur < 0) show(sceneAt(elapsed));
    else if (voice && audio.src && audio.paused && !audio.ended && audio.currentTime > 0) audio.play().then(() => document.dispatchEvent(new CustomEvent('eco:loibinh', { detail: true }))).catch(() => {});
    clearTimeout(raf); raf = setTimeout(() => tick(performance.now()), 60); ui();
  }
  function pause() {
    playing = false; clearTimeout(raf);
    audio.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    document.dispatchEvent(new CustomEvent('eco:loibinh', { detail: false }));
    ui();
  }

  window.TourVideo = {
    load(t, q, autoplay) {
      pause();
      build(t, q);
      elapsed = 0; cur = -1;
      const st = $('#tv-stage');
      if (st) st.querySelectorAll('.tv-frame').forEach((x) => x.remove());
      show(0);
      ui();
      if (autoplay) play();
    },
    pause
  };

  document.addEventListener('DOMContentLoaded', () => {
    const b = $('#tv-play');
    if (!b) return;
    b.addEventListener('click', () => (playing ? pause() : play()));
    $('#tv-big').addEventListener('click', play);
    $('#tv-replay').addEventListener('click', () => { pause(); elapsed = 0; cur = -1; show(0); play(); });
    $('#tv-prog').addEventListener('click', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      elapsed = Math.max(0, Math.min(total - 1, total * (e.clientX - r.left) / r.width));
      show(sceneAt(elapsed)); last = performance.now(); ui();
    });
    // bấm vào màn hình video: đang chạy thì dừng (lời bình dừng theo), đang dừng thì chạy tiếp
    $('#tv-stage').addEventListener('click', (e) => {
      if (e.target.closest('[data-book], #tv-big')) return;
      if (playing) pause(); else play();
    });
    document.addEventListener('eco:page', (e) => { if (e.detail !== 'trai-nghiem') pause(); });
  });
})();
