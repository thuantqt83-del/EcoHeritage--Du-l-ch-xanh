/* Cảnh 360° vẽ bằng canvas (equirectangular 2:1). Dùng làm ảnh minh họa khi chưa có ảnh chụp thật.
 * Mọi tọa độ tính trong "không gian thiết kế" 4096×2048 rồi co theo độ rộng yêu cầu.
 * Các hàm tuần hoàn theo trục x nên hai mép trái/phải khớp nhau, không thấy đường nối khi xoay. */
(function (global) {
  'use strict';

  const W0 = 4096, H0 = 2048, HZ = 1080, TAU = Math.PI * 2;

  /* ---------- tiện ích màu / ngẫu nhiên ---------- */
  const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (r, gr, b) => '#' + [r, gr, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return toHex(...A.map((v, i) => v + (B[i] - v) * t)); };

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- bảng màu ---------- */
  const SKIES = {
    day: { top: '#3f8fcb', mid: '#8cc8e8', bot: '#eaf6ef', sun: [0.64, 560], glow: '#fff7d0', cloud: '#ffffff' },
    dawn: { top: '#6b8fc4', mid: '#f1b995', bot: '#fdebd2', sun: [0.40, 900], glow: '#ffe0a3', cloud: '#fff1e2' },
    sunset: { top: '#35467d', mid: '#d4706b', bot: '#fbc98b', sun: [0.30, 930], glow: '#ffeab0', cloud: '#ffd7bd' },
    mist: { top: '#86a9a8', mid: '#c4d8d2', bot: '#eef4ee', sun: [0.58, 600], glow: '#ffffff', cloud: '#f7fbf8' }
  };

  const TINT = { karst: '#24624f', hills: '#3f7a4a', flat: '#4f7d55' };

  const TERRAINS = {
    karst: [
      { n: 11, h: [420, 620], w: [0.012, 0.024], base: HZ + 10, t: 0.16 },
      { n: 9, h: [320, 520], w: [0.016, 0.03], base: HZ + 50, t: 0.42 },
      { n: 7, h: [220, 400], w: [0.022, 0.045], base: HZ + 95, t: 0.78, fol: true }
    ],
    hills: [
      { smooth: true, h: [150, 300], base: HZ + 10, t: 0.2 },
      { smooth: true, h: [110, 250], base: HZ + 55, t: 0.5 },
      { smooth: true, h: [70, 170], base: HZ + 95, t: 0.8, fol: true }
    ],
    flat: [
      { smooth: true, h: [30, 80], base: HZ + 8, t: 0.35 },
      { smooth: true, h: [20, 60], base: HZ + 40, t: 0.65, fol: true }
    ]
  };

  const PAL = {
    stone: '#d8cdb4', stoneDark: '#a79a7e', wall: '#efe0bd', wallDark: '#c9b78d',
    roof: '#7a4a3a', roofHi: 'rgba(255,255,255,.12)', red: '#b4392b', redDark: '#7d241c',
    gold: '#e0b04a', goldDark: '#b88a2a', wood: '#6e4a2f', dark: '#2d2a26', cream: '#fbf3df'
  };
  const PALS = {
    warm: PAL,
    stone: Object.assign({}, PAL, { wall: '#d0c4ab', wallDark: '#a09580', roof: '#5a5448' })
  };

  /* ---------- cọ vẽ ---------- */
  let g; // context 2D đang vẽ (render chạy đồng bộ nên dùng biến chung được)

  const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  const fill = (c) => { g.fillStyle = c; g.fill(); };
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const ell = (x, y, rx, ry, c, a) => {
    g.save();
    if (a != null) g.globalAlpha = a;
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fillStyle = c; g.fill();
    g.restore();
  };
  const arch = (x, y, w, h, c) => {
    g.beginPath();
    g.moveTo(x - w / 2, y);
    g.lineTo(x - w / 2, y - h + w / 2);
    g.arc(x, y - h + w / 2, w / 2, Math.PI, 0);
    g.lineTo(x + w / 2, y);
    g.closePath(); g.fillStyle = c; g.fill();
  };

  // mái cong nhiều tầng kiểu đình chùa Việt
  function roofTier(cx, y, w, h, c, hi) {
    g.beginPath();
    g.moveTo(cx - w, y - 16);
    g.quadraticCurveTo(cx - w * 0.62, y + 8, cx - w * 0.36, y - h * 0.4);
    g.lineTo(cx - w * 0.13, y - h);
    g.lineTo(cx + w * 0.13, y - h);
    g.lineTo(cx + w * 0.36, y - h * 0.4);
    g.quadraticCurveTo(cx + w * 0.62, y + 8, cx + w, y - 16);
    g.lineTo(cx + w * 0.84, y + 14);
    g.lineTo(cx - w * 0.84, y + 14);
    g.closePath(); g.fillStyle = c; g.fill();
    g.strokeStyle = hi || 'rgba(255,255,255,.12)'; g.lineWidth = 3;
    for (let i = -3; i <= 3; i++) {
      g.beginPath(); g.moveTo(cx + i * w * 0.07, y - h * 0.92); g.lineTo(cx + i * w * 0.2, y + 8); g.stroke();
    }
    rect(cx - w * 0.15, y - h - 6, w * 0.3, 7, 'rgba(0,0,0,.22)');
  }

  /* ---------- bầu trời ---------- */
  function drawSky(sky, R) {
    const gr = g.createLinearGradient(0, 0, 0, HZ + 10);
    gr.addColorStop(0, sky.top); gr.addColorStop(0.55, sky.mid); gr.addColorStop(1, sky.bot);
    g.fillStyle = gr; g.fillRect(0, 0, W0, HZ + 12);

    const sx = sky.sun[0] * W0, sy = sky.sun[1];
    const glow = g.createRadialGradient(sx, sy, 10, sx, sy, 620);
    glow.addColorStop(0, sky.glow); glow.addColorStop(0.18, mix(sky.glow, sky.mid, 0.45) + 'cc'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = glow; g.fillRect(sx - 640, sy - 640, 1280, 1280);
    ell(sx, sy, 74, 74, sky.glow);

    for (let k = 0; k < 13; k++) {
      const cx = R() * W0, cy = 220 + R() * 520, sz = 130 + R() * 190;
      for (const off of [-W0, 0, W0]) {
        for (let i = 0; i < 6; i++) {
          ell(cx + off + (i - 2.5) * sz * 0.42, cy + (R() - 0.5) * sz * 0.1, sz * (0.34 + R() * 0.22), sz * 0.15 * (0.7 + R() * 0.5), sky.cloud, 0.5);
        }
      }
    }
  }

  /* ---------- mặt đất ---------- */
  function drawGround(kind, sky, R) {
    const top = HZ + 8;
    const STOPS = {
      water: [mix(sky.bot, '#4f9c9e', 0.5), '#1c6670', '#0d3e4c'],
      land: [mix(sky.bot, '#8bb06a', 0.55), '#5f8f4c', '#2c5a3a'],
      paddy: [mix(sky.bot, '#9cc65f', 0.55), '#7db04a', '#3b7a38'],
      sand: [mix(sky.bot, '#eadbb6', 0.6), '#d9c595', '#b79f70'],
      salt: [mix(sky.bot, '#f2f6f4', 0.6), '#e2ecec', '#a9bec3']
    };
    const st = STOPS[kind] || STOPS.land;
    const gr = g.createLinearGradient(0, top, 0, H0);
    gr.addColorStop(0, st[0]); gr.addColorStop(0.35, st[1]); gr.addColorStop(1, st[2]);
    g.fillStyle = gr; g.fillRect(0, top, W0, H0 - top);

    const span = H0 - top;
    if (kind === 'water') {
      for (let i = 0; i < 900; i++) {
        const t = Math.pow(R(), 1.6), y = top + 20 + t * (span - 20), len = 30 + t * 260, x = R() * W0;
        g.strokeStyle = 'rgba(255,255,255,' + (0.06 + 0.12 * R()).toFixed(2) + ')'; g.lineWidth = 2 + t * 5;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
      }
      const sx = sky.sun[0] * W0;
      for (let i = 0; i < 170; i++) {
        const y = top + 10 + R() * 520, x = sx + (R() - 0.5) * (40 + (y - top) * 0.3);
        g.strokeStyle = 'rgba(255,255,255,' + (0.18 + 0.3 * R()).toFixed(2) + ')'; g.lineWidth = 3 + (y - top) * 0.008;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 24 + R() * 60, y); g.stroke();
      }
    } else if (kind === 'land') {
      for (let i = 0; i < 1100; i++) {
        const t = Math.pow(R(), 1.4), y = top + 30 + t * (span - 30), x = R() * W0, h = 8 + t * 34;
        g.strokeStyle = mix('#2c5a3a', '#9acb78', R()); g.lineWidth = 2 + t * 3;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 10, y - h); g.stroke();
      }
    } else if (kind === 'paddy') {
      let band = 0;
      for (let y = top + 4; y < H0; y += 10 + (y - top) * 0.06) {
        rect(0, y, W0, 4 + (y - top) * 0.03, band++ % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)');
      }
      for (let i = 0; i < 500; i++) {
        const t = Math.pow(R(), 1.3), y = top + 24 + t * (span - 24), x = R() * W0;
        g.strokeStyle = 'rgba(214,240,150,.35)'; g.lineWidth = 2 + t * 3;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - 10 - t * 26); g.stroke();
      }
    } else if (kind === 'salt') {
      g.strokeStyle = 'rgba(110,140,152,.45)'; g.lineWidth = 3;
      for (let y = top + 28; y < H0; y += 22 + (y - top) * 0.12) { g.beginPath(); g.moveTo(0, y); g.lineTo(W0, y); g.stroke(); }
      g.strokeStyle = 'rgba(110,140,152,.3)';
      for (let x = 0; x < W0; x += 64) { g.beginPath(); g.moveTo(x, top); g.lineTo(x, H0); g.stroke(); }
      for (let i = 0; i < 160; i++) {
        const t = R(), y = top + 20 + t * (span - 20);
        rect(R() * W0, y, 40 + t * 120, 8 + t * 18, 'rgba(120,170,200,' + (0.12 + 0.18 * R()).toFixed(2) + ')');
      }
    }
  }

  /* ---------- núi / đồi ---------- */
  function makeRidge(spec, R, extraBumps) {
    if (spec.smooth) {
      const comps = [[2 + Math.floor(R() * 3), R(), 1], [5 + Math.floor(R() * 4), R(), 0.5], [11 + Math.floor(R() * 6), R(), 0.2]];
      const norm = comps.reduce((s, c) => s + c[2], 0);
      return (x) => {
        let v = 0;
        for (const [f, p, a] of comps) v += a * Math.sin(TAU * (f * x + p));
        return spec.h[0] + (spec.h[1] - spec.h[0]) * (0.5 + 0.5 * v / norm);
      };
    }
    const bumps = Array.from({ length: spec.n }, () => ({
      c: R(), h: spec.h[0] + R() * (spec.h[1] - spec.h[0]), w: spec.w[0] + R() * (spec.w[1] - spec.w[0]), p: 1.8 + R() * 1.2
    }));
    (extraBumps || []).forEach((c) => bumps.push({ c, h: spec.h[1] * 0.95, w: 0.055, p: 2.4 }));
    const ph = [R(), R()];
    return (x) => {
      let h = 0;
      for (const b of bumps) {
        let d = x - b.c; d -= Math.round(d);
        const v = b.h * Math.exp(-Math.pow(Math.abs(d) / b.w, b.p));
        if (v > h) h = v;
      }
      return h + 14 * Math.sin(TAU * (23 * x + ph[0])) + 8 * Math.sin(TAU * (61 * x + ph[1]));
    };
  }

  function drawLayer(spec, fn, color, water, sky, R, karst) {
    const steps = 640;
    if (water) {
      g.save(); g.globalAlpha = 0.3; g.fillStyle = color; g.beginPath(); g.moveTo(0, spec.base);
      for (let i = 0; i <= steps; i++) { const x = i / steps; g.lineTo(x * W0, spec.base + fn(x) * 0.8); }
      g.lineTo(W0, spec.base); g.closePath(); g.fill(); g.restore();
    }
    g.fillStyle = color; g.beginPath(); g.moveTo(0, spec.base);
    for (let i = 0; i <= steps; i++) { const x = i / steps; g.lineTo(x * W0, spec.base - fn(x)); }
    g.lineTo(W0, spec.base); g.closePath(); g.fill();

    if (karst) { // vân đá thẳng đứng
      g.lineWidth = 5;
      for (let i = 0; i < 110; i++) {
        const x = R(), y = spec.base - fn(x);
        g.strokeStyle = 'rgba(10,30,22,' + (0.05 + R() * 0.07).toFixed(2) + ')';
        g.beginPath(); g.moveTo(x * W0, y + 20); g.lineTo(x * W0 + (R() - 0.5) * 30, Math.min(spec.base, y + 90 + R() * 140)); g.stroke();
      }
    }
    if (spec.fol) { // tán cây trên đỉnh
      for (let x = 0; x < W0; x += 7) {
        const y = spec.base - fn(x / W0), r = 9 + R() * 14;
        ell(x, y + 6 + R() * 8, r * 1.2, r, mix(color, '#9bd08a', R() * 0.18));
      }
    }
    // sương mù chân núi
    const hz = g.createLinearGradient(0, spec.base - 230, 0, spec.base);
    hz.addColorStop(0, 'rgba(255,255,255,0)'); hz.addColorStop(1, mix(sky.bot, '#ffffff', 0.2) + '99');
    g.fillStyle = hz; g.fillRect(0, spec.base - 230, W0, 230);
  }

  /* ---------- các công trình / vật thể ---------- */
  const DRAW = {
    pagoda(p) {
      rect(-120, -22, 240, 22, p.stone); rect(-100, -40, 200, 18, p.stoneDark);
      let y = -40;
      for (let i = 0; i < 5; i++) {
        const bw = 92 * (1 - i * 0.1) * 1.9;
        rect(-bw / 2, y - 44, bw, 44, p.wall); rect(-bw / 2, y - 44, bw, 6, p.wallDark);
        arch(0, y, bw * 0.22, 34, p.dark);
        roofTier(0, y - 44, bw * 0.62, 34, p.roof, p.roofHi);
        y -= 66;
      }
      rect(-5, y - 70, 10, 70, p.gold); ell(0, y - 76, 11, 11, p.gold); ell(0, y - 96, 6, 12, p.goldDark);
    },

    hall(p) {
      rect(-270, -22, 540, 22, p.stone); rect(-250, -36, 500, 14, p.stoneDark);
      rect(-110, -300, 220, 70, p.wall);
      for (let i = 0; i < 4; i++) rect(-100 + i * 62, -300, 12, 70, p.red);
      roofTier(0, -300, 190, 72, p.roof, p.roofHi);
      rect(-210, -190, 420, 154, '#33241d');
      for (let i = 0; i < 7; i++) rect(-206 + i * 66, -190, 15, 154, p.red);
      rect(-52, -186, 104, 150, '#5b3a24'); arch(0, -36, 90, 128, '#241811');
      rect(-70, -214, 140, 24, p.gold); rect(-62, -208, 124, 12, p.redDark);
      roofTier(0, -190, 300, 66, p.roof, p.roofHi);
      ell(0, -382, 9, 9, p.gold);
    },

    gate(p) {
      for (const sx of [-1, 1]) {
        rect(sx * 190 - 60, -150, 120, 150, p.wall); rect(sx * 190 - 60, -150, 120, 8, p.wallDark);
        arch(sx * 190, 0, 62, 100, p.dark);
        roofTier(sx * 190, -150, 100, 40, p.roof, p.roofHi);
      }
      rect(-90, -214, 180, 214, p.wall); rect(-90, -214, 180, 8, p.wallDark);
      arch(0, 0, 100, 140, p.dark);
      rect(-60, -182, 120, 18, p.gold);
      roofTier(0, -214, 150, 50, p.roof, p.roofHi);
      rect(-68, -292, 136, 62, p.wall); arch(0, -230, 40, 48, p.dark);
      roofTier(0, -292, 110, 56, p.roof, p.roofHi);
    },

    house(p, R, lm) {
      rect(-150, -112, 300, 112, p.wall); rect(-150, -112, 300, 8, p.wallDark);
      rect(-36, -86, 72, 86, p.wood);
      rect(-120, -84, 52, 44, '#3d3a34'); rect(68, -84, 52, 44, '#3d3a34');
      path([[-200, -100], [0, -232], [200, -100]]); fill(p.roof);
      g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 3;
      for (let k = 1; k <= 5; k++) {
        const hh = k * 22, xh = 200 * (1 - hh / 132);
        g.beginPath(); g.moveTo(-xh, -100 - hh); g.lineTo(xh, -100 - hh); g.stroke();
      }
      if (lm.decor === 'silk') {
        rect(-250, -154, 500, 8, p.wood); rect(-250, -154, 8, 154, p.wood); rect(242, -154, 8, 154, p.wood);
        const cols = ['#c8453b', '#e0a43a', '#3f8f7a', '#7a4f9c', '#d9577a', '#2f6fb0'];
        for (let i = 0; i < 9; i++) {
          const x = -230 + i * 54, h = 90 + R() * 50;
          g.fillStyle = cols[i % cols.length]; g.beginPath();
          g.moveTo(x, -146); g.lineTo(x + 40, -146);
          g.quadraticCurveTo(x + 46, -146 + h / 2, x + 38, -146 + h);
          g.quadraticCurveTo(x + 20, -146 + h + 12, x + 2, -146 + h);
          g.quadraticCurveTo(x - 6, -146 + h / 2, x, -146); g.fill();
        }
      } else if (lm.decor === 'lace') {
        rect(-250, -154, 500, 8, p.wood); rect(-250, -154, 8, 154, p.wood); rect(242, -154, 8, 154, p.wood);
        for (let i = 0; i < 7; i++) {
          const x = -232 + i * 68;
          rect(x, -146, 56, 84, '#fffaf0');
          for (let k = 0; k < 4; k++) ell(x + 7 + k * 14, -62, 8, 8, '#fffaf0');
          for (let k = 0; k < 6; k++) ell(x + 14 + (k % 3) * 14, -120 + Math.floor(k / 3) * 30, 5, 5, 'rgba(120,100,70,.22)');
        }
      }
    },

    drum(p) {
      path([[-190, 0], [190, 0], [150, -44], [-150, -44]]); fill(p.wood);
      rect(-34, -78, 68, 36, p.wood);
      ell(52, -210, 122, 150, '#6b2a1e');
      const face = g.createRadialGradient(-10, -220, 20, 0, -210, 150);
      face.addColorStop(0, '#d9714a'); face.addColorStop(1, '#a23a28');
      g.beginPath(); g.ellipse(0, -210, 124, 152, 0, 0, TAU); g.fillStyle = face; g.fill();
      g.lineWidth = 12; g.strokeStyle = '#5a2a1a'; g.stroke();
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; ell(Math.cos(a) * 112, -210 + Math.sin(a) * 140, 5, 5, p.gold); }
      ell(0, -210, 22, 26, '#7d241c');
      g.strokeStyle = '#d9a86a'; g.lineWidth = 8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-220, -80); g.lineTo(-120, -150); g.stroke();
      g.beginPath(); g.moveTo(-230, -120); g.lineTo(-130, -190); g.stroke();
    },

    cathedral(p) {
      roofTier(0, -210, 270, 90, p.roof, p.roofHi);
      rect(-230, -210, 460, 210, p.wall); rect(-230, -210, 460, 10, p.wallDark);
      for (const sx of [-1, 1]) {
        rect(sx * 270 - 45, -160, 90, 160, p.wall); arch(sx * 270, 0, 38, 80, p.dark);
        roofTier(sx * 270, -160, 70, 44, p.roof, p.roofHi);
      }
      rect(-86, -340, 172, 340, p.wall); rect(-86, -340, 172, 10, p.wallDark);
      for (let k = 0; k < 3; k++) rect(-86, -120 - k * 90, 172, 5, p.wallDark);
      arch(0, 0, 84, 150, p.dark);
      g.beginPath(); g.arc(0, -262, 28, 0, TAU); g.fillStyle = p.dark; g.fill();
      g.lineWidth = 6; g.strokeStyle = p.gold; g.stroke();
      roofTier(0, -340, 120, 76, p.roof, p.roofHi);
      rect(-3, -472, 6, 40, p.gold); rect(-13, -460, 26, 6, p.gold);
      for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) arch(sx * (150 + i * 38), 0, 26, 84, p.dark);
    },

    boat(p) {
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 4;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, 14 + i * 9, 210 + i * 44, 8 + i * 3, 0, 0, TAU); g.stroke(); }
      g.beginPath();
      g.moveTo(-180, -44); g.quadraticCurveTo(-140, 8, 0, 10); g.quadraticCurveTo(140, 8, 190, -52);
      g.quadraticCurveTo(120, -28, 0, -30); g.quadraticCurveTo(-120, -28, -180, -44);
      g.fillStyle = '#34382f'; g.fill();
      g.beginPath(); g.moveTo(-150, -34); g.quadraticCurveTo(0, -18, 160, -40); g.lineWidth = 5; g.strokeStyle = '#c8453b'; g.stroke();
      path([[-6, -44], [48, -44], [42, -96], [4, -96]]); fill('#3a5f78');
      ell(26, -114, 15, 17, '#e2b48f');
      path([[-22, -120], [26, -164], [76, -120]]); fill('#e6cf8e');
      g.strokeStyle = '#5b3e27'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(44, -80); g.lineTo(-150, 6); g.stroke();
      path([[-150, 6], [-186, 20], [-172, -8]]); fill('#7a5436');
    },

    buddha(p) {
      rect(-170, -60, 340, 60, p.stone); rect(-170, -60, 340, 8, p.gold);
      for (let i = -4; i <= 4; i++) ell(i * 36, -66, 26, 20, '#f2a8c0');
      const bg = g.createLinearGradient(0, -270, 0, -60);
      bg.addColorStop(0, '#f3cf6a'); bg.addColorStop(1, '#c9972b');
      g.beginPath(); g.moveTo(-124, -80); g.quadraticCurveTo(-136, -200, -42, -256); g.lineTo(42, -256); g.quadraticCurveTo(136, -200, 124, -80); g.closePath();
      g.fillStyle = bg; g.fill();
      ell(0, -100, 118, 28, '#e9bd4e');
      ell(0, -292, 42, 46, '#f3cf6a'); ell(0, -340, 18, 20, '#e9bd4e');
      g.lineWidth = 6; g.strokeStyle = 'rgba(184,138,42,.55)'; g.beginPath(); g.arc(0, -300, 88, 0, TAU); g.stroke();
    },

    tree(p, R, lm) {
      if (lm.variant === 'mangrove') {
        g.strokeStyle = '#4a3a2a'; g.lineWidth = 7;
        for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * 12, -90); g.quadraticCurveTo(i * 22, -40, i * 30, 8); g.stroke(); }
        for (let i = 0; i < 22; i++) ell(-190 + R() * 380, -120 - R() * 70, 60 + R() * 40, 40 + R() * 24, mix('#2f6b3f', '#7fbf6a', R() * 0.5));
      } else {
        path([[-30, 0], [-18, -150], [-8, -240], [8, -240], [18, -150], [30, 0]]); fill('#5d4330');
        for (let i = 0; i < 26; i++) {
          const a = R() * TAU, rr = R() * 150;
          ell(Math.cos(a) * rr * 1.25, -300 + Math.sin(a) * rr * 0.55, 62 + R() * 46, 50 + R() * 34, mix('#2b6a3c', '#86c36c', R() * 0.6));
        }
      }
    },

    kiln() {
      const glow = g.createRadialGradient(0, -60, 10, 0, -60, 340);
      glow.addColorStop(0, 'rgba(255,170,60,.8)'); glow.addColorStop(1, 'rgba(255,120,30,0)');
      g.fillStyle = glow; g.fillRect(-360, -420, 720, 540);
      path([[-60, -200], [-42, -430], [42, -430], [60, -200]]); fill('#8a3f30');
      path([[-130, 0], [-100, -200], [100, -200], [130, 0]]); fill('#9a4a38');
      g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 3;
      for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(-124 + k * 4, -k * 22); g.lineTo(124 - k * 4, -k * 22); g.stroke(); }
      arch(0, 0, 112, 124, '#1c0e08');
      g.beginPath(); g.moveTo(-34, 0); g.quadraticCurveTo(-30, -70, -6, -90); g.quadraticCurveTo(6, -50, 20, -60); g.quadraticCurveTo(34, -30, 34, 0); g.closePath(); g.fillStyle = '#ff9a2e'; g.fill();
      g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-12, -40, 2, -52); g.quadraticCurveTo(14, -24, 16, 0); g.closePath(); g.fillStyle = '#ffd35c'; g.fill();
      for (let i = 0; i < 5; i++) ell(10 + i * 14, -470 - i * 52, 40 + i * 14, 24 + i * 8, '#6b6b6b', 0.22 - i * 0.03);
    },

    panel(p) {
      rect(-130, -20, 260, 20, p.wood);
      rect(-110, -320, 220, 300, '#1b1210'); rect(-98, -308, 196, 276, '#2a1b16');
      g.save(); g.translate(0, -190);
      for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * TAU / 8); ell(0, -46, 18, 44, p.gold); g.restore(); }
      ell(0, 0, 20, 20, p.red);
      g.restore();
      g.strokeStyle = p.gold; g.lineWidth = 4;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-60 + i * 40, -50, 20, Math.PI, 0); g.stroke(); }
      g.strokeStyle = p.goldDark; g.lineWidth = 6; g.strokeRect(-98, -308, 196, 276);
    },

    hoop(p) {
      rect(-6, -120, 12, 120, p.wood); rect(-60, -8, 120, 8, p.wood);
      g.beginPath(); g.arc(0, -230, 112, 0, TAU); g.fillStyle = '#fffaf0'; g.fill();
      g.lineWidth = 14; g.strokeStyle = '#8a5a35'; g.stroke();
      g.strokeStyle = '#3f8f5a'; g.lineWidth = 5; g.beginPath(); g.moveTo(-10, -150); g.quadraticCurveTo(-20, -200, 0, -250); g.stroke();
      for (const s of [-1, 1]) { g.save(); g.translate(-8, -190); g.rotate(s * 0.9); ell(s * 24, -6, 28, 10, '#4faa6c'); g.restore(); }
      g.save(); g.translate(0, -262);
      for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * TAU / 6); ell(0, -24, 13, 26, i % 2 ? '#e86f8a' : '#f4a6c0'); g.restore(); }
      ell(0, 0, 10, 10, p.gold);
      g.restore();
    },

    loom(p) {
      rect(-130, -300, 16, 300, p.wood); rect(114, -300, 16, 300, p.wood);
      rect(-140, -312, 280, 16, p.wood); rect(-140, -126, 280, 14, p.wood);
      g.lineWidth = 2;
      for (let i = 0; i < 36; i++) { g.strokeStyle = i % 7 ? '#e8dcc0' : '#d9577a'; g.beginPath(); g.moveTo(-110 + i * 6.2, -296); g.lineTo(-110 + i * 6.2, -130); g.stroke(); }
      rect(-112, -130, 224, 76, '#c8453b'); rect(-112, -118, 224, 10, '#e0a43a'); rect(-112, -92, 224, 8, '#2f6fb0'); rect(-112, -72, 224, 10, '#e0a43a');
      rect(-90, -44, 180, 12, p.wood); rect(-80, -32, 14, 32, p.wood); rect(66, -32, 14, 32, p.wood);
    },

    salt() {
      const R2 = rng(7);
      for (let i = -3; i <= 3; i++) {
        const h = 70 + R2() * 70, w = h * 1.5, x = i * 110 + (R2() - 0.5) * 30;
        path([[x - w / 2, 0], [x, -h], [x + w / 2, 0]]); fill('#f7fbfa');
        path([[x, -h], [x + w / 2, 0], [x + w * 0.1, 0]]); fill('#cfdcde');
      }
    },

    cave() {
      g.beginPath(); g.ellipse(0, 0, 170, 120, 0, Math.PI, TAU); g.closePath(); g.fillStyle = '#3b4a43'; g.fill();
      const gr = g.createRadialGradient(0, 0, 8, 0, 0, 140);
      gr.addColorStop(0, '#cfe6df'); gr.addColorStop(0.3, '#1d2b27'); gr.addColorStop(1, '#0c1513');
      g.beginPath(); g.ellipse(0, 0, 140, 96, 0, Math.PI, TAU); g.closePath(); g.fillStyle = gr; g.fill();
    },

    lotus(p, R) {
      for (let i = 0; i < 9; i++) {
        const x = (R() - 0.5) * 520, y = (R() - 0.5) * 40, r = 40 + R() * 32;
        ell(x, y, r * 1.5, r * 0.34, mix('#2f8a52', '#6fbf7a', R() * 0.5));
      }
      for (let i = 0; i < 4; i++) {
        g.save(); g.translate((R() - 0.5) * 420, -8 - R() * 24);
        g.strokeStyle = '#2f8a52'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 30); g.lineTo(0, -4); g.stroke();
        for (let k = -2; k <= 2; k++) { g.save(); g.rotate(k * 0.42); ell(0, -26, 12, 28, '#f4a6c0'); g.restore(); }
        g.restore();
      }
    },

    birds(p, R) {
      g.strokeStyle = '#26333b'; g.lineWidth = 5; g.lineCap = 'round';
      for (let i = 0; i < 22; i++) {
        const x = (R() - 0.5) * 520, y = (R() - 0.5) * 170, s = 14 + R() * 20;
        g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s / 2, y - s * 0.7, x, y); g.quadraticCurveTo(x + s / 2, y - s * 0.7, x + s, y); g.stroke();
      }
    }
  };

  const BASE_Y = { boat: HZ + 330, lotus: HZ + 380, cave: HZ + 100, salt: HZ + 220, birds: HZ - 330 };
  const HEIGHT = { pagoda: 440, hall: 390, gate: 300, house: 232, drum: 360, cathedral: 470, boat: 160, buddha: 360, tree: 330, kiln: 430, panel: 320, hoop: 340, loom: 312, salt: 140, cave: 120, lotus: 70, birds: 120 };
  const NO_SHADOW = new Set(['boat', 'cave', 'lotus', 'birds', 'kiln']);
  const ON_ISLAND = new Set(['pagoda', 'hall', 'gate', 'house', 'cathedral', 'buddha', 'tree', 'drum', 'panel']);

  const baseOf = (lm) => (lm.y != null ? lm.y : (BASE_Y[lm.kind] != null ? BASE_Y[lm.kind] : HZ + 140));

  function drawLandmark(lm, scene, R) {
    const pal = PALS[lm.pal] || PALS.warm;
    g.save();
    g.translate(lm.x * W0, baseOf(lm));
    g.scale(lm.s || 1, lm.s || 1);
    if (scene.ground === 'water' && ON_ISLAND.has(lm.kind)) {
      ell(0, 10, 330, 34, '#5b8a5c'); ell(0, 4, 300, 20, '#79a766');
    } else if (!NO_SHADOW.has(lm.kind)) {
      ell(0, 6, 180, 14, '#0b2a1f', 0.25);
    }
    DRAW[lm.kind](pal, R, lm);
    g.restore();
  }

  /* ---------- dựng một cảnh ---------- */
  function render(site, width) {
    const sc = site.scene, sky = SKIES[sc.sky] || SKIES.day, R = rng(sc.seed || 1);
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = Math.round(width / 2);
    g = canvas.getContext('2d');
    g.scale(width / W0, width / W0);

    drawSky(sky, R);
    drawGround(sc.ground, sky, R);

    const water = sc.ground === 'water';
    const caves = sc.landmarks.filter((l) => l.kind === 'cave').map((l) => l.x);
    const specs = TERRAINS[sc.terrain] || TERRAINS.flat;
    specs.forEach((spec, i) => {
      const color = mix(sky.bot, TINT[sc.terrain] || TINT.flat, spec.t);
      const fn = makeRidge(spec, R, i === specs.length - 1 ? caves : null);
      drawLayer(spec, fn, color, water, sky, R, sc.terrain === 'karst');
    });

    sc.landmarks.slice().sort((a, b) => baseOf(a) - baseOf(b)).forEach((lm) => drawLandmark(lm, sc, rng((sc.seed || 1) * 31 + Math.round(lm.x * 1000))));
    return canvas;
  }

  /* ---------- ảnh thu nhỏ cho thẻ ---------- */
  function crop(out, src, cxFrac, wFrac, midFrac, horizonAt) {
    const c = out.getContext('2d'), cw = out.width, ch = out.height;
    const sw = src.width * wFrac, sh = sw * ch / cw;
    const sy = Math.max(0, Math.min(src.height - sh, src.height * midFrac - sh * horizonAt));
    const sx = (((cxFrac * src.width - sw / 2) % src.width) + src.width) % src.width;
    const first = Math.min(sw, src.width - sx);
    c.drawImage(src, sx, sy, first, sh, 0, 0, first * cw / sw, ch);
    if (first < sw) c.drawImage(src, 0, sy, sw - first, sh, first * cw / sw, 0, (sw - first) * cw / sw, ch);
  }

  /* Mở trang bằng bấm đúp index.html (file://): trình duyệt không cho vẽ ảnh jpg lên khung 360° / canvas,
   * nên lấy bản ảnh nhúng sẵn trong js/anh-360-nhung/<mã>.js (cách tạo: CAU-LENH-TAO-APP.md, mục 3). Mở qua web thì dùng thẳng tệp jpg. */
  const nhung = {};
  function photoSrc(site) {
    if (location.protocol !== 'file:') return Promise.resolve(site.photo);
    if (!nhung[site.id]) nhung[site.id] = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'js/anh-360-nhung/' + site.id + '.js';
      s.onload = () => resolve(((window.ANH_360_NHUNG || {})[site.id]) || site.photo);
      s.onerror = () => resolve(site.photo);
      document.head.appendChild(s);
    });
    return nhung[site.id];
  }

  function thumb(site, cw, ch) {
    cw = cw || 640; ch = ch || 400;
    const out = document.createElement('canvas');
    out.width = cw; out.height = ch;
    const cx = site.scene.landmarks[0] ? site.scene.landmarks[0].x : 0.5;
    const fromScene = () => { crop(out, render(site, 1280), cx, 0.5, HZ / H0, 0.58); return out; };
    if (!site.photo) return Promise.resolve(fromScene());
    return photoSrc(site).then((src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { crop(out, img, 0.5, 0.32, 0.5, 0.55); resolve(out); };
      img.onerror = () => resolve(fromScene());
      img.src = src;
    }));
  }

  /* ---------- ảnh toàn cảnh cho trình xem 360° ---------- */
  const urlCache = new Map();
  function panoramaURL(site) {
    if (site.photo) return photoSrc(site);
    if (urlCache.has(site.id)) return Promise.resolve(urlCache.get(site.id));
    return new Promise((resolve, reject) => {
      render(site, 4096).toBlob((blob) => {
        if (!blob) { reject(new Error('toBlob failed')); return; }
        const url = URL.createObjectURL(blob);
        urlCache.set(site.id, url);
        resolve(url);
      }, 'image/jpeg', 0.92);
    });
  }

  /* ---------- điểm sáng & góc nhìn ban đầu ---------- */
  function hotspots(site) {
    if (site.hotspots) return site.hotspots;
    return site.scene.landmarks.map((lm) => {
      const y = baseOf(lm) - (HEIGHT[lm.kind] || 250) * (lm.s || 1) * 0.62;
      return { yaw: (lm.x - 0.5) * 360, pitch: (H0 / 2 - y) * 180 / H0, label: lm.label, text: lm.text };
    });
  }

  function startView(site) {
    const h = hotspots(site)[0];
    return { yaw: h ? h.yaw : 0, pitch: 2 };
  }

  global.Scenes = { render, thumb, panoramaURL, hotspots, startView, rng };
})(window);
