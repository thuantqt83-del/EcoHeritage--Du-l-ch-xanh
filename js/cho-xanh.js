/* Chợ xanh: xem sản phẩm, bỏ vào giỏ, khách chọn cách nhận hàng và cách thanh toán, gửi đơn tới người bán.
 * Dữ liệu sản phẩm: js/cho-xanh-data.js. App KHÔNG thu tiền: khách trả trực tiếp cho người bán (tiền mặt khi nhận hoặc chuyển khoản).
 * Đơn gửi theo từng người bán (một giỏ nhiều người bán thì tách nhiều đơn). Có ECO_CONFIG.apiUrl thì ghi vào trang «DonHang»
 * của bảng tính Google; chưa có thì lưu ở trình duyệt (khoá eco_orders, bản demo).
 */
(function () {
  'use strict';

  const D = window.CHO_XANH;
  if (!D) return;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const vnd = (n) => Math.round(n).toLocaleString('vi-VN') + ' đ';
  const API = () => ((window.ECO_CONFIG || {}).apiUrl || '').trim();
  const KEY_CART = 'eco_cart', KEY_ORD = 'eco_orders';

  const banBy = Object.fromEntries(D.ban.map((b) => [b.id, b]));
  const costs = () => (window.Eco && window.Eco.SITE_COST) || {};
  D.sp.forEach((p) => { if (typeof p.gia === 'string') p.gia = costs()[p.gia.replace('diem:', '')] || 0; });
  const spBy = Object.fromEntries(D.sp.map((p) => [p.id, p]));

  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const state = { nhom: 'all', vung: 'all', q: '', cart: load(KEY_CART, []).filter((i) => spBy[i.id]) };
  const regions = () => window.REGIONS || { 'ha-nam': 'Hà Nam', 'nam-dinh': 'Nam Định', 'ninh-binh': 'Ninh Bình' };

  /* ---------- danh sách sản phẩm ---------- */
  function renderFilters() {
    const nh = [['all', 'Tất cả']].concat(Object.entries(D.nhom).map(([k, v]) => [k, v.ten]));
    $('#cx-nhom').innerHTML = nh.map(([k, t]) => '<button type="button" class="fchip" data-nhom="' + k + '" aria-pressed="' + (state.nhom === k) + '">' + esc(t) + '</button>').join('');
    const vg = [['all', 'Cả ba tỉnh']].concat(Object.entries(regions()));
    $('#cx-vung').innerHTML = vg.map(([k, t]) => '<button type="button" class="fchip" data-vung="' + k + '" aria-pressed="' + (state.vung === k) + '">' + esc(t) + '</button>').join('');
  }

  function media(p) {
    const nh = D.nhom[p.nhom];
    const tag = p.anh && !p.anh_that ? '<em class="cx-ill">Ảnh minh hoạ</em>' : '';
    if (p.anh) return '<div class="cx-media"><img src="' + esc(p.anh) + '" alt="' + esc(p.ten) + (p.anh_that ? '' : ' (ảnh minh hoạ)') + '" loading="lazy" width="480" height="270">' + tag + '</div>';
    return '<div class="cx-media cx-tile" style="--c:' + nh.mau + '"><span aria-hidden="true">' + (p.bieu_tuong || '🌿') + '</span></div>';
  }

  function renderList() {
    const q = state.q.trim().toLowerCase();
    const list = D.sp.filter((p) => {
      const b = banBy[p.ban];
      return (state.nhom === 'all' || p.nhom === state.nhom) && (state.vung === 'all' || b.vung === state.vung) &&
        (!q || (p.ten + ' ' + p.mo_ta + ' ' + b.ten + ' ' + b.dia).toLowerCase().includes(q));
    });
    $('#cx-count').textContent = list.length + ' sản phẩm';
    $('#cx-list').innerHTML = list.map((p) => {
      const b = banBy[p.ban], nh = D.nhom[p.nhom], exp = p.nhom === 'trai-nghiem';
      return '<article class="cx-card">' + media(p) +
        '<div class="cx-body"><span class="cx-cat" style="--c:' + nh.mau + '">' + esc(nh.ten) + '</span>' +
        '<h3>' + esc(p.ten) + '</h3>' +
        '<p class="cx-desc">' + esc(p.mo_ta) + '</p>' +
        '<p class="cx-ban">' + esc(b.ten) + ' · ' + esc(b.dia) + ', ' + esc(regions()[b.vung] || '') + '</p>' +
        (p.mua ? '<p class="cx-mua">' + esc(p.mua) + '</p>' : '') +
        '<div class="cx-foot"><b>' + vnd(p.gia) + '<small>/' + esc(p.dv) + '</small></b>' +
        '<button type="button" class="btn btn-primary btn-sm" data-add="' + p.id + '">' + (exp ? 'Đặt chỗ' : 'Thêm vào giỏ') + '</button></div></div></article>';
    }).join('') || '<p class="cx-empty">Chưa có sản phẩm phù hợp. Bạn thử bỏ bớt bộ lọc.</p>';
  }

  /* ---------- giỏ hàng ---------- */
  const cartCount = () => state.cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = () => state.cart.reduce((s, i) => s + i.qty * spBy[i.id].gia, 0);
  function persist() { save(KEY_CART, state.cart); renderBar(); }

  function add(id, d) {
    const it = state.cart.find((i) => i.id === id);
    if (it) it.qty = Math.max(0, Math.min(99, it.qty + d)); else if (d > 0) state.cart.push({ id, qty: 1 });
    state.cart = state.cart.filter((i) => i.qty > 0);
    persist();
  }

  function renderBar() {
    const bar = $('#cx-bar'), n = cartCount();
    bar.hidden = !n;
    $('#cx-bar-text').textContent = n ? 'Giỏ hàng: ' + n + ' mục · ' + vnd(cartTotal()) : '';
  }

  /* ---------- hộp thoại giỏ hàng và đặt mua ---------- */
  const groups = () => {   // gom theo người bán: mỗi người bán một đơn
    const m = new Map();
    state.cart.forEach((i) => { const p = spBy[i.id]; (m.get(p.ban) || m.set(p.ban, []).get(p.ban)).push({ p, qty: i.qty }); });
    return Array.from(m.entries()).map(([ban, items]) => {
      let opts = items.map((x) => x.p.giao).reduce((a, g) => a.filter((k) => g.includes(k)));
      if (!opts.length) opts = ['tai-co-so'];   // giỏ trộn nhiều kiểu: hẹn nhận tại cơ sở
      return { ban: banBy[ban], items, opts, total: items.reduce((s, x) => s + x.qty * x.p.gia, 0) };
    });
  };

  function renderCart() {
    const gs = groups();
    $('#cx-items').innerHTML = gs.map((g) =>
      '<div class="cx-grp" data-ban="' + g.ban.id + '"><h4>' + esc(g.ban.ten) + '<small>' + esc(g.ban.dia) + '</small></h4>' +
      g.items.map((x) => '<div class="cx-line"><span>' + esc(x.p.ten) + '<small>' + vnd(x.p.gia) + '/' + esc(x.p.dv) + '</small></span>' +
        '<span class="cx-step"><button type="button" data-d="-1" data-id="' + x.p.id + '" aria-label="Bớt một">−</button><b>' + x.qty + '</b>' +
        '<button type="button" data-d="1" data-id="' + x.p.id + '" aria-label="Thêm một">+</button></span><b class="cx-sub">' + vnd(x.qty * x.p.gia) + '</b></div>').join('') +
      '<label class="field">Cách nhận<select data-giao="' + g.ban.id + '">' + g.opts.map((k) => '<option value="' + k + '">' + esc(D.giao[k]) + '</option>').join('') + '</select></label></div>').join('');
    $('#cx-total').textContent = 'Tạm tính: ' + vnd(cartTotal()) + ' (chưa gồm phí giao nếu có)';
    const cartEmpty = !gs.length;
    $('#cx-empty').hidden = !cartEmpty;
    $('#cx-form').hidden = cartEmpty;
    syncFields();
  }

  function syncFields() {   // chỉ hỏi địa chỉ khi có đơn giao đi; chỉ hỏi ngày khi có trải nghiệm
    const giao = $$('#cx-items [data-giao]').map((s) => s.value);
    $('#cx-addr-wrap').hidden = !giao.some((k) => k === 'tan-noi' || k === 'chuyen-phat');
    $('#cx-date-wrap').hidden = !state.cart.some((i) => spBy[i.id].nhom === 'trai-nghiem');
  }

  function openCart() {
    const dlg = $('#cx-dialog');
    $('#cx-done').hidden = true; $('#cx-main').hidden = false; $('#cx-err').hidden = true;
    renderCart();
    if (!dlg.open) dlg.showModal();
  }

  async function send() {
    const err = $('#cx-err'), btn = $('#cx-send');
    const name = $('#cx-name').value.trim(), contact = $('#cx-contact').value.trim(), addr = $('#cx-addr').value.trim();
    const fail = (t) => { err.textContent = t; err.hidden = false; };
    if (!name || !contact) return fail('Vui lòng nhập họ tên và số điện thoại hoặc Zalo.');
    if (!/^[+0-9 .-]{8,15}$/.test(contact) && !/zalo/i.test(contact)) return fail('Số điện thoại chưa đúng, bạn kiểm tra lại giúp.');
    if (!$('#cx-addr-wrap').hidden && !addr) return fail('Bạn chọn giao tận nơi hoặc gửi chuyển phát nên cần nhập địa chỉ nhận hàng.');
    const pay = ($('input[name="cx-pay"]:checked') || {}).value || 'khi-nhan';
    const gs = groups();
    if (!gs.length) return fail('Giỏ hàng đang trống.');
    err.hidden = true; btn.disabled = true;
    const base = Date.now().toString(36).toUpperCase();
    const recs = gs.map((g, n) => {
      const giao = ($('#cx-items [data-giao="' + g.ban.id + '"]') || {}).value || g.opts[0];
      return {
        id: base + '-' + (n + 1), at: new Date().toISOString(), banId: g.ban.id, ban: g.ban.ten + ' · ' + g.ban.dia,
        items: g.items.map((x) => x.p.ten + ' ×' + x.qty + ' ' + x.p.dv).join('; '), soLuong: g.items.reduce((s, x) => s + x.qty, 0), tienHang: g.total,
        giao: D.giao[giao], thanhToan: D.thanhToan[pay], name, contact, address: giao === 'tan-noi' || giao === 'chuyen-phat' ? addr : '',
        date: $('#cx-date-wrap').hidden ? '' : $('#cx-date').value || '', note: $('#cx-note').value.trim()
      };
    });
    let ok = 0, where = 'trên máy này (bản demo)';
    if (API()) {
      where = 'đến người quản lí EcoHeritage để chuyển cho người bán';
      for (const r of recs) {
        try {
          const res = await fetch(API(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action: 'dathang' }, r)) });
          const j = await res.json();
          if (j.ok) { ok++; state.cart = state.cart.filter((i) => spBy[i.id].ban !== r.banId); } else break;
        } catch (e) { break; }
      }
    } else {
      const old = load(KEY_ORD, []); save(KEY_ORD, old.concat(recs).slice(-300)); ok = recs.length; state.cart = [];
    }
    btn.disabled = false; persist();
    if (ok < recs.length) {
      renderCart();
      return fail(ok ? 'Đã gửi ' + ok + '/' + recs.length + ' đơn. Phần còn lại chưa gửi được, bạn bấm gửi lại sau ít phút.' : 'Chưa gửi được, bạn thử lại sau ít phút.');
    }
    $('#cx-done-text').innerHTML = 'Đã gửi <b>' + recs.length + ' đơn</b> ' + esc(where) + '. Mã đơn: <b>' + esc(base) + '</b>.<br>Người bán sẽ liên hệ xác nhận theo số bạn để lại' +
      (pay === 'chuyen-khoan' ? ' và nhắn số tài khoản để bạn chuyển khoản.' : '. Bạn trả tiền khi nhận hàng hoặc khi đến trải nghiệm.') +
      '<br><small>EcoHeritage không thu tiền thay người bán.</small>';
    ['cx-name', 'cx-contact', 'cx-addr', 'cx-note', 'cx-date'].forEach((id) => { $('#' + id).value = ''; });
    $('#cx-main').hidden = true; $('#cx-done').hidden = false;
    document.dispatchEvent(new CustomEvent('eco:order'));
  }

  /* ---------- gắn sự kiện ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    if (!$('#cx-list')) return;
    renderFilters(); renderList(); renderBar();
    $('#cx-nhom').addEventListener('click', (e) => { const b = e.target.closest('[data-nhom]'); if (b) { state.nhom = b.dataset.nhom; renderFilters(); renderList(); } });
    $('#cx-vung').addEventListener('click', (e) => { const b = e.target.closest('[data-vung]'); if (b) { state.vung = b.dataset.vung; renderFilters(); renderList(); } });
    $('#cx-q').addEventListener('input', (e) => { state.q = e.target.value; renderList(); });
    $('#cx-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-add]'); if (!b) return;
      add(b.dataset.add, 1);
      b.textContent = '✓ Đã thêm'; setTimeout(() => { b.textContent = spBy[b.dataset.add].nhom === 'trai-nghiem' ? 'Đặt chỗ' : 'Thêm vào giỏ'; }, 1200);
    });
    $('#cx-open').addEventListener('click', openCart);
    $('#cx-items').addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (b) { add(b.dataset.id, Number(b.dataset.d)); renderCart(); } });
    $('#cx-items').addEventListener('change', (e) => { if (e.target.matches('[data-giao]')) syncFields(); });
    $('#cx-close').addEventListener('click', () => $('#cx-dialog').close());
    $('#cx-close2').addEventListener('click', () => $('#cx-dialog').close());
    $('#cx-keep').addEventListener('click', () => $('#cx-dialog').close());
    $('#cx-send').addEventListener('click', send);
  });
})();
