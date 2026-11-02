/* Dải ảnh đầu mỗi trang (trừ Trang chủ — giữ ảnh đầu trang riêng), dựng giống ảnh đầu trang chủ:
 * bên trái nền kem chứa nhãn, tiêu đề, lời dẫn của trang; bên phải ảnh địa danh. Ảnh để nguyên bản gốc (assets/anh-ai/<mã>.webp),
 * không lọc màu, không làm nét; trang có nhiều ảnh thì đổi ảnh nhẹ nhàng sau mỗi 7 giây.
 * Cách làm: chèn một <section data-page="…" class="dai-anh"> trước mục đầu tiên của trang, rồi CHUYỂN (không chép) nhãn – tiêu đề – lời dẫn
 * của mục đó vào dải ảnh, nên id tiêu đề và aria-labelledby vẫn đúng.
 */
(function () {
  'use strict';
  const ANH = {
    'di-san': ['hoa-lu', 'phat-diem', 'den-tran'],
    'du-lich-xanh': ['tam-coc', 'tam-chuc', 'trang-an', 'xuan-thuy'],
    'ket-noi': ['van-lam', 'doi-tam', 'y-yen'],
    'trai-nghiem': ['phu-day', 'nha-xa', 'tam-chuc'],
    'tro-ly': ['xuan-thuy', 'trang-an'],
    'truong-hoc': ['hoa-lu', 'van-lam', 'bai-dinh'],
    'ban-do': ['bai-dinh', 'tam-chuc'],
    'du-lieu': ['bach-long', 'phat-diem']
  };
  const DOI = 7000;
  const byId = Object.fromEntries((window.HERITAGE || []).map((s) => [s.id, s]));
  const timers = {};

  function build(page, ids) {
    const first = document.querySelector('main [data-page="' + page + '"]');
    const box = first && first.querySelector('.container');
    if (!box) return;
    // nhãn – tiêu đề – lời dẫn liền nhau ở đầu mục
    const head = [];
    for (const el of Array.from(box.children)) {
      if (el.matches('.eyebrow, .bh-title, .sec-title, .bh-lead, .sec-lead')) head.push(el); else break;
    }
    if (!head.length) return;
    const ok = ids.filter((id) => (window.ANH_AI || {})[id]);
    const sec = document.createElement('section');
    sec.className = 'dai-anh';
    sec.dataset.page = page;
    sec.innerHTML = '<div class="da-anh" aria-hidden="true">' + ok.map((id, i) =>
      '<img src="assets/anh-ai/' + id + '.webp" alt="" width="1280" height="720"' + (i ? ' loading="lazy"' : ' class="on"') + '>').join('') + '</div>' +
      '<div class="container da-chu"></div>' +
      (ok.length ? '<span class="da-ten">' + ok.map((id, i) => '<b' + (i ? '' : ' class="on"') + '>' + ((byId[id] || {}).short || '') + '</b>').join('') + '</span>' : '');
    const chu = sec.querySelector('.da-chu');
    head.forEach((el) => chu.appendChild(el));
    first.parentNode.insertBefore(sec, first);
    first.classList.add('sau-dai-anh');
    if (ok.length > 1) sec.dataset.n = ok.length;
  }

  function quay(page) {
    Object.values(timers).forEach(clearInterval);
    const sec = document.querySelector('.dai-anh[data-page="' + page + '"]');
    if (!sec || !sec.dataset.n || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const imgs = sec.querySelectorAll('.da-anh img'), ten = sec.querySelectorAll('.da-ten b');
    let k = 0;
    timers[page] = setInterval(() => {
      imgs[k].classList.remove('on'); if (ten[k]) ten[k].classList.remove('on');
      k = (k + 1) % imgs.length;
      imgs[k].classList.add('on'); if (ten[k]) ten[k].classList.add('on');
    }, DOI);
  }

  Object.entries(ANH).forEach(([p, ids]) => build(p, ids));
  document.addEventListener('eco:page', (e) => quay(e.detail));
})();
