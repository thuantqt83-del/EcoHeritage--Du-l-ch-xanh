(function () {
  'use strict';

  const SITES = window.HERITAGE, THEMES = window.THEMES, REGIONS = window.REGIONS;
  const byId = Object.fromEntries(SITES.map((s) => [s.id, s]));

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const state = { theme: 'all', region: 'all', current: null, viewer: null, rotate: true, token: 0, lastFocus: null };

  /* ---------- hero: dãy núi vẽ bằng SVG ---------- */
  function ridgePath(seed, n, hMin, hMax, wMin, wMax) {
    const R = window.Scenes.rng(seed), W = 1440, H = 420;
    const bumps = Array.from({ length: n }, () => ({ c: R(), h: hMin + R() * (hMax - hMin), w: wMin + R() * (wMax - wMin) }));
    let d = 'M0 ' + H;
    for (let i = 0; i <= 240; i++) {
      const x = i / 240;
      let h = 0;
      for (const b of bumps) {
        let dx = x - b.c; dx -= Math.round(dx);
        h = Math.max(h, b.h * Math.exp(-Math.pow(Math.abs(dx) / b.w, 2.2)));
      }
      d += ' L' + (x * W).toFixed(1) + ' ' + (H - h).toFixed(1);
    }
    return d + ' L' + W + ' ' + H + ' Z';
  }

  function initHero() {
    if ($('#ridge1')) {
      $('#ridge1').setAttribute('d', ridgePath(5, 9, 260, 380, 0.014, 0.026));
      $('#ridge2').setAttribute('d', ridgePath(17, 8, 220, 340, 0.018, 0.032));
      $('#ridge3').setAttribute('d', ridgePath(29, 6, 170, 290, 0.024, 0.05));
    }
    if ($('#ph-banner-img')) window.Scenes.thumb(byId['trang-an'], 640, 360).then((c) => { $('#ph-banner-img').src = c.toDataURL('image/jpeg', 0.86); });

    const ridges = $$('.ridge');
    let ticking = false;
    window.addEventListener('scroll', () => {
      $('#site-header').classList.toggle('scrolled', window.scrollY > 8);
      if (ticking || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      ticking = true;
      requestAnimationFrame(() => {
        ridges.forEach((r) => { r.style.transform = 'translateY(' + (window.scrollY * Number(r.dataset.speed)).toFixed(1) + 'px)'; });
        ticking = false;
      });
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
      $$('.reveal').forEach((el) => io.observe(el));
    } else {
      $$('.reveal').forEach((el) => el.classList.add('in'));
    }
  }

  /* ---------- bộ lọc + thẻ ---------- */
  const icon360 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="12" rx="10" ry="4.5"/><path d="M12 7.5v9M4 9.5c2 1.4 5 2 8 2s6-.6 8-2"/></svg>';

  function visibleSites() {
    return SITES.filter((s) => (state.theme === 'all' || s.themes.includes(state.theme)) && (state.region === 'all' || s.region === state.region));
  }

  function chip(label, value, group, dot) {
    const pressed = state[group] === value;
    return '<button class="fchip" type="button" data-group="' + group + '" data-value="' + value + '" aria-pressed="' + pressed + '">' +
      (dot ? '<i style="--dot:' + dot + '"></i>' : '') + esc(label) + '</button>';
  }

  function renderFilters() {
    $('#f-theme').innerHTML = '<span class="chip-label">Chủ đề</span>' + chip('Tất cả', 'all', 'theme') +
      Object.entries(THEMES).map(([k, t]) => chip(t.label, k, 'theme', t.color)).join('');
    $('#f-region').innerHTML = '<span class="chip-label">Vùng</span>' + chip('Cả ba vùng', 'all', 'region') +
      Object.entries(REGIONS).map(([k, label]) => chip(label, k, 'region')).join('');
  }

  const thumbCache = new Map();
  let thumbQueue = Promise.resolve();
  function queueThumb(site) {
    if (thumbCache.has(site.id)) return Promise.resolve(thumbCache.get(site.id));
    thumbQueue = thumbQueue.then(() => new Promise((resolve) => setTimeout(resolve, 0)))
      .then(() => window.Scenes.thumb(site))
      .then((canvas) => { const url = canvas.toDataURL('image/jpeg', 0.86); thumbCache.set(site.id, url); return url; });
    return thumbQueue;
  }

  function cardHTML(s) {
    return '<a class="card" href="#/' + s.id + '" aria-label="Xem 360°: ' + esc(s.name) + '">' +
      '<span class="card-media" data-thumb="' + s.id + '"><span class="pill360">' + icon360 + '360°</span></span>' +
      '<span class="card-body">' +
        '<span class="tags">' + s.themes.map((t) => '<span class="tag" data-theme="' + t + '">' + esc(THEMES[t].label) + '</span>').join('') +
          '<span class="tag region">' + esc(REGIONS[s.region]) + '</span></span>' +
        '<h3>' + esc(s.short) + '</h3>' +
        '<p>' + esc(s.blurb) + '</p>' +
        '<span class="card-cta">Bước vào cảnh 360° <span aria-hidden="true">→</span></span>' +
      '</span></a>';
  }

  function renderCards() {
    const list = visibleSites();
    $('#result-count').textContent = 'Hiển thị ' + list.length + ' / ' + SITES.length + ' điểm';
    const grid = $('#grid');
    if (!list.length) {
      grid.innerHTML = '<p class="empty">Chưa có điểm nào khớp bộ lọc. <button class="btn btn-ghost btn-sm" type="button" id="reset-filter">Xem tất cả</button></p>';
      $('#reset-filter').addEventListener('click', () => { state.theme = 'all'; state.region = 'all'; renderFilters(); renderCards(); });
      return;
    }
    grid.innerHTML = list.map(cardHTML).join('');
    list.forEach((s) => {
      queueThumb(s).then((url) => {
        const holder = $('[data-thumb="' + s.id + '"]', grid);
        if (!holder) return;
        const img = new Image();
        img.alt = 'Cảnh minh họa ' + s.short;
        img.src = url;
        holder.insertBefore(img, holder.firstChild);
        holder.style.animation = 'none';
      });
    });
  }

  function initFilters() {
    renderFilters(); renderCards();
    $('#filters').addEventListener('click', (e) => {
      const b = e.target.closest('.fchip');
      if (!b) return;
      state[b.dataset.group] = b.dataset.value;
      renderFilters(); renderCards();
    });
    $$('[data-filter]').forEach((a) => a.addEventListener('click', () => { state.theme = a.dataset.filter; state.region = 'all'; renderFilters(); renderCards(); }));
  }

  /* ---------- bản đồ ---------- */
  function initMap() {
    const el = $('#map');
    $('#legend').innerHTML = Object.values(THEMES).map((t) => '<span><i style="--dot:' + t.color + '"></i>' + esc(t.label) + '</span>').join('');
    if (!window.L) { el.innerHTML = '<p class="map-fallback">Không tải được bản đồ.</p>'; return; }
    // nền vẽ ngay trên app (js/ban-do-nen.js): ranh giới tỉnh, sông Hồng — không cần mạng, không dùng ô bản đồ trực tuyến
    const L = window.L, NEN = window.BD_NEN || { vung: {}, gieng: [], song: [] };
    const map = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25, minZoom: 8, maxZoom: 13, attributionControl: true }).setView([20.4, 106.0], 9);
    map.attributionControl.setPrefix('').addAttribution('Ranh giới: geoBoundaries · Sông: Natural Earth');
    NEN.gieng.forEach((x) => {
      L.geoJSON(x.g, { interactive: false, style: { color: '#c9c2a8', weight: 1, fillColor: '#f4efe0', fillOpacity: 1 } }).addTo(map);
    });
    const MAU_VUNG = { 'ha-nam': '#1f8f9b', 'nam-dinh': '#c9972b', 'ninh-binh': '#2f7d3a' };
    Object.entries(NEN.vung).forEach(([k, g]) => {
      L.geoJSON(g, { interactive: false, style: { stroke: false, fillColor: '#fbf7ea', fillOpacity: 1 } }).addTo(map);         // nền đất
      L.geoJSON(g, { interactive: false, style: { color: MAU_VUNG[k], weight: 2, dashArray: '6 5', fillColor: MAU_VUNG[k], fillOpacity: 0.16 } }).addTo(map);
    });
    NEN.song.forEach((line) => L.polyline(line, { interactive: false, color: '#7cc3d1', weight: 5, opacity: 0.9 }).addTo(map));
    const nhan = (ll, text, cls) => L.marker(ll, { interactive: false, icon: L.divIcon({ className: 'bdtd-nhan ' + (cls || ''), html: '<span>' + text + '</span>', iconSize: null }) }).addTo(map);
    nhan([20.5, 105.86], 'VÙNG HÀ NAM', 'vung'); nhan([20.33, 106.32], 'VÙNG NAM ĐỊNH', 'vung'); nhan([20.13, 105.83], 'VÙNG NINH BÌNH', 'vung');
    nhan([20.75, 105.72], 'Hà Nội', 'gieng'); nhan([20.05, 105.62], 'Thanh Hóa', 'gieng'); nhan([20.5, 106.42], 'Thái Bình', 'gieng'); nhan([20.62, 105.4], 'Hòa Bình', 'gieng');
    nhan([20.0, 106.35], 'BIỂN ĐÔNG', 'bien'); nhan([20.38, 106.21], 'sông Hồng', 'song');
    const pts = [];
    SITES.forEach((s) => {
      const icon = L.divIcon({ className: '', html: '<span class="pin" style="background:' + THEMES[s.themes[0]].color + '"></span>', iconSize: [22, 22], iconAnchor: [11, 22], tooltipAnchor: [0, -18] });
      L.marker([s.lat, s.lng], { icon, title: s.short, keyboard: true }).addTo(map)
        .bindTooltip(esc(s.short) + ' · bấm để xem 360°', { direction: 'top' })
        .on('click', () => { location.hash = '#/' + s.id; });            // bấm ghim → mở thẳng cảnh 360°
      pts.push([s.lat, s.lng]);
    });
    map.fitBounds(pts, { padding: [40, 40] });
    map.on('click', () => map.scrollWheelZoom.enable());
  }

  /* ---------- trình xem 360° ---------- */
  function setInert(on) {
    ['main', '#site-header', '.site-footer'].forEach((sel) => { const el = $(sel); if (el) el.inert = on; });
  }

  function hotspotTooltip(div, h) {
    div.setAttribute('tabindex', '0');
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', h.label);
    div.innerHTML = '<span class="hs-dot"></span><span class="hs-label"></span><div class="hs-card"><strong></strong><p></p></div>';
    $('.hs-label', div).textContent = h.label;
    $('strong', div).textContent = h.label;
    $('p', div).textContent = h.text;
    const toggle = () => {
      const open = !div.classList.contains('open');
      $$('.hs.open').forEach((el) => el.classList.remove('open'));
      div.classList.toggle('open', open);
    };
    div.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    div.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  }

  function destroyViewer() {
    try { if (state.viewer) state.viewer.destroy(); } catch (err) { /* đã hủy */ }
    state.viewer = null;
    $('#pano').innerHTML = '';
  }

  function setLoading(on, text) {
    $('#v-loader').classList.toggle('show', on);
    if (text) $('#v-loader-text').textContent = text;
    if (on) $('#v-loader .spinner').style.display = '';
  }

  function showError(msg) {
    setLoading(true, msg);
    $('#v-loader .spinner').style.display = 'none';
  }

  function setRotateUI(on) {
    state.rotate = on;
    const b = $('#v-rotate');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Tạm dừng tự xoay' : 'Bật tự xoay');
    b.style.opacity = on ? '1' : '.6';
  }

  function fillPanel(site) {
    $('#v-name').textContent = site.short;
    $('#v-title').textContent = site.name;
    $('#v-blurb').textContent = site.blurb;
    $('#v-story').textContent = site.story;
    $('#v-green').textContent = site.green;
    $('#v-badge').hidden = !!site.photo;          // có ảnh thì không hiện dòng ghi chú (sếp chốt 31/10/2026); nguồn ảnh ghi ở NGUON-ANH-AI.md
    $('#v-badge').textContent = 'Đây là cảnh vẽ minh họa. Khi có ảnh 360° thật, cảnh sẽ được thay thế.';
    $('#v-tags').innerHTML = site.themes.map((t) => '<span class="tag" data-theme="' + t + '">' + esc(THEMES[t].label) + '</span>').join('') +
      '<span class="tag region">' + esc(REGIONS[site.region]) + '</span>';
    $('#v-facts').innerHTML = site.facts.map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>').join('');
    $('#v-exp-title').textContent = site.themes.includes('lang-nghe') ? 'Trải nghiệm nghề (gợi ý)' : 'Trải nghiệm gợi ý';
    $('#v-exp').innerHTML = site.experience.map((x) => '<li>' + esc(x) + '</li>').join('');
    $('#v-spots').innerHTML = window.Scenes.hotspots(site).map((h, i) =>
      '<li><button type="button" data-i="' + i + '"><span class="n">' + (i + 1) + '</span>' + esc(h.label) + '</button></li>').join('');
    $('#v-panel').scrollTop = 0;
  }

  async function openSite(id) {
    const site = byId[id];
    if (!site) return;
    const token = ++state.token;
    state.current = site;
    const viewerEl = $('#viewer');
    if (!viewerEl.classList.contains('open')) {
      state.lastFocus = document.activeElement;
      viewerEl.classList.add('open');
      document.body.classList.add('no-scroll');
      setInert(true);
    }
    fillPanel(site);
    destroyViewer();
    setLoading(true, 'Đang dựng cảnh 360°…');
    document.title = site.short + ' 360° – EcoHeritage';
    await new Promise((r) => setTimeout(r, 40));

    let url;
    try { url = await window.Scenes.panoramaURL(site); } catch (err) { if (token === state.token) showError('Không tạo được cảnh 360°.'); return; }
    if (token !== state.token) return;

    const view = window.Scenes.startView(site);
    try {
      state.viewer = window.Pano.create($('#pano'), {
        url, yaw: view.yaw, pitch: view.pitch, hfov: 95, minHfov: 50, maxHfov: 120,
        autoRotate: state.rotate ? 3 : 0, delay: 6000,
        hotSpots: window.Scenes.hotspots(site).map((h) => ({ yaw: h.yaw, pitch: h.pitch, render: (div) => hotspotTooltip(div, h) })),
        onLoad: () => { if (token === state.token) setLoading(false); },
        onError: () => { if (token === state.token) showError('Không hiển thị được cảnh 360°.'); }
      });
    } catch (err) {
      showError('Thiết bị hoặc trình duyệt này chưa hỗ trợ WebGL nên không xem được 360°.');
      return;
    }
    setRotateUI(state.rotate);
    $('#v-close').focus();
  }

  function closeViewer() {
    state.token++;
    state.current = null;
    destroyViewer();
    $('#viewer').classList.remove('open');
    document.body.classList.remove('no-scroll');
    setInert(false);
    document.title = 'EcoHeritage – Di sản xanh, hành trình bền vững | Hà Nam – Nam Định – Ninh Bình';
    if (state.lastFocus && document.contains(state.lastFocus)) state.lastFocus.focus();
  }

  function go(offset) {
    if (!state.current) return;
    const i = SITES.indexOf(state.current);
    location.hash = '#/' + SITES[(i + offset + SITES.length) % SITES.length].id;
  }

  function initViewer() {
    $('#v-close').addEventListener('click', () => { history.replaceState(null, '', location.pathname + location.search); closeViewer(); });
    $('#v-prev').addEventListener('click', () => go(-1));
    $('#v-next').addEventListener('click', () => go(1));
    $('#v-rotate').addEventListener('click', () => {
      if (!state.viewer) return;
      if (state.rotate) state.viewer.stopAutoRotate(); else state.viewer.startAutoRotate(3);
      setRotateUI(!state.rotate);
    });
    $('#v-zin').addEventListener('click', () => { if (state.viewer) state.viewer.zoom(-12); });
    $('#v-zout').addEventListener('click', () => { if (state.viewer) state.viewer.zoom(12); });
    $('#v-spots').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !state.viewer || !state.current) return;
      const h = window.Scenes.hotspots(state.current)[Number(b.dataset.i)];
      state.viewer.stopAutoRotate();
      setRotateUI(false);
      state.viewer.lookAt(h.pitch, h.yaw, 70, 1000);
    });
    $('#pano').addEventListener('click', () => $$('.hs.open').forEach((el) => el.classList.remove('open')));
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !$('#viewer').classList.contains('open')) return;
      const open = $$('.hs.open');
      if (open.length) { open.forEach((el) => el.classList.remove('open')); return; }
      $('#v-close').click();
    });
  }

  /* ---------- điều hướng bằng hash (#/ten-diem) ---------- */
  function route() {
    const m = location.hash.match(/^#\/([a-z0-9-]+)$/);
    if (m && byId[m[1]]) openSite(m[1]);
    else if ($('#viewer').classList.contains('open')) closeViewer();
  }

  initHero();
  initFilters();
  initMap();
  initViewer();
  window.addEventListener('hashchange', route);
  route();
})();
