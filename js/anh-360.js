/* Ảnh cho trình xem 360°: assets/360/<mã>.jpg.
 * Cả 14 di sản có ảnh toàn cảnh 360° do Gemini vẽ thẳng (equirectangular, tỉ lệ 2:1).
 * Nạp ngay sau data.js, trước app.js. */
window.ANH_360_AI = { 'trang-an': 1, 'hoa-lu': 1, 'bai-dinh': 1, 'phat-diem': 1, 'tam-chuc': 1, 'bach-long': 1, 'xuan-thuy': 1, 'den-tran': 1, 'phu-day': 1, 'van-lam': 1, 'nha-xa': 1, 'doi-tam': 1, 'y-yen': 1, 'tam-coc': 1 };
window.ANH_360_BAN = '?v=20261031d';   // đổi số này mỗi khi thay ảnh 360° → trình duyệt không dùng ảnh cũ đã lưu tạm
(window.HERITAGE || []).forEach((s) => { if ((window.ANH_AI || {})[s.id]) s.photo = 'assets/360/' + s.id + '.jpg' + window.ANH_360_BAN; });
