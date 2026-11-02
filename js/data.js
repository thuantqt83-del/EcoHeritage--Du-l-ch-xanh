/* Dữ liệu di sản. Thêm điểm mới = thêm một object vào HERITAGE.
 *
 * - lat/lng là tọa độ gần đúng, cần kiểm tra lại bằng GPS khi đi thực địa.
 * - Thông tin tổng hợp để phục vụ dự án; đối chiếu nguồn chính thức (Ban quản lý, Sở Du lịch) trước khi công bố.
 * - Khi có ảnh 360° thật: đặt file vào assets/360/<id>.jpg (tỉ lệ 2:1), rồi điền `photo`
 *   và `hotspots` ([{ yaw, pitch, label, text }]) cho điểm đó. Không có `photo` thì trang dùng cảnh vẽ minh họa.
 */
window.SITE = {
  brand: 'Di sản xanh',
  tagline: 'Số hóa di sản · Du lịch xanh cùng AI',
  title: 'Số hóa di sản – Du lịch xanh cùng AI tại Ninh Bình'
};

window.REGIONS = {
  'ninh-binh': 'Vùng Ninh Bình',
  'ha-nam': 'Vùng Hà Nam',
  'nam-dinh': 'Vùng Nam Định'
};

window.THEMES = {
  'tam-linh': { label: 'Tâm linh', color: '#c9972b' },
  'lang-nghe': { label: 'Làng nghề', color: '#d9577a' },
  'thien-nhien': { label: 'Thiên nhiên & biển', color: '#1f7a5c' }
};

window.HERITAGE = [
  {
    id: 'trang-an',
    name: 'Quần thể danh thắng Tràng An',
    short: 'Tràng An',
    region: 'ninh-binh',
    themes: ['thien-nhien'],
    lat: 20.253, lng: 105.904,
    blurb: 'Núi đá vôi, sông nước và hang xuyên núi, được UNESCO ghi danh Di sản thế giới hỗn hợp năm 2014.',
    story: 'Thuyền chèo tay đưa du khách đi giữa những thung lũng ngập nước, luồn qua các hang tối rồi bất ngờ mở ra những khoảng trời rộng. Đây là nơi thiên nhiên và dấu tích lịch sử – tín ngưỡng cùng hiện diện.',
    facts: [['Địa chỉ', 'Phường Tây Hoa Lư, tỉnh Ninh Bình (bến thuyền Tràng An)'], ['Danh hiệu', 'Di sản thế giới UNESCO (2014)'], ['Loại hình', 'Hỗn hợp văn hóa – thiên nhiên']],
    experience: ['Đi thuyền chèo tay qua các hang xuyên núi', 'Ngắm cảnh sáng sớm hoặc cuối chiều khi ít khách', 'Dừng chân ở đền, phủ ven sông'],
    green: 'Chọn thuyền chèo tay, mang bình nước cá nhân, không xả rác xuống sông.',
    photo: null,
    scene: {
      sky: 'mist', terrain: 'karst', ground: 'water', seed: 11,
      landmarks: [
        { kind: 'boat', x: 0.50, s: 1.2, label: 'Thuyền chèo tay', text: 'Người lái đò chèo thuyền bằng sức người, không dùng động cơ — cách đi chậm giúp du khách nghe được tiếng nước và tiếng chim.' },
        { kind: 'cave', x: 0.24, s: 1.1, label: 'Hang xuyên núi', text: 'Dòng nước chảy xuyên qua chân núi đá vôi; thuyền đi qua hang nên ánh sáng và không khí thay đổi liên tục.' },
        { kind: 'hall', x: 0.80, s: 0.75, label: 'Đền ven sông', text: 'Những đền, phủ nhỏ nằm sát chân núi nhắc rằng nơi đây vừa là danh thắng vừa là không gian tín ngưỡng.' },
        { kind: 'birds', x: 0.64, s: 1, label: 'Chim nước', text: 'Vùng sông nước và núi đá là nơi trú của nhiều loài chim; giữ yên lặng sẽ dễ gặp chúng hơn.' }
      ]
    }
  },
  {
    id: 'tam-coc',
    name: 'Khu du lịch Tam Cốc – Bích Động',
    short: 'Tam Cốc – Bích Động',
    region: 'ninh-binh',
    themes: ['thien-nhien', 'tam-linh'],
    lat: 20.216, lng: 105.928,
    blurb: 'Thuyền chèo trên sông Ngô Đồng qua ba hang xuyên núi giữa đồng lúa, rồi lên chùa Bích Động nép trong vách đá.',
    story: 'Tam Cốc nghĩa là «ba hang»: Hang Cả, Hang Hai, Hang Ba nối nhau trên dòng Ngô Đồng. Mùa lúa chín, hai bên sông vàng rực giữa núi đá vôi. Gần đó, chùa Bích Động gồm nhiều lớp nép vào vách núi, lên từng bậc đá là thấy cả cánh đồng bên dưới.',
    facts: [['Địa chỉ', 'Bến thuyền Tam Cốc, phường Nam Hoa Lư, tỉnh Ninh Bình'], ['Danh hiệu', 'Thuộc Quần thể danh thắng Tràng An – Di sản thế giới (2014)'], ['Gần', 'Làng thêu ren Văn Lâm']],
    experience: ['Đi thuyền chèo tay qua Hang Cả, Hang Hai, Hang Ba', 'Ngắm đồng lúa hai bên sông (đẹp nhất mùa lúa chín)', 'Leo bậc đá lên chùa Bích Động'],
    green: 'Đạp xe từ bến thuyền sang Bích Động và làng ren Văn Lâm; không cho cá ăn đồ ngọt, không xả rác xuống sông.',
    photo: null,
    scene: {
      sky: 'day', terrain: 'karst', ground: 'paddy', seed: 17,
      landmarks: [
        { kind: 'boat', x: 0.50, s: 1.2, label: 'Thuyền chèo trên sông Ngô Đồng', text: 'Người lái đò ở Tam Cốc nhiều người chèo bằng chân; thuyền đi chậm giữa hai bờ lúa.' },
        { kind: 'cave', x: 0.26, s: 1.1, label: 'Hang Cả', text: 'Hang dài nhất trong ba hang; thuyền luồn qua chân núi, ánh sáng tắt dần rồi mở ra cánh đồng.' },
        { kind: 'hall', x: 0.80, s: 0.8, label: 'Chùa Bích Động', text: 'Chùa nép vào vách núi đá, lên từng bậc sẽ thấy cả vùng Tam Cốc bên dưới.' },
        { kind: 'birds', x: 0.64, s: 1, label: 'Chim trên đồng lúa', text: 'Đồng lúa ven sông là chỗ kiếm ăn của cò, vạc; đi nhẹ nhàng sẽ gặp nhiều hơn.' }
      ]
    }
  },
  {
    id: 'hoa-lu',
    name: 'Cố đô Hoa Lư',
    short: 'Cố đô Hoa Lư',
    region: 'ninh-binh',
    themes: ['tam-linh'],
    lat: 20.289, lng: 105.903,
    blurb: 'Kinh đô nước Đại Cồ Việt thời Đinh – Tiền Lê, tựa lưng vào núi đá vôi như một thành lũy tự nhiên.',
    story: 'Năm 968, Đinh Bộ Lĩnh lên ngôi và chọn Hoa Lư làm kinh đô. Núi đá vôi bao quanh giúp nơi đây vừa hiểm yếu vừa thơ mộng; đến năm 1010 kinh đô mới được dời ra Thăng Long.',
    facts: [['Địa chỉ', 'Phường Tây Hoa Lư, tỉnh Ninh Bình'], ['Giai đoạn', '968 – 1010'], ['Điểm chính', 'Đền vua Đinh Tiên Hoàng, đền vua Lê Đại Hành']],
    experience: ['Tham quan hai ngôi đền thờ vua Đinh và vua Lê', 'Tìm hiểu lịch sử qua thuyết minh số', 'Đạp xe quanh khu di tích'],
    green: 'Thuê xe đạp hoặc đi xe điện trong khu di tích; kết hợp tuyến Tràng An trong cùng một ngày.',
    photo: null,
    scene: {
      sky: 'sunset', terrain: 'karst', ground: 'land', seed: 23,
      landmarks: [
        { kind: 'gate', x: 0.50, s: 1.1, label: 'Cổng đền', text: 'Lối vào khu đền thờ — nơi du khách bắt đầu hành trình tìm hiểu lịch sử kinh đô cổ.' },
        { kind: 'hall', x: 0.22, s: 1.0, label: 'Đền thờ vua Đinh Tiên Hoàng', text: 'Ngôi đền thờ vị vua đã lập nên nhà Đinh và đặt kinh đô tại Hoa Lư năm 968.' },
        { kind: 'tree', x: 0.80, s: 1.0, label: 'Bóng cây sân đền', text: 'Bóng cây giữa sân đền; chiều muộn là lúc núi đá phía sau nhuộm sắc ấm nhất.' }
      ]
    }
  },
  {
    id: 'bai-dinh',
    name: 'Chùa Bái Đính',
    short: 'Chùa Bái Đính',
    region: 'ninh-binh',
    themes: ['tam-linh'],
    lat: 20.275, lng: 105.865,
    blurb: 'Quần thể chùa quy mô lớn với hành lang tượng La Hán, bảo tháp và tượng Phật bằng đồng.',
    story: 'Quần thể trải rộng theo sườn núi, gồm nhiều điện thờ nối nhau bằng những hành lang dài. Đến vào buổi sáng sớm sẽ thấy không gian yên tĩnh và thoáng hơn.',
    facts: [['Địa chỉ', 'Phường Tây Hoa Lư, tỉnh Ninh Bình'], ['Loại hình', 'Chùa – quần thể tâm linh'], ['Điểm nhấn', 'Hành lang La Hán, bảo tháp, tượng Phật đồng']],
    experience: ['Đi bộ dọc hành lang La Hán', 'Ngắm toàn cảnh từ khu bảo tháp', 'Nghe thuyết minh về kiến trúc chùa Việt'],
    green: 'Đi xe điện nội khu, mang lễ vật gọn nhẹ, hạn chế vàng mã.',
    photo: null,
    scene: {
      sky: 'day', terrain: 'hills', ground: 'land', seed: 31,
      landmarks: [
        { kind: 'pagoda', x: 0.50, s: 1.2, label: 'Bảo tháp', text: 'Tháp nhiều tầng nổi bật trên nền núi — điểm nhìn tốt để ngắm toàn cảnh quần thể.' },
        { kind: 'buddha', x: 0.22, s: 1.0, label: 'Tượng Phật bằng đồng', text: 'Một trong những tượng Phật lớn của quần thể, được đúc bằng đồng.' },
        { kind: 'hall', x: 0.80, s: 0.9, label: 'Điện thờ', text: 'Các điện thờ nối nhau bằng hành lang dài; đi bộ chậm để cảm nhận nhịp kiến trúc.' }
      ]
    }
  },
  {
    id: 'phat-diem',
    name: 'Nhà thờ đá Phát Diệm',
    short: 'Nhà thờ đá Phát Diệm',
    region: 'ninh-binh',
    themes: ['tam-linh'],
    lat: 20.103, lng: 106.083,
    blurb: 'Cụm nhà thờ bằng đá và gỗ, kết hợp kiến trúc phương Tây với mái cong truyền thống Việt Nam.',
    story: 'Công trình được xây dựng vào cuối thế kỷ 19 dưới sự chỉ đạo của linh mục Trần Lục (thường gọi là cụ Sáu). Mái cong, cột đá lớn và mặt hồ phía trước tạo nên khung cảnh vừa lạ vừa rất Việt.',
    facts: [['Địa chỉ', 'Xã Phát Diệm, tỉnh Ninh Bình'], ['Loại hình', 'Kiến trúc tôn giáo'], ['Thời gian', 'Cuối thế kỷ 19']],
    experience: ['Ngắm Phương Đình và mặt hồ phía trước', 'Tìm hiểu kiến trúc đá – gỗ', 'Ghé làng nghề cói gần đó'],
    green: 'Đi bộ hoặc đạp xe trong khu vực; mua đặc sản và đồ cói của người dân địa phương.',
    photo: null,
    scene: {
      sky: 'day', terrain: 'flat', ground: 'water', seed: 47,
      landmarks: [
        { kind: 'cathedral', x: 0.50, s: 1.15, label: 'Nhà thờ lớn', text: 'Mặt tiền bằng đá với mái cong, kết hợp bố cục phương Tây và thẩm mỹ Việt.' },
        { kind: 'gate', x: 0.22, s: 0.95, pal: 'stone', label: 'Phương Đình', text: 'Công trình bằng đá nằm trước nhà thờ lớn, quay ra mặt hồ.' },
        { kind: 'lotus', x: 0.74, s: 1.0, label: 'Hồ nước phía trước', text: 'Mặt hồ tạo khoảng thoáng cho cả cụm công trình và phản chiếu mái cong khi lặng gió.' }
      ]
    }
  },
  {
    id: 'van-lam',
    name: 'Làng thêu ren Văn Lâm',
    short: 'Làng thêu ren Văn Lâm',
    region: 'ninh-binh',
    themes: ['lang-nghe'],
    lat: 20.225, lng: 105.935,
    blurb: 'Làng nghề thêu ren nằm gần khu Tam Cốc, nơi nghệ nhân thêu tay hoa lá, chim muông trên vải.',
    story: 'Những khung thêu được đặt ngay hiên nhà; mỗi sản phẩm cần nhiều giờ làm tỉ mỉ. Du khách có thể ngồi cùng nghệ nhân, thử một đường thêu và mua trực tiếp để người làm nghề được hưởng trọn giá trị.',
    facts: [['Địa chỉ', 'Làng Văn Lâm, phường Nam Hoa Lư, tỉnh Ninh Bình'], ['Loại hình', 'Làng nghề thêu ren'], ['Gần', 'Tam Cốc – Bích Động']],
    experience: ['Xem nghệ nhân thêu và hỏi về họa tiết', 'Thử thêu một mẫu nhỏ mang về', 'Mua sản phẩm trực tiếp từ gia đình làm nghề'],
    green: 'Đạp xe từ Tam Cốc; chọn sản phẩm thủ công thay cho đồ lưu niệm công nghiệp.',
    photo: null,
    scene: {
      sky: 'day', terrain: 'karst', ground: 'paddy', seed: 53,
      landmarks: [
        { kind: 'house', x: 0.50, s: 1.1, decor: 'lace', label: 'Nhà thêu ren', text: 'Sản phẩm ren được phơi, căng và hoàn thiện ngay trước hiên nhà.' },
        { kind: 'hoop', x: 0.24, s: 1.0, label: 'Khung thêu', text: 'Nghệ nhân thêu từng mũi trên khung tròn; họa tiết thường là hoa lá và chim muông.' },
        { kind: 'house', x: 0.78, s: 0.9, decor: 'plain', label: 'Xóm nghề', text: 'Nhiều gia đình trong xóm cùng làm nghề, nên có thể ghé vài nhà để so sánh họa tiết.' }
      ]
    }
  },
  {
    id: 'tam-chuc',
    name: 'Chùa Tam Chúc',
    short: 'Chùa Tam Chúc',
    region: 'ha-nam',
    themes: ['tam-linh', 'thien-nhien'],
    lat: 20.585, lng: 105.835,
    blurb: 'Quần thể tâm linh ven hồ, núi đá vôi bao quanh, nay thuộc phường Tam Chúc, tỉnh Ninh Bình.',
    story: 'Không gian rộng mở với mặt hồ, núi đá và các công trình chùa trải dài. Nên đi vào ngày thường để có trải nghiệm yên tĩnh hơn và đỡ ùn tắc phương tiện.',
    facts: [['Địa chỉ', 'Phường Tam Chúc, tỉnh Ninh Bình'], ['Loại hình', 'Quần thể chùa – du lịch tâm linh'], ['Cảnh quan', 'Hồ nước và núi đá vôi']],
    experience: ['Đi thuyền hoặc xe điện quanh hồ', 'Tham quan các điện thờ trên đồi', 'Nối tuyến sang Bái Đính (Ninh Bình)'],
    green: 'Dùng xe điện nội khu; đi theo nhóm để giảm số xe nhỏ chạy vào khu.',
    photo: null,
    scene: {
      sky: 'mist', terrain: 'karst', ground: 'water', seed: 61,
      landmarks: [
        { kind: 'pagoda', x: 0.50, s: 1.15, label: 'Tháp chùa', text: 'Tháp nhiều tầng soi bóng xuống mặt hồ, là điểm nhận diện của khu tâm linh.' },
        { kind: 'hall', x: 0.78, s: 0.9, label: 'Điện thờ trên đồi', text: 'Các điện thờ nằm xen giữa núi và hồ; đi bộ lên cao sẽ nhìn được toàn cảnh.' },
        { kind: 'boat', x: 0.25, s: 1.0, label: 'Thuyền trên hồ', text: 'Đi thuyền là cách ngắm núi và chùa từ mặt nước, ít khói bụi hơn đi xe.' }
      ]
    }
  },
  {
    id: 'nha-xa',
    name: 'Làng lụa Nha Xá',
    short: 'Làng lụa Nha Xá',
    region: 'ha-nam',
    themes: ['lang-nghe'],
    lat: 20.62, lng: 105.96,
    blurb: 'Làng dệt lụa tơ tằm lâu đời bên sông Hồng, vùng Duy Tiên xưa.',
    story: 'Từ trồng dâu, nuôi tằm đến kéo sợi và dệt, nhiều công đoạn vẫn làm bằng tay. Một mét lụa là kết quả của rất nhiều giờ làm việc, vì thế biết cách chọn và trân trọng lụa là một phần của du lịch có trách nhiệm.',
    facts: [['Địa chỉ', 'Làng Nha Xá, phường Duy Tân, tỉnh Ninh Bình'], ['Loại hình', 'Làng nghề dệt lụa'], ['Nguyên liệu', 'Tơ tằm']],
    experience: ['Tìm hiểu quy trình từ dâu, tằm đến sợi tơ', 'Xem dệt trên khung cửi', 'Chọn mua lụa trực tiếp tại xưởng'],
    green: 'Đi tàu đến Phủ Lý rồi đạp xe; ưu tiên lụa thật, có nguồn gốc rõ ràng.',
    photo: null,
    scene: {
      sky: 'day', terrain: 'flat', ground: 'land', seed: 71,
      landmarks: [
        { kind: 'house', x: 0.50, s: 1.1, decor: 'silk', label: 'Xưởng lụa', text: 'Những dải lụa mới nhuộm được phơi trên sào cho lên màu đều.' },
        { kind: 'loom', x: 0.24, s: 1.0, label: 'Khung cửi', text: 'Sợi dọc được căng sẵn, người thợ đưa thoi qua lại để tạo thành tấm lụa.' },
        { kind: 'tree', x: 0.80, s: 0.9, label: 'Vườn dâu', text: 'Lá dâu nuôi tằm — nguyên liệu đầu tiên của chuỗi tơ lụa.' }
      ]
    }
  },
  {
    id: 'doi-tam',
    name: 'Làng trống Đọi Tam',
    short: 'Làng trống Đọi Tam',
    region: 'ha-nam',
    themes: ['lang-nghe'],
    lat: 20.635, lng: 105.935,
    blurb: 'Làng làm trống thủ công nổi tiếng, gần chùa Long Đọi Sơn.',
    story: 'Thợ trống chọn gỗ, bưng da và căng mặt trống bằng tay; tiếng trống vang lên là thước đo tay nghề. Du khách có thể xem từng công đoạn và nghe sự khác biệt giữa các loại trống.',
    facts: [['Địa chỉ', 'Làng Đọi Tam, phường Tiên Sơn, tỉnh Ninh Bình'], ['Loại hình', 'Làng nghề làm trống'], ['Gần', 'Chùa Long Đọi Sơn (thời Lý)']],
    experience: ['Xem công đoạn bưng da, căng trống', 'Thử đánh trống cùng nghệ nhân', 'Ghé chùa Long Đọi Sơn gần đó'],
    green: 'Đạp xe giữa các cơ sở; mua trống nhỏ làm quà thay cho đồ nhựa lưu niệm.',
    photo: null,
    scene: {
      sky: 'day', terrain: 'hills', ground: 'land', seed: 83,
      landmarks: [
        { kind: 'drum', x: 0.50, s: 1.15, label: 'Trống lớn', text: 'Mặt trống được căng bằng da, đóng đinh quanh vành; tiếng trống phụ thuộc độ căng và độ dày của da.' },
        { kind: 'house', x: 0.22, s: 1.0, decor: 'plain', label: 'Xưởng làm trống', text: 'Nơi chọn gỗ, bưng da và hoàn thiện trống.' },
        { kind: 'pagoda', x: 0.80, s: 0.85, label: 'Chùa – tháp Long Đọi Sơn', text: 'Di tích thời Lý trên núi Đọi, cách làng trống không xa.' }
      ]
    }
  },
  {
    id: 'phu-day',
    name: 'Phủ Dầy',
    short: 'Phủ Dầy',
    region: 'nam-dinh',
    themes: ['tam-linh'],
    lat: 20.336, lng: 106.1,
    blurb: 'Quần thể thờ Mẫu Liễu Hạnh; tín ngưỡng thờ Mẫu Tam phủ của người Việt được UNESCO ghi danh năm 2016.',
    story: 'Phủ Dầy là một trong những trung tâm của tín ngưỡng thờ Mẫu vùng đồng bằng sông Hồng; lễ hội thường diễn ra vào tháng 3 âm lịch. Ngoài nghi lễ, du khách có thể tìm hiểu hầu đồng, âm nhạc chầu văn và đời sống văn hóa quanh phủ.',
    facts: [['Địa chỉ', 'Xã Vụ Bản, tỉnh Ninh Bình'], ['Danh hiệu', 'UNESCO ghi danh tín ngưỡng thờ Mẫu (2016)'], ['Lễ hội', 'Tháng 3 âm lịch']],
    experience: ['Tìm hiểu tín ngưỡng thờ Mẫu qua thuyết minh số', 'Nghe giới thiệu về chầu văn', 'Nối tuyến sang cụm làng nghề Ý Yên'],
    green: 'Tránh mùa cao điểm hoặc đi sớm; mang túi vải, hạn chế rác lễ hội.',
    photo: null,
    scene: {
      sky: 'day', terrain: 'flat', ground: 'land', seed: 97,
      landmarks: [
        { kind: 'gate', x: 0.50, s: 1.1, label: 'Cổng phủ', text: 'Lối vào quần thể phủ thờ Mẫu.' },
        { kind: 'hall', x: 0.22, s: 1.0, label: 'Điện thờ Mẫu', text: 'Không gian thờ Mẫu Liễu Hạnh — điểm hành hương của nhiều người từ khắp nơi.' },
        { kind: 'tree', x: 0.80, s: 1.0, label: 'Bóng cây khuôn viên', text: 'Bóng cây giúp khuôn viên mát hơn vào những ngày đông người.' }
      ]
    }
  },
  {
    id: 'den-tran',
    name: 'Đền Trần – chùa Phổ Minh',
    short: 'Đền Trần',
    region: 'nam-dinh',
    themes: ['tam-linh'],
    lat: 20.436, lng: 106.137,
    blurb: 'Khu di tích thờ các vua nhà Trần, nổi tiếng với lễ khai ấn đền Trần vào đêm 14 tháng Giêng âm lịch.',
    story: 'Nhà Trần từng gắn bó mật thiết với vùng đất này. Gần đền là chùa Phổ Minh với tháp Phổ Minh thời Trần, tạo thành một không gian lịch sử – tâm linh trọn vẹn.',
    facts: [['Địa chỉ', 'Phường Nam Định, tỉnh Ninh Bình'], ['Loại hình', 'Đền – chùa thời Trần'], ['Lễ khai ấn', 'Đêm 14 tháng Giêng âm lịch']],
    experience: ['Tìm hiểu lịch sử nhà Trần', 'Thăm chùa Phổ Minh và tháp Phổ Minh', 'Thưởng thức phở Nam Định ở quán gia đình'],
    green: 'Đi tàu đến ga Nam Định rồi dùng xe buýt hoặc xe điện; tránh dịp khai ấn nếu muốn yên tĩnh.',
    photo: null,
    scene: {
      sky: 'dawn', terrain: 'flat', ground: 'land', seed: 101,
      landmarks: [
        { kind: 'hall', x: 0.50, s: 1.15, label: 'Đền Thiên Trường', text: 'Một trong các ngôi đền thờ vua Trần trong khu di tích.' },
        { kind: 'pagoda', x: 0.80, s: 0.95, label: 'Tháp Phổ Minh', text: 'Tháp thời Trần ở chùa Phổ Minh, gần khu đền.' },
        { kind: 'tree', x: 0.18, s: 1.0, label: 'Bóng cây sân đền', text: 'Sáng sớm sân đền vắng và mát, thích hợp để đi chậm và đọc bia.' }
      ]
    }
  },
  {
    id: 'y-yen',
    name: 'Cụm làng nghề Ý Yên',
    short: 'Cụm làng nghề Ý Yên',
    region: 'nam-dinh',
    themes: ['lang-nghe'],
    lat: 20.296, lng: 106.05,
    blurb: 'Nơi tập trung nghề đúc đồng Tống Xá, sơn mài Cát Đằng và chạm khắc gỗ La Xuyên.',
    story: 'Mỗi làng giữ một kỹ thuật riêng: đồng được rót vào khuôn, sơn mài được phủ và mài qua nhiều lớp, gỗ được chạm thành hoa văn. Đây cũng là nơi cần chọn cơ sở sản xuất sạch để du lịch không làm tăng ô nhiễm làng nghề.',
    facts: [['Địa chỉ', 'Tống Xá – xã Ý Yên; Cát Đằng – xã Vạn Thắng; La Xuyên – xã Vũ Dương, tỉnh Ninh Bình'], ['Loại hình', 'Làng nghề đồng – sơn mài – gỗ'], ['Lưu ý', 'Ưu tiên xưởng có xử lý khói và chất thải']],
    experience: ['Xem đổ khuôn đồng và hoàn thiện sản phẩm', 'Vẽ thử một tấm sơn mài nhỏ', 'Xem nghệ nhân chạm gỗ'],
    green: 'Chọn xưởng có xử lý khói và chất thải; nghe hướng dẫn an toàn khi vào khu đúc.',
    photo: null,
    scene: {
      sky: 'sunset', terrain: 'flat', ground: 'land', seed: 113,
      landmarks: [
        { kind: 'kiln', x: 0.50, s: 1.1, label: 'Lò đúc đồng', text: 'Đồng nấu chảy được rót vào khuôn; khói và nhiệt là lý do cần chọn xưởng có biện pháp xử lý môi trường.' },
        { kind: 'panel', x: 0.24, s: 1.0, label: 'Tranh sơn mài', text: 'Sơn mài được phủ nhiều lớp rồi mài phẳng, sau đó vẽ hoặc dát họa tiết.' },
        { kind: 'house', x: 0.78, s: 1.0, decor: 'plain', label: 'Xưởng chạm gỗ', text: 'Nghệ nhân chạm hoa văn lên gỗ bằng đục và dao nhỏ.' }
      ]
    }
  },
  {
    id: 'xuan-thuy',
    name: 'Vườn quốc gia Xuân Thủy',
    short: 'Vườn quốc gia Xuân Thủy',
    region: 'nam-dinh',
    themes: ['thien-nhien'],
    lat: 20.2167, lng: 106.55,
    blurb: 'Vùng đất ngập nước ven biển cửa sông Hồng, nơi nhiều loài chim di cư dừng chân; là khu Ramsar của Việt Nam.',
    story: 'Rừng ngập mặn và bãi bồi tạo nên môi trường sống cho chim nước và thủy sản. Mùa thu – đông là thời điểm dễ gặp chim di cư; ngắm chim cần đi nhẹ, nói khẽ và giữ khoảng cách.',
    facts: [['Địa chỉ', 'Các xã Giao Minh, Giao Hòa, Giao Phúc, tỉnh Ninh Bình'], ['Loại hình', 'Vườn quốc gia – đất ngập nước'], ['Danh hiệu', 'Khu Ramsar']],
    experience: ['Ngắm chim di cư bằng ống nhòm', 'Đi xuồng qua rừng ngập mặn', 'Tìm hiểu vai trò của rừng ngập mặn ven biển'],
    green: 'Đi nhóm nhỏ, giữ yên lặng, không bước vào vùng chim làm tổ; mang rác về.',
    photo: null,
    scene: {
      sky: 'sunset', terrain: 'flat', ground: 'water', seed: 127,
      landmarks: [
        { kind: 'birds', x: 0.30, s: 1.3, label: 'Đàn chim di cư', text: 'Mùa thu – đông là thời điểm dễ gặp chim di cư dừng chân kiếm ăn trên bãi bồi.' },
        { kind: 'tree', x: 0.50, s: 1.2, variant: 'mangrove', label: 'Rừng ngập mặn', text: 'Rễ cây giữ đất bồi, chắn sóng và là nơi cư trú của nhiều loài thủy sinh.' },
        { kind: 'boat', x: 0.76, s: 1.0, label: 'Xuồng đi bãi', text: 'Xuồng nhỏ đưa khách vào sâu trong rừng ngập mặn; đi chậm và nói khẽ để không làm chim hoảng sợ.' }
      ]
    }
  },
  {
    id: 'bach-long',
    name: 'Làng muối Bạch Long',
    short: 'Làng muối Bạch Long',
    region: 'nam-dinh',
    themes: ['lang-nghe', 'thien-nhien'],
    lat: 20.25, lng: 106.5,
    blurb: 'Làng làm muối ven biển Bạch Long, nơi những ruộng muối phản chiếu bầu trời.',
    story: 'Muối được làm từ nước biển phơi dưới nắng nên nghề phụ thuộc mùa nắng và thời tiết. Gặp đúng mùa, du khách sẽ thấy cảnh thu muối và gánh muối về kho.',
    facts: [['Địa chỉ', 'Xã Giao Bình, tỉnh Ninh Bình'], ['Loại hình', 'Làng nghề làm muối'], ['Mùa làm muối', 'Mùa nắng']],
    experience: ['Xem ruộng muối và cách thu muối', 'Hỏi diêm dân về nghề phụ thuộc thời tiết', 'Mua muối trực tiếp từ người làm muối'],
    green: 'Đạp xe ven đê; mua muối đóng gói tối giản, hạn chế bao bì nhựa.',
    photo: null,
    scene: {
      sky: 'day', terrain: 'flat', ground: 'salt', seed: 139,
      landmarks: [
        { kind: 'salt', x: 0.50, s: 1.2, label: 'Đống muối', text: 'Muối được gom thành đống ngay trên ruộng trước khi gánh về kho.' },
        { kind: 'house', x: 0.22, s: 0.8, decor: 'plain', label: 'Chòi trông ruộng muối', text: 'Chòi nhỏ ven ruộng, nơi người làm muối nghỉ giữa trưa nắng.' },
        { kind: 'house', x: 0.78, s: 0.9, decor: 'plain', label: 'Kho muối', text: 'Muối được gánh về kho để bảo quản và bán.' }
      ]
    }
  }
];
