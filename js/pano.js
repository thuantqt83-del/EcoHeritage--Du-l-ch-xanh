/* Trình xem ảnh 360° (equirectangular 2:1) bằng WebGL thuần.
 * Không phụ thuộc thư viện ngoài nên chạy được cả khi không có Internet.
 * Hỗ trợ: kéo để xoay (có quán tính), cuộn/chụm hai ngón để phóng to, phím mũi tên và +/−,
 * tự xoay, bay tới một góc nhìn, điểm sáng (hotspot) bám theo cảnh. */
(function (global) {
  'use strict';

  const DEG = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}';
  const FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'varying vec2 v;uniform sampler2D tex;uniform vec3 f;uniform vec3 r;uniform vec3 u;uniform vec2 sc;',
    'void main(){',
    '  vec3 d=normalize(f+r*(v.x*sc.x)+u*(v.y*sc.y));',
    '  float lon=atan(d.x,d.z);',
    '  float lat=asin(clamp(d.y,-1.,1.));',
    '  gl_FragColor=texture2D(tex,vec2(lon/6.28318530718+.5,.5-lat/3.14159265359));',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function create(container, opt) {
    const canvas = document.createElement('canvas');
    canvas.className = 'pano-canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', opt.label || 'Ảnh 360°. Dùng phím mũi tên để xoay, phím cộng và trừ để phóng to.');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false }) || canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL không khả dụng');

    const layer = document.createElement('div');
    layer.className = 'pano-hs';
    container.append(canvas, layer);

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = { f: gl.getUniformLocation(prog, 'f'), r: gl.getUniformLocation(prog, 'r'), u: gl.getUniformLocation(prog, 'u'), sc: gl.getUniformLocation(prog, 'sc') };

    const minH = opt.minHfov || 50, maxH = opt.maxHfov || 120;
    let yaw = opt.yaw || 0, pitch = opt.pitch || 0, hfov = clamp(opt.hfov || 95, minH, maxH);
    let vyaw = 0, vpitch = 0, autoSpeed = opt.autoRotate || 0, idleDelay = opt.delay == null ? 6000 : opt.delay;
    let lastTouch = -Infinity, anim = null, dragging = false, lastMove = 0;
    let aspect = 1, loaded = false, alive = true, raf = 0, last = performance.now(), tex = null;
    const pointers = new Map();
    let pinchPrev = 0;

    /* điểm sáng */
    const spots = (opt.hotSpots || []).map((h) => {
      const div = document.createElement('div');
      div.className = 'hs';
      if (h.render) h.render(div);
      layer.appendChild(div);
      const cp = Math.cos(h.pitch * DEG);
      return { div, d: [cp * Math.sin(h.yaw * DEG), Math.sin(h.pitch * DEG), cp * Math.cos(h.yaw * DEG)] };
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(container.clientWidth * dpr)), h = Math.max(1, Math.round(container.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      aspect = w / h;
    }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container);
    resize();

    function basis() {
      const sy = Math.sin(yaw * DEG), cy = Math.cos(yaw * DEG), sp = Math.sin(pitch * DEG), cp = Math.cos(pitch * DEG);
      return { f: [cp * sy, sp, cp * cy], r: [cy, 0, -sy], u: [-sp * sy, cp, -sp * cy] };
    }

    function draw() {
      if (!loaded) { gl.clearColor(0.04, 0.12, 0.1, 1); gl.clear(gl.COLOR_BUFFER_BIT); return; }
      const b = basis(), tanH = Math.tan(hfov * DEG / 2);
      gl.uniform3fv(U.f, b.f); gl.uniform3fv(U.r, b.r); gl.uniform3fv(U.u, b.u);
      gl.uniform2f(U.sc, tanH, tanH / aspect);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const W = container.clientWidth, H = container.clientHeight;
      for (const s of spots) {
        const z = s.d[0] * b.f[0] + s.d[1] * b.f[1] + s.d[2] * b.f[2];
        if (z < 0.05) { s.div.style.display = 'none'; continue; }
        const x = s.d[0] * b.r[0] + s.d[1] * b.r[1] + s.d[2] * b.r[2];
        const y = s.d[0] * b.u[0] + s.d[1] * b.u[1] + s.d[2] * b.u[2];
        const sx = ((x / z) / tanH * 0.5 + 0.5) * W, sy = (0.5 - (y / z) / (tanH / aspect) * 0.5) * H;
        s.div.style.display = '';
        s.div.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)';
      }
    }

    function wrapYaw() { while (yaw > 180) yaw -= 360; while (yaw < -180) yaw += 360; }

    function update(dt, now) {
      if (anim) {
        const t = clamp((now - anim.t0) / anim.dur, 0, 1), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        yaw = anim.from.yaw + (anim.to.yaw - anim.from.yaw) * e;
        pitch = anim.from.pitch + (anim.to.pitch - anim.from.pitch) * e;
        hfov = anim.from.hfov + (anim.to.hfov - anim.from.hfov) * e;
        if (t >= 1) anim = null;
      } else if (!dragging) {
        yaw += vyaw * dt; pitch += vpitch * dt;
        const k = Math.exp(-dt * 4.5); vyaw *= k; vpitch *= k;
        if (Math.abs(vyaw) < 0.05) vyaw = 0;
        if (Math.abs(vpitch) < 0.05) vpitch = 0;
        if (autoSpeed && now - lastTouch > idleDelay) yaw += autoSpeed * dt;
      }
      pitch = clamp(pitch, -85, 85);
      wrapYaw();
    }

    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      update(dt, now);
      draw();
    }
    raf = requestAnimationFrame(frame);

    /* điều khiển */
    const touch = () => { lastTouch = performance.now(); };
    const dist = () => { const p = Array.from(pointers.values()); return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };

    canvas.addEventListener('pointerdown', (e) => {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* con trỏ không còn hoạt động */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      anim = null; touch(); canvas.focus({ preventScroll: true });
      if (pointers.size === 1) { dragging = true; vyaw = vpitch = 0; lastMove = e.timeStamp; }
      else if (pointers.size === 2) { dragging = false; pinchPrev = dist(); }
    });
    canvas.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      touch();
      if (pointers.size === 1) {
        const k = hfov / Math.max(1, canvas.clientWidth), dtm = Math.max(0.004, (e.timeStamp - lastMove) / 1000);
        yaw -= dx * k; pitch += dy * k;
        vyaw = clamp(vyaw * 0.4 + (-dx * k / dtm) * 0.6, -240, 240);
        vpitch = clamp(vpitch * 0.4 + (dy * k / dtm) * 0.6, -240, 240);
        lastMove = e.timeStamp;
      } else if (pointers.size === 2) {
        const d = dist();
        if (pinchPrev > 0 && d > 0) hfov = clamp(hfov * pinchPrev / d, minH, maxH);
        pinchPrev = d;
      }
    });
    const up = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size === 0) { dragging = false; if (e.timeStamp - lastMove > 90) vyaw = vpitch = 0; }
      else if (pointers.size === 1) { dragging = true; vyaw = vpitch = 0; }
      touch();
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); hfov = clamp(hfov + e.deltaY * 0.05, minH, maxH); touch(); }, { passive: false });
    canvas.addEventListener('keydown', (e) => {
      const step = hfov / 12;
      const map = { ArrowLeft: () => { yaw -= step; }, ArrowRight: () => { yaw += step; }, ArrowUp: () => { pitch += step; }, ArrowDown: () => { pitch -= step; },
        '+': () => { hfov = clamp(hfov - 6, minH, maxH); }, '=': () => { hfov = clamp(hfov - 6, minH, maxH); }, '-': () => { hfov = clamp(hfov + 6, minH, maxH); } };
      if (map[e.key]) { e.preventDefault(); anim = null; map[e.key](); touch(); }
    });

    /* ảnh */
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!alive) return;
      try {
        const max = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        let src = img;
        if (img.width > max) {
          src = document.createElement('canvas'); src.width = max; src.height = Math.round(max * img.height / img.width);
          src.getContext('2d').drawImage(img, 0, 0, src.width, src.height);
        }
        const pot = (n) => (n & (n - 1)) === 0;
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, pot(src.width) ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        loaded = true;
        if (opt.onLoad) opt.onLoad();
      } catch (err) { if (opt.onError) opt.onError(err); }
    };
    img.onerror = () => { if (alive && opt.onError) opt.onError(new Error('Không tải được ảnh')); };
    img.src = opt.url;

    return {
      startAutoRotate(speed) { autoSpeed = speed || 3; lastTouch = -Infinity; },
      stopAutoRotate() { autoSpeed = 0; },
      zoom(delta) { hfov = clamp(hfov + delta, minH, maxH); touch(); },
      lookAt(p, y, h, ms) {
        let dy = y - yaw; dy -= Math.round(dy / 360) * 360;
        vyaw = vpitch = 0; touch();
        anim = { t0: performance.now(), dur: ms || 800, from: { yaw, pitch, hfov }, to: { yaw: yaw + dy, pitch: clamp(p, -85, 85), hfov: clamp(h || hfov, minH, maxH) } };
      },
      destroy() {
        alive = false;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        try { if (tex) gl.deleteTexture(tex); const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (err) { /* bỏ qua */ }
        canvas.remove(); layer.remove();
      }
    };
  }

  global.Pano = { create };
})(window);
