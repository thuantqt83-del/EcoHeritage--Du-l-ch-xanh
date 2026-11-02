/* Nút «Mã QR» góc trái dưới: hiện mã QR có logo dẫn tới trang EcoHeritage trên mạng (GitHub Pages) để khách quét bằng điện thoại. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'qr-nut'; b.innerHTML = '📱 <span>Mã QR</span>'; b.setAttribute('aria-label', 'Hiện mã QR mở trang EcoHeritage');
    const hop = document.createElement('div');
    hop.className = 'qr-hop'; hop.hidden = true; hop.setAttribute('role', 'dialog'); hop.setAttribute('aria-label', 'Mã QR trang EcoHeritage');
    hop.innerHTML = '<div class="qr-the"><button type="button" class="qr-dong" aria-label="Đóng">×</button>' +
      '<img src="assets/qr/trang-web.png" alt="Mã QR mở trang EcoHeritage" width="240" height="240">' +
      '<b>Quét để mở EcoHeritage</b></div>';
    document.body.appendChild(b); document.body.appendChild(hop);
    b.addEventListener('click', (e) => { e.stopPropagation(); hop.hidden = false; });
    hop.addEventListener('click', (e) => { if (e.target === hop || e.target.closest('.qr-dong')) hop.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hop.hidden = true; });
  });
})();
