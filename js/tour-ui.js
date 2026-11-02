/* Mục Trải nghiệm thực: tour thiết kế sẵn → «video hành trình» → đặt tour. Trường học, đối tác.
 * Công thức giá, CO₂ nằm trong tours.js (số minh hoạ). Báo giá tham khảo hiện cạnh video: 3 phương án, chi tiết từng khoản (ghi rõ giá minh hoạ).
 * Lượt đặt: có ECO_CONFIG.apiUrl (Apps Script) thì gửi lên bảng tính của người quản lí; chưa có thì lưu ở trình duyệt (bản demo).
 */
(function () {
  'use strict';

  const Eco = window.Eco, SITES = window.HERITAGE;
  if (!Eco || !SITES) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tr = (n) => (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' triệu';
  const vnd = (n) => (Math.round(n / 1000) * 1000).toLocaleString('vi-VN') + ' đ';
  const byId = Object.fromEntries(SITES.map((s) => [s.id, s]));
  const API = () => ((window.ECO_CONFIG || {}).apiUrl || '').trim();

  const state = { tour: Eco.TOURS[0].id, plan: 'xanh-nhat', people: 4, from: 'stop' };

  function store(key, item) {
    try {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(item);
      localStorage.setItem(key, JSON.stringify(list.slice(-500)));
      return list.length;
    } catch (err) { return 0; }
  }
  const count = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]').length; } catch (err) { return 0; } };

  /* ---------- thẻ tour thiết kế sẵn ---------- */
  function renderTours() {
    const box = $('#tour-cards');
    if (!box) return;
    box.innerHTML = Eco.TOURS.map((t) =>
      '<button type="button" class="tc' + (t.id === state.tour ? ' on' : '') + '" data-tour="' + t.id + '" aria-pressed="' + (t.id === state.tour) + '">' +
        '<span class="tc-days">' + t.days + ' ngày</span><b>' + esc(t.name) + '</b>' +
        '<span class="tc-route">' + t.stops.map((id) => esc((byId[id] || {}).short || id)).join(' → ') + '</span>' +
        '<span class="tc-gia">từ ' + vnd(Eco.quote(t.id, 'tiet-kiem', 4, 'stop').perPerson) + '/người</span>' +
        '<span class="tc-play">▶ Xem video hành trình</span></button>').join('');
  }

  /* ---------- bảng tác động xanh của phương án đang chọn (số ước tính, công thức ở tours.js) ---------- */
  const TREE_KG = 21; // một cây xanh hấp thụ khoảng 21 kg CO₂ mỗi năm (số ước tính thường dùng)
  const num = (n, d) => n.toLocaleString('vi-VN', { maximumFractionDigits: d || 0 });
  function impact(q) {
    const co2All = q.co2Saved * q.people, share = q.total ? Math.round(100 * q.localMoney / q.total) : 0;
    const trees = co2All / TREE_KG;
    return '<div class="tv-impact" aria-label="Tác động xanh của phương án đã chọn">' +
      '<h4>Tác động xanh <small>(' + esc(q.plan.label) + ', ' + q.people + ' người)</small></h4>' +
      '<div class="ti-score"><b>' + q.score + '</b><span>/100 điểm xanh</span><i style="--w:' + q.score + '%"></i></div>' +
      '<ul>' +
        '<li><b>' + num(co2All, 1) + ' kg</b><span>CO₂ tiết kiệm' + (q.co2SavedPct ? ' (−' + q.co2SavedPct + '% so với đi ô tô riêng)' : '') + '</span></li>' +
        (trees >= 1 ? '<li><b>≈ ' + num(trees, 1) + ' cây</b><span>xanh hấp thụ CO₂ trong một năm</span></li>'
          : '<li><b>≈ ' + num(Math.max(1, trees * 365)) + ' ngày</b><span>hấp thụ CO₂ của một cây xanh</span></li>') +
        '<li><b>' + vnd(q.localMoney) + '</b><span>về hộ và cơ sở địa phương (≈ ' + share + '% giá tour)</span></li>' +
      '</ul>' +
      '<details><summary>Cách tính</summary><p>CO₂ = số km từng chặng × hệ số phát thải của phương tiện, so với đi ô tô riêng cùng quãng đường (0,085 kg/người/km). ' +
      'Phần về địa phương = ' + Math.round(Eco.ASSUMPTIONS.LOCAL_SHARE * 100) + '% chi phí vé, ăn, nghỉ. 1 cây ≈ ' + TREE_KG + ' kg CO₂/năm. Đây là số ước tính của bản demo, chưa phải kiểm toán carbon.</p></details>' +
      '</div>';
  }

  function select(tourId, autoplay) {
    if (Eco.tourById[tourId]) state.tour = tourId;
    renderTours();
    const t = Eco.tourById[state.tour];
    $('#tv-name').textContent = t.name;
    $('#tv-tag').textContent = t.tagline;
    $('#tv-hl').innerHTML = t.highlights.map((h) => '<li>' + esc(h) + '</li>').join('');
    // báo giá tham khảo: 3 phương án cho nhóm 4 người, chi tiết từng khoản của phương án đang chọn
    const plans = Object.keys(Eco.PLANS).map((id) => Eco.quote(t.id, id, state.people, state.from));
    const q = plans.find((x) => x.plan.id === state.plan) || plans[plans.length - 1];
    $('#tv-gia').innerHTML = '<h4>Báo giá tham khảo <small>(' + state.people + ' người)</small></h4>' +
      '<div class="tv-plans">' + plans.map((x) => '<button type="button" data-plan="' + x.plan.id + '" class="' + (x === q ? 'on' : '') + '"><b>' + esc(x.plan.label) +
        '</b><span>' + vnd(x.perPerson) + '/người</span></button>').join('') + '</div>' +
      '<table>' + q.lines.map((l) => '<tr><td>' + esc(l.label) + '</td><td>' + vnd(l.amount) + '</td></tr>').join('') +
      '<tr class="sum"><td>Tổng ' + state.people + ' người</td><td>' + vnd(q.total) + '</td></tr></table>' +
      impact(q) +
      '<p class="note">Giá minh hoạ của bản demo; khi vận hành lấy theo bảng giá của đối tác.</p>';
    if (window.TourVideo) window.TourVideo.load(t, Eco.quote(t.id, state.plan, state.people, state.from), autoplay);
  }

  /* ---------- đặt tour ---------- */
  function initBooking() {
    const dlg = $('#quote-dialog');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const open = () => {
      const t = Eco.tourById[state.tour];
      $('#qd-summary').textContent = 'Tour «' + t.name + '» · ' + t.days + ' ngày · ' + t.stops.map((id) => (byId[id] || {}).short || id).join(' → ');
      $('#qd-people').value = state.people;
      $('#qd-form-wrap').hidden = false; $('#qd-done').hidden = true; $('#qd-err').hidden = true;
      dlg.showModal();
      $('#qd-name').focus();
    };
    document.addEventListener('click', (e) => { if (e.target.closest('[data-book]')) open(); });
    $('#qd-cancel').addEventListener('click', () => dlg.close());
    $('#qd-close').addEventListener('click', () => dlg.close());
    $('#qd-send').addEventListener('click', async () => {
      const name = $('#qd-name').value.trim(), contact = $('#qd-contact').value.trim();
      const people = Math.max(1, Math.min(200, Math.round(Number($('#qd-people').value) || 1)));
      if (!name || !contact) { $('#qd-err').textContent = 'Vui lòng nhập họ tên và số liên hệ.'; $('#qd-err').hidden = false; return; }
      state.people = people;
      const q = Eco.quote(state.tour, state.plan, people, state.from);
      const rec = {
        id: Date.now().toString(36), at: new Date().toISOString(),
        tourId: q.tour.id, tourName: q.tour.name, region: q.tour.region, plan: q.plan.label, people,
        total: Math.round(q.total), localMoney: Math.round(q.localMoney || 0), co2Saved: q.co2Saved || 0,
        date: $('#qd-date').value || '', name, contact, note: $('#qd-note').value.trim()
      };
      const btn = $('#qd-send');
      btn.disabled = true;
      let ok = true, where = 'trên máy này (bản demo)';
      if (API()) {
        try {
          const r = await fetch(API(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: 'dattour' }, rec)) });
          const j = await r.json();
          ok = !!j.ok; where = 'đến người quản lí';
        } catch (err) { ok = false; }
      } else store('eco_bookings', rec);
      btn.disabled = false;
      if (!ok) { $('#qd-err').textContent = 'Chưa gửi được, bạn thử lại sau ít phút.'; $('#qd-err').hidden = false; return; }
      document.dispatchEvent(new CustomEvent('eco:booking'));
      $('#qd-text').textContent = 'Đã gửi yêu cầu ' + where + ': tour «' + q.tour.name + '», ' + people + ' người' + (rec.date ? ', ngày ' + rec.date : '') +
        '. Thông tin liên hệ của bạn chỉ người quản lí xem được.';
      ['qd-name', 'qd-contact', 'qd-note'].forEach((id) => { $('#' + id).value = ''; });
      $('#qd-form-wrap').hidden = true; $('#qd-done').hidden = false;
    });
  }

  /* ---------- trường học ---------- */
  function initSchool() {
    const el = $('#pack-trip-price');
    if (el) el.textContent = tr(Eco.quote('ha-nam-lua-trong', 'xanh-nhat', 40, 'stop').perPerson).replace(' triệu', ' tr');
  }

  /* ---------- đối tác ---------- */
  function initPartners() {
    const sel = $('#p-region');
    if (!sel) return;
    sel.innerHTML = Object.entries(window.REGIONS).map(([k, v]) => '<option value="' + k + '">' + esc(v) + '</option>').join('');
    $('#partner-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#p-name').value.trim(), contact = $('#p-contact').value.trim(), ok = $('#p-ok');
      if (!name || !contact) { ok.hidden = false; ok.style.background = '#fbe3da'; ok.style.color = '#7a2d12'; ok.textContent = 'Vui lòng nhập tên cơ sở và số liên hệ.'; return; }
      const n = store('eco_partners', { at: new Date().toISOString(), name, type: $('#p-type').value, region: $('#p-region').value, service: $('#p-service').value.trim(), contact,
        green: ['p-c1', 'p-c2', 'p-c3'].filter((id) => $('#' + id).checked).length });
      ok.hidden = false; ok.style.background = ''; ok.style.color = '';
      ok.textContent = 'Đã ghi nhận “' + name + '” (bản demo, lưu trên máy này, hiện có ' + (n || count('eco_partners')) + ' đăng ký). Khi vận hành, đội thi sẽ liên hệ xác minh và khảo sát thực tế.';
      $('#partner-form').reset();
    });
  }

  /* ---------- API cho trợ lí Heri và các mục khác ---------- */
  function show(tourId, planId, people, from) {
    if (Eco.PLANS[planId]) state.plan = planId;
    if (people) state.people = Math.max(1, Math.min(200, Math.round(people)));
    if (from) state.from = from;
    if (window.EcoPages) window.EcoPages.go('trai-nghiem');
    select(tourId, true);
    const v = $('#tour-video');
    if (v) v.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  window.EcoUI = { showQuote: show, select };

  renderTours(); initBooking(); initSchool(); initPartners();
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#tv-gia [data-plan]');
    if (b) { state.plan = b.dataset.plan; select(state.tour, false); }
  });
  const cards = $('#tour-cards');
  if (cards) cards.addEventListener('click', (e) => { const b = e.target.closest('.tc'); if (b) show(b.dataset.tour); });
  document.addEventListener('DOMContentLoaded', () => select(state.tour, false));
})();
