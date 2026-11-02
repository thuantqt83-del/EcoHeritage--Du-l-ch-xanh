/* Nhạc nền vui tươi, nhẹ nhàng — tự sáng tác bằng Web Audio, không dùng bản nhạc của ai, không cần tệp.
 * Bản 31/10/2026: tiếng đàn tranh gảy mềm (mô phỏng dây Karplus–Strong), nhịp nhanh vừa, giọng Đô trưởng ngũ cung (Đô – Rê – Mi – Son – La):
 *   · bè trầm gảy ở phách 1 và 5; · bè đệm rải hợp âm khẽ ở phách lẻ; · giai điệu nảy, câu hỏi – câu đáp, có nốt luyến;
 *   · giai điệu không vượt nốt Mi cao (659 Hz) để khỏi «leng keng»; lọc mềm, tiếng vang ngắn, bộ nén + giới hạn chống rè.
 * Tự mở khi vào trang; trình duyệt chặn âm thanh tự phát thì nhạc bắt đầu ngay lần chạm / bấm / cuộn / gõ phím đầu tiên.
 * Nút 🎵 góc phải dưới để tắt / bật (nhớ lựa chọn trên máy). Khi video hành trình đọc lời bình, nhạc tự nhỏ lại.
 */
(function () {
  'use strict';
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const KEY = 'eco_nhac_tat';
  let ctx = null, bus = null, out = null, playing = false, timer = 0, step = 0, motif = [];
  const off = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  const save = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* bỏ qua */ } };
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];

  // Đô trưởng ngũ cung — giai điệu 262–659 Hz
  const MEL = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
  const CHORDS = [   // trầm, đệm (Đô – La thứ – Fa – Son)
    { bass: [130.81, 196.0], arp: [261.63, 329.63, 392.0] },
    { bass: [110.0, 164.81], arp: [220.0, 261.63, 329.63] },
    { bass: [87.31, 130.81], arp: [174.61, 220.0, 261.63] },
    { bass: [98.0, 146.83], arp: [196.0, 246.94, 293.66] }
  ];
  const BEAT = 0.3;                           // giây mỗi phách (móc đơn) — vui, không vội

  /* dây đàn: tính sẵn một lần mỗi nốt */
  const strings = {};
  function string(f) {
    if (strings[f]) return strings[f];
    const sr = ctx.sampleRate, len = Math.floor(sr * 2.6), buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / f));
    let a = 0;
    for (let i = 0; i < N; i++) { a = a * 0.65 + (Math.random() * 2 - 1) * 0.35; d[i] = a; }   // gảy mềm
    const decay = 0.4968 + Math.min(0.0022, f / 280000);
    for (let i = N; i < len; i++) d[i] = decay * (d[i - N] + d[i - N + 1]);
    let peak = 0;
    for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
    const k = peak ? 0.9 / peak : 1, fade = Math.floor(sr * 0.3);
    for (let i = 0; i < len; i++) d[i] *= k * (i > len - fade ? (len - i) / fade : 1);
    return (strings[f] = buf);
  }

  function pluck(f, t, v, slide) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = string(f);
    if (slide) { src.playbackRate.setValueAtTime(slide, t); src.playbackRate.linearRampToValueAtTime(1, t + 0.09); }  // luyến từ dưới lên
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.01);
    g.gain.setTargetAtTime(0.0001, t + 1.6, 0.3);
    src.connect(g); g.connect(bus);
    src.start(t); src.stop(t + 2.6);
  }

  /* motif 8 phách cho câu hỏi; câu đáp lặp lại nhưng kết về nốt chủ */
  function newMotif() {
    let i = 2 + Math.floor(Math.random() * 3);
    const m = [];
    for (let k = 0; k < 8; k++) {
      if (k === 7 || (k % 2 === 1 && Math.random() < 0.35)) { m.push(null); continue; }
      i = Math.max(0, Math.min(MEL.length - 1, i + rnd([-1, 1, 1, 2, -2, 0, -1])));
      m.push(i);
    }
    return m;
  }

  function schedule() {
    const t = ctx.currentTime + 0.08, k = step % 8, bar = Math.floor(step / 8), ch = CHORDS[bar % CHORDS.length];
    if (k === 0 || k === 4) pluck(ch.bass[k === 0 ? 0 : 1], t, 0.2);                          // bè trầm
    if (k % 2 === 1) pluck(ch.arp[(k >> 1) % 3], t, 0.075);                                   // đệm rải khẽ
    if (k === 0) {
      if (bar % 2 === 0) motif = newMotif();
      else { motif = motif.slice(); motif[6] = 0; motif[5] = motif[5] == null ? null : 2; }   // câu đáp kết về Đô
    }
    const i = motif[k];
    if (i != null) {
      const luyen = i > 0 && Math.random() < 0.12 ? MEL[i - 1] / MEL[i] : 0;
      pluck(MEL[i], t, 0.13 + Math.random() * 0.03, luyen);
    }
    step++;
  }

  function reverb() {
    const len = Math.floor(ctx.sampleRate * 1.4), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * 0.4; }
    const cv = ctx.createConvolver(); cv.normalize = true; cv.buffer = buf; return cv;
  }

  function build() {
    ctx = new AC({ latencyHint: 'playback' });
    out = ctx.createGain(); out.gain.value = 0.0001;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.003; lim.release.value = 0.15;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 3000; tone.Q.value = 0.4;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 280; body.gain.value = 2.5; body.Q.value = 0.8;
    bus = ctx.createGain(); bus.gain.value = 0.85;
    const dry = ctx.createGain(), wet = ctx.createGain(), rv = reverb();
    dry.gain.value = 0.8; wet.gain.value = 0.22;
    bus.connect(body); body.connect(tone); tone.connect(dry); tone.connect(rv); rv.connect(wet);
    dry.connect(comp); wet.connect(comp); comp.connect(lim); lim.connect(out); out.connect(ctx.destination);
  }

  function level(v, sec) {
    if (!ctx) return;
    const g = out.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t); g.linearRampToValueAtTime(Math.max(0.0001, v), t + (sec || 1.5));
  }

  let duck = false;
  const LOUD = 0.32, SOFT = 0.08;               // nhỏ, nhẹ (sếp chốt 31/10/2026)
  function start() {
    if (playing || off()) return;
    if (!ctx) build();
    ctx.resume().then(() => {
      if (ctx.state !== 'running' || playing) return;
      playing = true; clearInterval(timer); timer = setInterval(schedule, BEAT * 1000); level(duck ? SOFT : LOUD, 2); ui();
    }).catch(() => {});
  }
  function stop() { playing = false; clearInterval(timer); level(0.0001, 1); ui(); }

  function ui() {
    const b = document.getElementById('nhac-btn');
    if (!b) return;
    b.setAttribute('aria-pressed', String(playing));
    b.textContent = playing ? '🎵' : '🔇';
    b.setAttribute('aria-label', playing ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    b.title = b.getAttribute('aria-label');
  }

  // bật ngay khi mở trang; nếu trình duyệt chặn thì bật ở lần chạm / bấm / cuộn / gõ phím đầu tiên
  const EV = ['pointerdown', 'click', 'keydown', 'touchstart', 'wheel', 'scroll'];
  function first() { start(); if (playing) EV.forEach((ev) => window.removeEventListener(ev, first, true)); }
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('button');
    b.id = 'nhac-btn'; b.type = 'button'; b.className = 'nhac-btn';
    b.addEventListener('click', (e) => { e.stopPropagation(); if (playing) { save(true); stop(); } else { save(false); start(); } });
    document.body.appendChild(b); ui();
    start();
    EV.forEach((ev) => window.addEventListener(ev, first, { capture: true, passive: true }));
  });
  window.addEventListener('load', start);
  // tab bị ẩn: dừng lên lịch để không dồn nốt khi quay lại
  document.addEventListener('visibilitychange', () => {
    if (!playing) return;
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(schedule, BEAT * 1000);
  });
  // video hành trình đọc lời bình → nhạc nhỏ lại
  document.addEventListener('eco:loibinh', (e) => { duck = !!e.detail; if (playing) level(duck ? SOFT : LOUD, 0.8); });
})();
