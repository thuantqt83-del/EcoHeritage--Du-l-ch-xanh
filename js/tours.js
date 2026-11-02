/* Dữ liệu tour + bộ máy tính giá, CO₂ và điểm xanh.
 *
 * LƯU Ý: toàn bộ GIÁ và HỆ SỐ PHÁT THẢI dưới đây là GIẢ ĐỊNH MINH HỌA để chạy demo.
 * Trước khi dùng cho hồ sơ/vận hành phải thay bằng bảng giá thật của đối tác và nguồn hệ số chính thức.
 * Khoảng cách tính từ tọa độ gần đúng của các điểm (đường chim bay × 1,35). */
(function (global) {
  'use strict';

  const Eco = (global.Eco = global.Eco || {});
  const SITES = global.HERITAGE;
  const byId = Object.fromEntries(SITES.map((s) => [s.id, s]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- giả định ---------- */
  Eco.SITE_COST = { // đ/người: vé + trải nghiệm tại điểm
    'trang-an': 250000, 'hoa-lu': 40000, 'bai-dinh': 60000, 'phat-diem': 30000, 'van-lam': 80000, 'tam-chuc': 120000,
    'nha-xa': 70000, 'doi-tam': 70000, 'phu-day': 30000, 'den-tran': 30000, 'y-yen': 150000, 'xuan-thuy': 150000, 'bach-long': 60000, 'tam-coc': 250000
  };
  const FACTOR = { car: 0.085, minibus: 0.045, bus: 0.04, train: 0.035, ecart: 0.02, bike: 0 }; // kg CO₂e / người / km (ước tính)
  const PRICE_KM = { minibus: 1500, bus: 1100, train: 800, ecart: 2500, bike: 0 }; // đ / người / km
  const MODE_LABEL = { minibus: 'Xe ghép', bus: 'Xe buýt/khách', train: 'Tàu hỏa', ecart: 'Xe điện', bike: 'Xe đạp' };
  const TRAIN_FIXED = 30000, BIKE_DAY = 50000;
  const FEE = 0.06, GROUP_MIN = 10, GROUP_DISC = 0.08, LOCAL_SHARE = 0.9, DETOUR = 1.35;
  const ACCESS_KM = { 'ha-nam': 60, 'nam-dinh': 90, 'ninh-binh': 95 }; // từ Hà Nội, một chiều
  const WEIGHTS = { transport: 0.30, community: 0.25, environment: 0.20, consumption: 0.15, education: 0.10 };

  Eco.WEIGHTS = WEIGHTS;
  Eco.MODE_LABEL = MODE_LABEL;
  Eco.ASSUMPTIONS = { FEE, GROUP_MIN, GROUP_DISC, LOCAL_SHARE, DETOUR, TRAIN_FIXED, BIKE_DAY, FACTOR, PRICE_KM };

  Eco.PLANS = {
    'tiet-kiem': { id: 'tiet-kiem', label: 'Tiết kiệm', short: 'minibus', mid: 'minibus', long: 'minibus', longNoTrain: 'minibus', meal: 120000, night: 150000, env: 50, eat: 60, desc: 'Đi xe ghép, ăn ở giản dị' },
    'can-bang': { id: 'can-bang', label: 'Cân bằng', short: 'ecart', mid: 'ecart', long: 'train', longNoTrain: 'bus', meal: 180000, night: 250000, env: 70, eat: 80, desc: 'Tàu hỏa hoặc xe buýt, xe điện chặng ngắn' },
    'xanh-nhat': { id: 'xanh-nhat', label: 'Xanh nhất', short: 'bike', mid: 'ecart', long: 'train', longNoTrain: 'bus', meal: 200000, night: 300000, env: 90, eat: 100, desc: 'Tàu hỏa, xe đạp và xe điện, homestay xanh' }
  };

  Eco.TOURS = [
    { id: 'ha-nam-lua-trong', name: 'Lụa – Trống', days: 1, region: 'ha-nam', themes: ['lang-nghe'], stops: ['nha-xa', 'doi-tam'],
      tagline: 'Một ngày với nghề dệt lụa Nha Xá và làm trống Đọi Tam',
      highlights: ['Xem dệt lụa trên khung cửi ở Nha Xá', 'Xem công đoạn căng mặt trống ở Đọi Tam, ghé chùa Long Đọi Sơn gần đó', 'Đi tàu đến Phủ Lý rồi đạp xe giữa các cơ sở'] },
    { id: 'tam-coc-bich-dong', name: 'Tam Cốc – Bích Động', days: 1, region: 'ninh-binh', themes: ['thien-nhien', 'tam-linh', 'lang-nghe'], stops: ['tam-coc', 'van-lam'],
      tagline: 'Thuyền chèo qua ba hang Tam Cốc, lên chùa Bích Động, ghé làng thêu ren Văn Lâm',
      highlights: ['Thuyền chèo tay trên sông Ngô Đồng qua Hang Cả, Hang Hai, Hang Ba', 'Leo bậc đá lên chùa Bích Động', 'Đạp xe sang làng thêu ren Văn Lâm, thêu thử vài mũi'] },
    { id: 'nam-dinh-mau-dong-moc', name: 'Mẫu – Đồng – Mộc', days: 2, region: 'nam-dinh', themes: ['tam-linh', 'lang-nghe'], stops: ['den-tran', 'y-yen', 'phu-day'],
      tagline: 'Đền Trần, cụm làng nghề Ý Yên và Phủ Dầy trong hai ngày',
      highlights: ['Đền Trần và chùa Phổ Minh', 'Xem đổ khuôn đồng, vẽ thử sơn mài ở Ý Yên', 'Phủ Dầy — nơi thờ Mẫu'] },
    { id: 'ninh-binh-nui-nuoc-ren', name: 'Núi – Nước – Ren', days: 2, region: 'ninh-binh', themes: ['thien-nhien', 'lang-nghe', 'tam-linh'], stops: ['hoa-lu', 'trang-an', 'van-lam'],
      tagline: 'Cố đô Hoa Lư, thuyền chèo Tràng An và làng thêu ren Văn Lâm',
      highlights: ['Cố đô Hoa Lư', 'Thuyền chèo tay luồn hang ở Tràng An', 'Thêu thử một mẫu ren ở Văn Lâm'] },
    { id: 'bien-chim-muoi', name: 'Biển – Chim – Muối', days: 2, region: 'nam-dinh', themes: ['thien-nhien', 'lang-nghe'], stops: ['xuan-thuy', 'bach-long', 'phat-diem'], noTrain: true, accessKm: 150,
      tagline: 'Rừng ngập mặn Xuân Thủy, làng muối Bạch Long và nhà thờ đá Phát Diệm',
      highlights: ['Ngắm chim di cư ở Xuân Thủy (hợp mùa thu – đông)', 'Làng muối Bạch Long (đúng mùa nắng mới có cảnh thu muối)', 'Nhà thờ đá Phát Diệm'] },
    { id: 'ba-vung-xanh', name: 'Ba vùng – Một hành trình xanh', days: 3, region: 'lien-vung', themes: ['lang-nghe', 'tam-linh', 'thien-nhien'], stops: ['nha-xa', 'doi-tam', 'y-yen', 'phu-day', 'van-lam', 'trang-an'],
      tagline: 'Đi tàu nối Hà Nam – Nam Định – Ninh Bình, mỗi ngày một làng nghề',
      highlights: ['Tàu hỏa nối Phủ Lý – Nam Định – Ninh Bình', 'Ba “con dấu nghề” trong hộ chiếu di sản', 'Kết thúc bằng thuyền chèo ở Tràng An'] },
    { id: 'hanh-huong-xanh', name: 'Hành hương xanh', days: 3, region: 'lien-vung', themes: ['tam-linh'], stops: ['tam-chuc', 'bai-dinh', 'hoa-lu', 'phu-day', 'den-tran'], noTrain: true,
      tagline: 'Tam Chúc, Bái Đính, Hoa Lư, Phủ Dầy và Đền Trần',
      highlights: ['Tam Chúc → Bái Đính → Hoa Lư', 'Phủ Dầy — tín ngưỡng thờ Mẫu', 'Đền Trần và chùa Phổ Minh'] }
  ];
  const tourById = Object.fromEntries(Eco.TOURS.map((t) => [t.id, t]));
  Eco.tourById = tourById;
  Eco.craftCount = (t) => t.stops.filter((id) => byId[id].themes.includes('lang-nghe')).length;

  /* ---------- tiện ích ---------- */
  function km(a, b) {
    const R = 6371, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const distribute = (n, days) => Array.from({ length: days }, (_, d) => Math.floor(n / days) + (d < n % days ? 1 : 0));
  const round1000 = (v) => Math.ceil(v / 1000) * 1000;

  /* ---------- báo giá ---------- */
  Eco.quote = function (tourId, planId, people, from) {
    const tour = tourById[tourId], plan = Eco.PLANS[planId];
    people = clamp(Math.round(people) || 1, 1, 200);
    const pickMode = (dk) => {
      if (dk >= 25) return tour.noTrain ? plan.longNoTrain : plan.long;
      return dk < 6 ? plan.short : plan.mid;
    };

    const counts = distribute(tour.stops.length, tour.days);
    const legs = [], days = [];
    let idx = 0, prev = null;
    counts.forEach((cnt, d) => {
      const items = [];
      for (let i = 0; i < cnt; i++) {
        const id = tour.stops[idx++], site = byId[id];
        if (prev) {
          const dk = Math.max(1, Math.round(km(prev, site) * DETOUR)), mode = pickMode(dk);
          legs.push({ km: dk, mode });
          items.push({ type: 'leg', km: dk, mode, label: MODE_LABEL[mode] });
        }
        items.push({ type: 'stop', id, name: site.short, themes: site.themes });
        prev = site;
      }
      days.push({ day: d + 1, items });
    });

    const access = [];
    if (from === 'hn') {
      const first = byId[tour.stops[0]];
      const one = tour.accessKm || ACCESS_KM[first.region] || 90, mode = pickMode(one);
      access.push({ km: one, mode }, { km: one, mode });
    }

    let kmTotal = 0, co2 = 0, transport = 0;
    legs.concat(access).forEach((l) => {
      kmTotal += l.km; co2 += l.km * FACTOR[l.mode];
      transport += l.km * PRICE_KM[l.mode] + (l.mode === 'train' ? TRAIN_FIXED : 0);
    });
    const hasBike = legs.some((l) => l.mode === 'bike');
    const bikeCost = hasBike ? BIKE_DAY * tour.days : 0;

    const siteCost = tour.stops.reduce((s, id) => s + (Eco.SITE_COST[id] || 0), 0);
    const meals = plan.meal * tour.days, lodging = plan.night * (tour.days - 1);
    const lines = [
      { key: 'site', label: 'Vé và trải nghiệm tại ' + tour.stops.length + ' điểm', amount: siteCost },
      { key: 'meal', label: 'Ăn đặc sản địa phương (' + tour.days + ' ngày)', amount: meals }
    ];
    if (tour.days > 1) lines.push({ key: 'lodging', label: 'Lưu trú (' + (tour.days - 1) + ' đêm)', amount: lodging });
    lines.push({ key: 'transport', label: 'Di chuyển (' + Math.round(kmTotal) + ' km)', amount: transport });
    if (bikeCost) lines.push({ key: 'bike', label: 'Thuê xe đạp', amount: bikeCost });

    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const discount = people >= GROUP_MIN ? subtotal * GROUP_DISC : 0;
    const fee = (subtotal - discount) * FEE;
    const perPerson = round1000(subtotal - discount + fee);
    const total = perPerson * people;

    const baseline = kmTotal * FACTOR.car, co2Saved = Math.max(0, baseline - co2);
    const localMoney = Math.round((siteCost + meals + lodging) * LOCAL_SHARE * people / 1000) * 1000;

    const crafts = Eco.craftCount(tour);
    const parts = {
      transport: baseline ? clamp(100 * (1 - co2 / baseline), 0, 100) : 100,
      community: plan.eat === 100 ? 100 : plan.eat + 10,
      environment: plan.env,
      consumption: plan.eat,
      education: clamp(50 + 15 * crafts + (tour.days > 1 ? 10 : 0), 0, 100)
    };
    parts.community = clamp(parts.community, 0, 100);
    const score = Math.round(Object.keys(WEIGHTS).reduce((s, k) => s + parts[k] * WEIGHTS[k], 0));

    return { tour, plan, people, from, days, access, lines, subtotal, discount, fee, perPerson, total, km: Math.round(kmTotal),
      co2: Math.round(co2 * 10) / 10, baseline: Math.round(baseline * 10) / 10, co2Saved: Math.round(co2Saved * 10) / 10,
      co2SavedPct: baseline ? Math.round(100 * co2Saved / baseline) : 0, localMoney, score, parts };
  };
})(window);
