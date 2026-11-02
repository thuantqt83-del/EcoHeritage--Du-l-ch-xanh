/* Trợ lí Heri — trợ lý ảo (bản demo).
 * Hiểu câu hỏi bằng quy tắc: tách số người, số ngày, ngân sách, sở thích rồi gọi bộ máy báo giá (tours.js);
 * hỏi đáp về điểm di sản bằng cách tra dữ liệu đã số hóa (data.js). Chưa dùng mô hình ngôn ngữ lớn. */
(function () {
  'use strict';

  const Eco = window.Eco, SITES = window.HERITAGE, THEMES = window.THEMES;
  const log = document.getElementById('chat-log');
  if (!Eco || !SITES || !log) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const vnd = (n) => Math.round(n).toLocaleString('vi-VN') + ' đ';
  const tr = (n) => (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' triệu';
  const form = $('#chat-form'), input = $('#chat-input'), chips = $('#chat-chips');
  const PLAN_IDS = ['tiet-kiem', 'can-bang', 'xanh-nhat'];

  const slots = { people: null, days: null, budget: null, perPerson: false, from: 'stop', themes: [], regions: [], multi: false, pref: null };
  let lastTour = null, skip = 0;

  /* ---------- hiển thị ---------- */
  function add(role, html) {
    const el = document.createElement('div');
    el.className = 'msg ' + role;
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function setChips(list) {
    chips.innerHTML = list.map((c) => '<button type="button">' + esc(c) + '</button>').join('');
  }
  function botSay(html, after, delay) {
    const t = add('bot', '<span class="typing" aria-label="Heri đang soạn"><i></i><i></i><i></i></span>');
    setTimeout(() => { t.innerHTML = html; log.scrollTop = log.scrollHeight; if (after) after(); }, delay == null ? 450 : delay);
  }

  /* ---------- hiểu câu ---------- */
  function parse(raw) {
    const t = strip(raw), found = {};
    let m;
    if ((m = t.match(/(\d{1,3})\s*(nguoi|khach|ban|hs|hoc sinh|em|thanh vien|bac|me)\b/))) { slots.people = +m[1]; found.people = true; }
    else if (/mot minh|di mot minh/.test(t)) { slots.people = 1; found.people = true; }
    else if (/cap doi|hai nguoi|vo chong/.test(t)) { slots.people = 2; found.people = true; }

    if ((m = t.match(/(\d{1,2})\s*ngay/))) { slots.days = +m[1]; found.days = true; }
    else if (/trong ngay|di trong ngay/.test(t)) { slots.days = 1; found.days = true; }
    else if (/cuoi tuan/.test(t)) { slots.days = 2; found.days = true; }

    if ((m = t.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr|nghin|ngan|k)\b/))) {
      const v = parseFloat(m[1].replace(',', '.'));
      slots.budget = m[2].startsWith('tr') ? v * 1e6 : v * 1e3;
      slots.perPerson = /(moi nguoi|\/ ?nguoi|mot nguoi|1 nguoi|moi khach|\/ ?khach)/.test(t);
      found.budget = true;
    }

    const th = new Set(slots.themes), rg = new Set(slots.regions);
    if (/tam linh|hanh huong|ngoi chua|chua tam chuc|chua bai dinh|phu day|den tran|phat diem|bai dinh/.test(t)) th.add('tam-linh');
    if (/lang nghe|nghe nhan|lang lua|det lua|lang trong|son mai|duc dong|\bren\b|thu cong|\bmuoi\b/.test(t)) th.add('lang-nghe');
    if (/\bbien\b|\bchim\b|rung ngap man|xuan thuy|sinh thai|thien nhien|\bmuoi\b|hai san/.test(t)) th.add('thien-nhien');
    if (/trang an|thuyen cheo|hang dong|hoa lu/.test(t)) { th.add('thien-nhien'); rg.add('ninh-binh'); }
    if (/ha nam/.test(t)) rg.add('ha-nam');
    if (/nam dinh/.test(t)) rg.add('nam-dinh');
    if (/ninh binh/.test(t)) rg.add('ninh-binh');
    slots.multi = /ba vung|lien vung|ca ba|ca 3|ba tinh/.test(t) ? true : slots.multi;
    slots.themes = Array.from(th); slots.regions = Array.from(rg);
    if (th.size || rg.size) found.theme = true;

    if (/ha noi/.test(t)) { slots.from = 'hn'; found.from = true; }
    else if (/tai cho|o dia phuong|khong tu ha noi/.test(t)) { slots.from = 'stop'; }
    if (/xanh nhat|it phat thai|than thien moi truong|xanh hon|giam co2/.test(t)) { slots.pref = 'xanh-nhat'; found.pref = true; }
    else if (/re nhat|tiet kiem|re hon|giam gia/.test(t)) { slots.pref = 'tiet-kiem'; found.pref = true; }
    return { t, found };
  }

  function findSite(t) {
    return SITES.find((s) => {
      const names = [strip(s.short), strip(s.name), s.id.replace(/-/g, ' ')];
      return names.some((n) => n.length > 3 && t.includes(n));
    });
  }

  function rankTours() {
    const days = slots.days;
    return Eco.TOURS.map((tour) => {
      let sc = 0;
      slots.themes.forEach((th) => { if (tour.themes.includes(th)) sc += 3 + (tour.themes.length === 1 ? 0.5 : 0); });
      slots.regions.forEach((r) => { if (tour.region === r) sc += 4; });
      if (slots.multi && tour.region === 'lien-vung') sc += 5;
      if (days) sc -= 2.5 * Math.abs(tour.days - days);
      if (!slots.themes.length && !slots.regions.length && !slots.multi) sc += tour.id === 'ba-vung-xanh' && days >= 3 ? 3 : 0;
      return { tour, sc };
    }).sort((a, b) => b.sc - a.sc).map((x) => x.tour);
  }

  /* ---------- trả lời ---------- */
  function optionCards(tour) {
    const perBudget = slots.budget ? (slots.perPerson ? slots.budget : slots.budget / slots.people) : null;
    const res = PLAN_IDS.map((p) => Eco.quote(tour.id, p, slots.people, slots.from));
    let bestIdx = -1;
    res.forEach((r, i) => { if ((perBudget == null || r.perPerson <= perBudget) && (bestIdx < 0 || r.score > res[bestIdx].score)) bestIdx = i; });
    if (slots.pref === 'tiet-kiem') bestIdx = 0; else if (slots.pref === 'xanh-nhat' && (perBudget == null || res[2].perPerson <= perBudget)) bestIdx = 2;
    const cards = res.map((r, i) => {
      const fit = perBudget == null ? '' : r.perPerson <= perBudget ? '<em>✔ vừa ngân sách</em>' : '<em class="over">vượt ' + tr((r.perPerson - perBudget) * r.people) + '</em>';
      return '<button type="button" class="opt' + (i === bestIdx ? ' best' : '') + '" data-tour="' + tour.id + '" data-plan="' + r.plan.id + '">' +
        '<b><span>' + r.plan.label + (i === bestIdx ? ' · gợi ý' : '') + '</span><span>' + tr(r.perPerson) + '/người</span></b>' +
        '<span>Tổng ' + tr(r.total) + ' · điểm xanh ' + r.score + '/100 · tiết kiệm ≈ ' + r.co2Saved.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' kg CO₂/người ' + fit + '</span></button>';
    }).join('');
    return { res, bestIdx, perBudget, cards };
  }

  function planReply(extraNote) {
    const ranked = rankTours();
    const tour = ranked[skip % ranked.length];
    lastTour = tour.id;
    const { res, bestIdx, perBudget, cards } = optionCards(tour);
    let note = '';
    if (slots.days && slots.days > 3) note = '<p>Hiện tour dài nhất là 3 ngày, mình gợi ý tour gần nhất với yêu cầu của bạn.</p>';
    else if (slots.days && slots.days !== tour.days) note = '<p>Tour phù hợp nhất đang là ' + tour.days + ' ngày (bạn yêu cầu ' + slots.days + ' ngày).</p>';
    if (perBudget != null && bestIdx < 0) {
      const cheapest = res[0];
      note += '<p>Cả ba phương án đều vượt ngân sách. Rẻ nhất là ' + tr(cheapest.perPerson) + '/người; bạn có thể giảm số điểm, bớt một ngày hoặc đi nhóm từ ' + Eco.ASSUMPTIONS.GROUP_MIN + ' người để được giảm giá.</p>';
    }
    const html = '<p>' + (extraNote || '') + 'Mình gợi ý tour <b>' + esc(tour.name) + '</b> (' + tour.days + ' ngày) cho ' + slots.people + ' người' + (slots.from === 'hn' ? ', xuất phát từ Hà Nội' : '') + ':</p>' +
      '<ul>' + tour.highlights.map((h) => '<li>' + esc(h) + '</li>').join('') + '</ul>' +
      note + '<div class="opts">' + cards + '</div><p style="margin-top:8px;font-size:12.5px;color:#41606a">Giá là số minh họa. Chạm vào một phương án để xem chi tiết và nhận báo giá.</p>';
    botSay(html, () => setChips(['Xanh hơn', 'Rẻ hơn', 'Thêm làng nghề', 'Tour khác', 'Giải thích điểm xanh']));
  }

  function siteReply(s) {
    const html = '<p><b>' + esc(s.name) + '</b> (' + esc(window.REGIONS[s.region]) + ')</p><p>' + esc(s.blurb) + '</p>' +
      '<ul>' + s.experience.slice(0, 3).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '<p><b>Đi xanh:</b> ' + esc(s.green) + '</p><p><a href="#/' + s.id + '">Xem cảnh 360° →</a></p>';
    botSay(html, () => setChips(['Lập tour có ' + s.short, 'Điểm xanh là gì?']));
  }

  const HELP = '<p>Mình có thể giúp:</p><ul><li><b>Dựng tour và báo giá:</b> cho mình biết số người, số ngày, ngân sách, sở thích (tâm linh, làng nghề, biển) và xuất phát từ đâu.</li><li><b>Giới thiệu điểm di sản:</b> ví dụ “Giới thiệu về Tràng An”.</li><li><b>Giải thích:</b> điểm xanh, CO₂, cách tính giá.</li></ul>';

  function explain(t) {
    if (/diem xanh/.test(t)) return '<p>Điểm xanh (0–100) gồm 5 phần: <b>di chuyển 30%</b> (giảm phát thải so với ô tô riêng), <b>cộng đồng 25%</b> (chi tiêu ở cơ sở địa phương), <b>môi trường 20%</b> (cam kết giảm rác, xử lý chất thải), <b>ăn uống, mua sắm 15%</b>, <b>giáo dục, trải nghiệm 10%</b>.</p><p>Trọng số và hệ số là đề xuất của đội thi, sẽ hiệu chỉnh bằng khảo sát.</p>';
    if (/co2|phat thai/.test(t)) return '<p>CO₂ tiết kiệm = phát thải nếu đi ô tô riêng trên cùng quãng đường trừ phát thải của phương án bạn chọn (tàu hỏa, xe buýt, xe điện, xe đạp…). Quãng đường tính từ tọa độ các điểm; hệ số phát thải là ước tính, sẽ thay bằng nguồn chính thức.</p>';
    if (/gia|chi phi|bao nhieu/.test(t)) return '<p>Giá mỗi người gồm: vé và trải nghiệm tại điểm, ăn đặc sản, lưu trú (nếu đi nhiều ngày), di chuyển, cộng phí dịch vụ và hướng dẫn số 6%. Nhóm từ ' + Eco.ASSUMPTIONS.GROUP_MIN + ' người được giảm ' + Math.round(Eco.ASSUMPTIONS.GROUP_DISC * 100) + '%. Mọi con số trong bản demo là minh họa.</p>';
    return null;
  }

  const clone = (o) => JSON.parse(JSON.stringify(o));
  function resetSlots() { Object.assign(slots, { people: null, days: null, budget: null, perPerson: false, from: 'stop', themes: [], regions: [], multi: false, pref: null }); }

  function handle(raw) {
    const text = raw.trim();
    if (!text) return;
    add('you', esc(text));

    const snap = clone(slots);
    let { t, found } = parse(text);
    const undo = () => Object.assign(slots, snap); // câu hỏi đáp không làm đổi yêu cầu đang lập

    if (/^(xin chao|chao|hello|hi)\b/.test(t) && !found.people && !found.days) { undo(); botSay('<p>Xin chào! Mình là Heri. Bạn đi mấy người, mấy ngày và thích gì (tâm linh, làng nghề, biển)? Mình sẽ ghép tour và báo giá.</p>'); return; }
    if (/cam on|thanks/.test(t)) { undo(); botSay('<p>Không có gì! Cần chỉnh tour cứ nhắn mình nhé.</p>'); return; }

    const ex = explain(t);
    if (ex && !found.people) { undo(); botSay(ex); return; }

    const site = findSite(t);
    if (site && !/tour|lap|ghep|bao gia/.test(t)) { undo(); siteReply(site); return; }

    // một câu nêu đủ nhu cầu mới (số người kèm số ngày/sở thích/ngân sách) thì bắt đầu lại, không dính yêu cầu cũ
    if (found.people && (found.days || found.theme || found.budget)) { resetSlots(); ({ t, found } = parse(text)); skip = 0; }

    if (/tour khac|doi tour/.test(t)) { skip++; if (slots.people) planReply(); else botSay('<p>Nhóm mình đi mấy người ạ?</p>'); return; }
    if (/them lang nghe/.test(t)) { if (!slots.themes.includes('lang-nghe')) slots.themes.push('lang-nghe'); skip = 0; }

    const planning = found.people || found.days || found.budget || found.theme || found.from || found.pref || /tour|lap|ghep|bao gia|them lang nghe|re hon|xanh hon/.test(t) || lastTour;
    if (!planning) { undo(); botSay(HELP); return; }

    if (!slots.people) {
      botSay('<p>Mình ghi nhận rồi. Nhóm mình đi <b>mấy người</b> ạ? (ví dụ: “4 người”)</p>');
      return;
    }
    if (found.people || found.days || found.theme || found.from) skip = 0;
    const note = found.pref && lastTour ? (slots.pref === 'xanh-nhat' ? 'Mình ưu tiên phương án xanh hơn. ' : 'Mình ưu tiên phương án rẻ hơn. ') : '';
    planReply(note);
  }

  /* ---------- sự kiện ---------- */
  form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; handle(v); });
  chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) handle(b.textContent); });
  document.addEventListener('click', (e) => {
    const ask = e.target.closest('[data-ask]');
    if (ask) { handle(ask.dataset.ask); return; }
    const opt = e.target.closest('.opt');
    if (opt && window.EcoUI) window.EcoUI.showQuote(opt.dataset.tour, opt.dataset.plan, slots.people, slots.from);
  });

  botSay('<p>Xin chào! Mình là <b>Heri</b>, trợ lí ảo của EcoHeritage (bản demo). Hãy cho mình biết <b>số người, số ngày, ngân sách và sở thích</b> — mình sẽ ghép tour xanh có làng nghề và báo giá. Bạn cũng có thể hỏi về một điểm di sản, ví dụ “Giới thiệu về Tràng An”.</p>', () => setChips(['4 người đi 2 ngày thích làng nghề', 'Giới thiệu về Phủ Dầy', 'Điểm xanh là gì?']), 200);
})();
