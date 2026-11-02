/* Tách trang theo thanh menu (không có nút chuyển trang). Trang chủ: đầu trang, Giá trị cốt lõi, Nhận diện thương hiệu, Tính năng nổi bật.
 * Mỗi <section> mang data-page="<mã trang>"; địa chỉ #trang-<mã> mở thẳng trang đó.
 * Chuyển trang trượt ngang: trang sau vào từ bên phải, trang trước vào từ bên trái; trên điện thoại vuốt trái / phải để sang trang.
 * Báo sự kiện 'eco:page' cho các phần khác (bản đồ homestay nạp khi mở trang; video tự dừng; Dữ liệu quản lí tự khoá khi rời trang).
 */
(function () {
  'use strict';

  const IDS = ['trang-chu', 'di-san', 'du-lich-xanh', 'ket-noi', 'trai-nghiem', 'tro-ly', 'truong-hoc', 'ban-do', 'du-lieu'];   // hồ sơ dự án không đưa lên trang: lưu ở «EcoHeritage - Ho so du thi» (31/10/2026)
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  let cur = '';

  const pageOf = (el) => { const sec = el && el.closest('[data-page]'); return sec ? sec.dataset.page : null; };

  function go(id, target) {
    if (!IDS.includes(id)) return;
    const dir = cur && id !== cur ? (IDS.indexOf(id) > IDS.indexOf(cur) ? 'phai' : 'trai') : '';
    cur = id;
    $$('main [data-page]').forEach((s) => { s.hidden = s.dataset.page !== id; });
    $$('.nav-links a, .brand').forEach((a) => {
      const h = a.getAttribute('href') || '';
      const t = h.length > 1 ? document.getElementById(h.slice(1)) : null;
      a.classList.toggle('on', (pageOf(t) || (h === '#top' ? 'trang-chu' : '')) === id);
    });
    $$('main [data-page="' + id + '"] .reveal').forEach((el) => el.classList.add('in'));
    const dang = $('.nav-links a.on');                         // điện thoại: menu cuộn ngang tới mục đang xem
    if (dang && dang.parentElement.scrollWidth > dang.parentElement.clientWidth) dang.parentElement.scrollTo({ left: dang.offsetLeft - 16, behavior: 'smooth' });
    const main = $('main');
    if (main && dir) {
      main.classList.remove('vao-phai', 'vao-trai');
      void main.offsetWidth;                                  // chạy lại hiệu ứng
      main.classList.add('vao-' + dir);
    }
    history.replaceState(null, '', '#trang-' + id);
    if (target) target.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
    window.dispatchEvent(new Event('resize'));   // bản đồ Leaflet đo lại khung khi trang hiện ra
    document.dispatchEvent(new CustomEvent('eco:page', { detail: id }));
  }
  window.EcoPages = { go: (id) => go(id), current: () => cur };

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('paged');
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const h = a.getAttribute('href');
      if (h.startsWith('#/')) return;                               // #/ma-diem: trình xem 360°
      if (h === '#top' || h === '#') { e.preventDefault(); go('trang-chu'); return; }
      if (h.startsWith('#trang-')) { e.preventDefault(); go(h.slice(7)); return; }
      const el = document.getElementById(h.slice(1));
      const p = pageOf(el);
      if (!p) return;
      e.preventDefault();
      go(p, el.dataset.page ? null : el);
    });
    $('main').addEventListener('animationend', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('vao-phai', 'vao-trai'); });

    // vuốt ngang trên màn hình cảm ứng: trái → trang sau, phải → trang trước
    let x0 = 0, y0 = 0, t0 = 0, ok = false;
    const SKIP = 'input, textarea, select, iframe, #map, .leaflet-container, #viewer, .viewer, .tv-prog, .sk-map, [data-no-swipe]';
    document.addEventListener('touchstart', (e) => {
      ok = e.touches.length === 1 && !e.target.closest(SKIP) && !document.querySelector('dialog[open]');
      if (!ok) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      if (!ok) return;
      ok = false;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - t0 > 900) return;
      // vùng cuộn ngang (bảng rộng…) đang cuộn được thì để nó cuộn
      for (let el = e.target; el && el !== document.body; el = el.parentElement) {
        if (el.scrollWidth > el.clientWidth + 4 && /(auto|scroll)/.test(getComputedStyle(el).overflowX)) return;
      }
      const i = IDS.indexOf(cur) + (dx < 0 ? 1 : -1);
      if (i >= 0 && i < IDS.length) go(IDS[i]);
    }, { passive: true });

    const m = location.hash.match(/^#trang-([a-z-]+)$/);
    go(m && IDS.includes(m[1]) ? m[1] : 'trang-chu');
  });
})();
