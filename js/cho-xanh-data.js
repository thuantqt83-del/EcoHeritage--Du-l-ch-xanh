/* Dữ liệu «Chợ xanh»: người bán và sản phẩm. SỬA Ở ĐÂY khi có danh sách thật.
 * Hiện là DỮ LIỆU MẪU: tên cơ sở, giá và số lượng chỉ để minh hoạ, chưa phải báo giá của người bán.
 *
 * ban[]  : id, ten (tên cơ sở), dia (địa danh), vung ('ha-nam' | 'nam-dinh' | 'ninh-binh'), zalo (số Zalo, để '' nếu chưa có)
 * sp[]   : id, ten, nhom ('dac-san' | 'thu-cong' | 'trai-nghiem'), ban (id người bán), gia (đ), dv (đơn vị bán), mo_ta,
 *          anh (đường dẫn ảnh, bỏ trống thì hiện biểu tượng), bieu_tuong (emoji khi chưa có ảnh), anh_that (true nếu là ảnh chụp thật),
 *          giao (cách nhận: 'tan-noi' | 'chuyen-phat' | 'tai-co-so' | 'tai-diem'), mua (ghi chú mùa vụ, tuỳ chọn)
 * Trải nghiệm có thể đặt gia: 'diem:<mã điểm>' để lấy giá vé từ bảng giá tour (js/tours.js).
 */
(function (global) {
  'use strict';

  const GIAO_HANG = ['tan-noi', 'chuyen-phat', 'tai-co-so'];

  global.CHO_XANH = {
    nhom: {
      'dac-san': { ten: 'Nông sản & đặc sản', mau: '#d98a1f' },
      'thu-cong': { ten: 'Thủ công làng nghề', mau: '#1f8f9b' },
      'trai-nghiem': { ten: 'Trải nghiệm du lịch', mau: '#579744' }
    },
    giao: {
      'tan-noi': 'Người bán giao tận nơi (phí giao do người bán báo)',
      'chuyen-phat': 'Gửi chuyển phát (khách trả phí vận chuyển)',
      'tai-co-so': 'Tự đến lấy tại cơ sở',
      'tai-diem': 'Gặp tại điểm trải nghiệm'
    },
    thanhToan: {
      'khi-nhan': 'Trả tiền mặt khi nhận hàng / khi đến trải nghiệm',
      'chuyen-khoan': 'Chuyển khoản trực tiếp cho người bán (người bán nhắn số tài khoản qua số điện thoại bạn để lại)'
    },

    ban: [
      { id: 'hh-banh-nhan', ten: 'Hộ làm bánh nhãn, kẹo lạc (mẫu)', dia: 'Đông Cường, Hải Hậu', vung: 'nam-dinh', zalo: '' },
      { id: 'hh-muoi', ten: 'Hộ làm muối (mẫu)', dia: 'Hải Đông, Hải Quang', vung: 'nam-dinh', zalo: '' },
      { id: 'hh-cau', ten: 'Hộ làm cau khô (mẫu)', dia: 'Hải Đường, Hải Anh', vung: 'nam-dinh', zalo: '' },
      { id: 'hh-chieu', ten: 'Hộ dệt chiếu cói (mẫu)', dia: 'An Đạo, Hải An', vung: 'nam-dinh', zalo: '' },
      { id: 'hh-day', ten: 'Hộ xe đay (mẫu)', dia: 'Giáp Nam, Hải Hậu', vung: 'nam-dinh', zalo: '' },
      { id: 'hh-luoi', ten: 'Hộ đan lưới (mẫu)', dia: 'Hải Triều, Hải Xuân', vung: 'nam-dinh', zalo: '' },
      { id: 'hh-ken', ten: 'Cơ sở làm kèn đồng (mẫu)', dia: 'Phạm Pháo, Hải Anh', vung: 'nam-dinh', zalo: '' },
      { id: 'hh-gao', ten: 'Hợp tác xã gạo Hải Hậu (mẫu)', dia: 'Hải Hậu', vung: 'nam-dinh', zalo: '' },
      { id: 'nha-xa', ten: 'Làng lụa Nha Xá (mẫu)', dia: 'Nha Xá', vung: 'ha-nam', zalo: '' },
      { id: 'doi-tam', ten: 'Làng trống Đọi Tam (mẫu)', dia: 'Đọi Tam', vung: 'ha-nam', zalo: '' },
      { id: 'dai-hoang', ten: 'Vườn chuối ngự (mẫu)', dia: 'Đại Hoàng', vung: 'ha-nam', zalo: '' },
      { id: 'van-lam', ten: 'Làng thêu ren Văn Lâm (mẫu)', dia: 'Văn Lâm', vung: 'ninh-binh', zalo: '' },
      { id: 'y-yen', ten: 'Cụm nghề Ý Yên (mẫu)', dia: 'Ý Yên', vung: 'nam-dinh', zalo: '' },
      { id: 'nb-an', ten: 'Cơ sở đặc sản Ninh Bình (mẫu)', dia: 'Ninh Bình', vung: 'ninh-binh', zalo: '' },
      { id: 'gia-vien', ten: 'Hộ làm mắm tép (mẫu)', dia: 'Gia Viễn', vung: 'ninh-binh', zalo: '' },
      { id: 'tc-trang-an', ten: 'Hợp tác xã thuyền Tràng An (mẫu)', dia: 'Tràng An', vung: 'ninh-binh', zalo: '' },
      { id: 'tc-bach-long', ten: 'Làng muối Bạch Long (mẫu)', dia: 'Bạch Long', vung: 'nam-dinh', zalo: '' }
    ],

    sp: [
      /* ----- Nông sản và đặc sản ----- */
      { id: 'banh-nhan', ten: 'Bánh nhãn Hải Hậu', nhom: 'dac-san', ban: 'hh-banh-nhan', gia: 85000, dv: 'hộp 500 g', giao: GIAO_HANG,
        mo_ta: 'Bánh nhãn làm thủ công ở Đông Cường, ăn kèm trà. Hàng đặc sản làm quà.', anh: 'assets/bia-video/banh-nhan.webp', anh_that: true },
      { id: 'keo-lac', ten: 'Kẹo lạc Đông Cường', nhom: 'dac-san', ban: 'hh-banh-nhan', gia: 45000, dv: 'gói 300 g', giao: GIAO_HANG,
        mo_ta: 'Kẹo lạc cùng làng nghề với bánh nhãn, giòn và thơm mùi lạc rang.', bieu_tuong: '🥜' },
      { id: 'muoi-hai-dong', ten: 'Muối Hải Đông', nhom: 'dac-san', ban: 'hh-muoi', gia: 20000, dv: 'túi 1 kg', giao: GIAO_HANG,
        mo_ta: 'Muối phơi trên ruộng muối Hải Đông, hạt sạch, dùng nấu ăn và muối dưa.', anh: 'assets/bia-video/lam-muoi.webp', anh_that: true, mua: 'Hàng nhiều nhất vào mùa nắng' },
      { id: 'cau-kho', ten: 'Cau khô Hải Đường', nhom: 'dac-san', ban: 'hh-cau', gia: 90000, dv: 'túi 500 g', giao: GIAO_HANG,
        mo_ta: 'Cau sấy khô theo nghề truyền thống của Hải Đường.', anh: 'assets/bia-video/say-cau.webp', anh_that: true },
      { id: 'gao-tam', ten: 'Gạo tám Hải Hậu', nhom: 'dac-san', ban: 'hh-gao', gia: 130000, dv: 'túi 5 kg', giao: GIAO_HANG,
        mo_ta: 'Gạo tám thơm của vùng Hải Hậu, cơm dẻo, mùi thơm nhẹ.', bieu_tuong: '🌾' },
      { id: 'chuoi-ngu', ten: 'Chuối ngự Đại Hoàng', nhom: 'dac-san', ban: 'dai-hoang', gia: 70000, dv: 'kg', giao: ['tan-noi', 'tai-co-so'],
        mo_ta: 'Chuối ngự nhỏ, thơm, vỏ mỏng, đặc sản Hà Nam. Hàng tươi nên chỉ giao gần hoặc tự đến lấy.', bieu_tuong: '🍌', mua: 'Theo mùa vụ' },
      { id: 'com-chay', ten: 'Cơm cháy Ninh Bình', nhom: 'dac-san', ban: 'nb-an', gia: 90000, dv: 'hộp 500 g', giao: GIAO_HANG,
        mo_ta: 'Cơm cháy giòn, ăn kèm ruốc hoặc chà bông, đặc sản làm quà của Ninh Bình.', bieu_tuong: '🍘' },
      { id: 'mam-tep', ten: 'Mắm tép Gia Viễn', nhom: 'dac-san', ban: 'gia-vien', gia: 60000, dv: 'lọ 400 g', giao: GIAO_HANG,
        mo_ta: 'Mắm tép Gia Viễn, ăn với thịt luộc hoặc bún chả.', bieu_tuong: '🫙' },

      /* ----- Thủ công làng nghề ----- */
      { id: 'chieu-coi', ten: 'Chiếu cói An Đạo', nhom: 'thu-cong', ban: 'hh-chieu', gia: 180000, dv: 'chiếc', giao: ['tan-noi', 'tai-co-so', 'chuyen-phat'],
        mo_ta: 'Chiếu cói dệt thủ công ở An Đạo, mát và bền.', anh: 'assets/bia-video/det-chieu.webp', anh_that: true },
      { id: 'day-day', ten: 'Dây đay xe thủ công Giáp Nam', nhom: 'thu-cong', ban: 'hh-day', gia: 60000, dv: 'cuộn', giao: GIAO_HANG,
        mo_ta: 'Dây đay xe tay từ nghề xe đay Giáp Nam, dùng buộc, đan túi, làm đồ trang trí.', anh: 'assets/bia-video/xe-day.webp', anh_that: true },
      { id: 'tui-luoi', ten: 'Túi lưới đan thủ công Hải Triều', nhom: 'thu-cong', ban: 'hh-luoi', gia: 90000, dv: 'chiếc', giao: GIAO_HANG,
        mo_ta: 'Túi đan từ nghề đan lưới Hải Triều, hợp đi chợ, đi biển.', anh: 'assets/bia-video/dan-luoi.webp', anh_that: true },
      { id: 'ken-dong-mini', ten: 'Kèn đồng lưu niệm Phạm Pháo', nhom: 'thu-cong', ban: 'hh-ken', gia: 150000, dv: 'chiếc', giao: GIAO_HANG,
        mo_ta: 'Kèn đồng nhỏ làm lưu niệm từ nghề làm và sửa kèn đồng ở Phạm Pháo.', anh: 'assets/bia-video/ken-dong.webp', anh_that: true },
      { id: 'khan-lua', ten: 'Khăn lụa Nha Xá', nhom: 'thu-cong', ban: 'nha-xa', gia: 250000, dv: 'chiếc', giao: GIAO_HANG,
        mo_ta: 'Khăn lụa tơ tằm dệt ở làng lụa Nha Xá.', anh: 'assets/anh-ai/nha-xa.webp', bieu_tuong: '🧣' },
      { id: 'trong-mini', ten: 'Trống mini Đọi Tam', nhom: 'thu-cong', ban: 'doi-tam', gia: 180000, dv: 'chiếc', giao: GIAO_HANG,
        mo_ta: 'Trống nhỏ làm lưu niệm từ làng trống Đọi Tam.', anh: 'assets/anh-ai/doi-tam.webp', bieu_tuong: '🥁' },
      { id: 'khan-ren', ten: 'Khăn thêu ren Văn Lâm', nhom: 'thu-cong', ban: 'van-lam', gia: 120000, dv: 'chiếc', giao: GIAO_HANG,
        mo_ta: 'Khăn thêu ren tay của làng Văn Lâm.', anh: 'assets/anh-ai/van-lam.webp', bieu_tuong: '🧵' },
      { id: 'tranh-son-mai', ten: 'Tranh sơn mài mini Ý Yên', nhom: 'thu-cong', ban: 'y-yen', gia: 220000, dv: 'bức', giao: GIAO_HANG,
        mo_ta: 'Tranh sơn mài khổ nhỏ từ cụm làng nghề Ý Yên.', anh: 'assets/anh-ai/y-yen.webp', bieu_tuong: '🖼️' },

      /* ----- Trải nghiệm du lịch (giá lấy từ bảng giá tour; bán theo người) ----- */
      { id: 'tn-trang-an', ten: 'Thuyền chèo Tràng An', nhom: 'trai-nghiem', ban: 'tc-trang-an', gia: 'diem:trang-an', dv: 'người', giao: ['tai-diem'],
        mo_ta: 'Ngồi thuyền chèo tay qua hang động và thung nước của Tràng An.', anh: 'assets/anh-ai/trang-an.webp', bieu_tuong: '🛶' },
      { id: 'tn-van-lam', ten: 'Thêu thử ren ở Văn Lâm', nhom: 'trai-nghiem', ban: 'van-lam', gia: 'diem:van-lam', dv: 'người', giao: ['tai-diem'],
        mo_ta: 'Xem và thử thêu một mẫu ren cùng người làng nghề.', anh: 'assets/anh-ai/van-lam.webp', bieu_tuong: '🧵' },
      { id: 'tn-nha-xa', ten: 'Xem dệt lụa ở Nha Xá', nhom: 'trai-nghiem', ban: 'nha-xa', gia: 'diem:nha-xa', dv: 'người', giao: ['tai-diem'],
        mo_ta: 'Xem dệt lụa trên khung cửi và hỏi chuyện nghề.', anh: 'assets/anh-ai/nha-xa.webp', bieu_tuong: '🧣' },
      { id: 'tn-doi-tam', ten: 'Xem làm trống ở Đọi Tam', nhom: 'trai-nghiem', ban: 'doi-tam', gia: 'diem:doi-tam', dv: 'người', giao: ['tai-diem'],
        mo_ta: 'Xem công đoạn căng mặt trống tại làng trống Đọi Tam.', anh: 'assets/anh-ai/doi-tam.webp', bieu_tuong: '🥁' },
      { id: 'tn-bach-long', ten: 'Làng muối Bạch Long', nhom: 'trai-nghiem', ban: 'tc-bach-long', gia: 'diem:bach-long', dv: 'người', giao: ['tai-diem'],
        mo_ta: 'Đi thăm ruộng muối và xem thu muối (đẹp nhất vào mùa nắng).', anh: 'assets/anh-ai/bach-long.webp', bieu_tuong: '🧂' },
      { id: 'tn-banh-nhan', ten: 'Xem làm bánh nhãn ở Đông Cường', nhom: 'trai-nghiem', ban: 'hh-banh-nhan', gia: 100000, dv: 'người', giao: ['tai-diem'],
        mo_ta: 'Xem các công đoạn làm bánh nhãn, kẹo lạc và nếm thử tại nhà người làm nghề.', anh: 'assets/bia-video/banh-nhan.webp', anh_that: true }
    ]
  };
})(window);
