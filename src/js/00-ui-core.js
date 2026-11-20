/* ───────────── Shared helpers ───────────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutQuad = k => 1 - (1 - k) * (1 - k);
const easeInOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
const nf = (n, d = 0) => Number(n).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: Math.abs(n) >= 10000 });
const SVGNS = 'http://www.w3.org/2000/svg';
function S(tag, attrs = {}, parent) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function H(tag, attrs = {}, html, parent) {
  const e = document.createElement(tag);
  for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k === 'style') e.style.cssText = attrs[k]; else e.setAttribute(k, attrs[k]); }
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
const store = {
  get(k, d) { try { const v = localStorage.getItem('sio2:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('sio2:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
};
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
const wait = ms => new Promise(r => setTimeout(r, ms));
let uidN = 0; const uid = p => (p || 'u') + (++uidN);

/* Hooks the 3D module fills in once Three.js has loaded */
const H3 = { ready: false, hero: null, wheel: null, detail: null };

/* ───────────── Sprite registry (3D pieces baked to images) ───────────── */
const SPRITES = {};
const spriteWaiters = {};
function registerSprite(id, url, aspect) {
  SPRITES[id] = { url, aspect };
  (spriteWaiters[id] || []).forEach(fn => fn(SPRITES[id]));
  delete spriteWaiters[id];
}
function whenSprite(id, fn) { if (SPRITES[id]) fn(SPRITES[id]); else (spriteWaiters[id] ||= []).push(fn); }

/* ───────────── Blendy measurements ───────────── */
const COVER_T = [0, .031, .134, .206, .278, .34, .412, .485, .546, .583, .62, .69, .79, .85, .93, 1];
const COVER_C = [0, .006, .012, .023, .047, .07, .105, .158, .246, .55, .825, .9, .94, .956, .975, 1];
function cover(t) {
  if (t <= 0) return 0; if (t >= 1) return 1;
  let i = 1; while (COVER_T[i] < t) i++;
  const k = (t - COVER_T[i - 1]) / (COVER_T[i] - COVER_T[i - 1]);
  const s = k * k * (3 - 2 * k);
  return COVER_C[i - 1] + (COVER_C[i] - COVER_C[i - 1]) * s;
}
const FACTORS = { word: .40, shadow: .30, bottle: .15, fruit: .55, corner: .75, text: .25 };
const LAYER_NAMES = ['word', 'shadow', 'bottle', 'fruit', 'corner', 'text'];
const SHADOWS = [[345, 650, 170, 24], [720, 708, 320, 30], [1318, 638, 160, 22], [1045, 760, 150, 22]];
const C = 'corner';
const LAYOUTS = [
  [ // Berry
    { i: 2, x: 383, y: 178, w: 104, r: 0 }, { i: 3, x: 960, y: 232, w: 118, r: 0 }, { i: 1, x: 295, y: 478, w: 129, r: -8 },
    { i: 1, x: 1247, y: 455, w: 123, r: 15 }, { i: 2, x: 968, y: 590, w: 110, r: 30 },
    { i: 1, x: -15, y: 590, w: 255, r: 0, L: C }, { i: 3, x: 1282, y: 40, w: 200, r: 0, L: C }],
  [ // Kiwi
    { i: 2, x: 376, y: 170, w: 144, r: -150, m: 1 }, { i: 3, x: 960, y: 228, w: 152, r: 0 }, { i: 1, x: 303, y: 460, w: 168, r: 0 },
    { i: 2, x: 1187, y: 462, w: 148, r: -25 }, { i: 2, x: 946, y: 606, w: 150, r: 10, m: 1 },
    { i: 1, x: -10, y: 575, w: 260, r: 0, L: C }, { i: 3, x: 1285, y: 30, w: 200, r: 0, L: C }],
  [ // Banana
    { i: 1, x: 387, y: 147, w: 123, r: 0 }, { i: 2, x: 970, y: 223, w: 136, r: -10, m: 1 }, { i: 3, x: 298, y: 483, w: 132, r: 15 },
    { i: 2, x: 1245, y: 462, w: 150, r: 20 }, { i: 3, x: 950, y: 582, w: 130, r: -12 },
    { i: 3, x: 0, y: 585, w: 235, r: 0, L: C }, { i: 1, x: 1280, y: 30, w: 190, r: 0, L: C }],
  [ // Strawberry
    { i: 1, x: 372, y: 142, w: 128, r: 0 }, { i: 2, x: 955, y: 225, w: 117, r: 20 }, { i: 3, x: 290, y: 455, w: 140, r: -10 },
    { i: 3, x: 1250, y: 432, w: 135, r: 15 }, { i: 2, x: 962, y: 558, w: 146, r: -15 },
    { i: 1, x: -10, y: 555, w: 245, r: 0, L: C }, { i: 1, x: 1285, y: 35, w: 200, r: 20, L: C }]
];

function units(w, h) {
  const mobile = w <= 820 || h > w;
  if (mobile) return { u: Math.max(0.2, Math.min(w / 640, (h - 200) / 620)), fy: 8, mobile };
  return { u: Math.min(w / 1440, h / 900), fy: 0, mobile };
}

/* word ink measurement with canvas, as in the spec */
let _mctx;
function inkWidth100(main, sub) {
  _mctx ||= document.createElement('canvas').getContext('2d');
  _mctx.font = '700 100px Poppins, sans-serif';
  const m = _mctx.measureText(main);
  let w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  if (sub) { _mctx.font = '700 42px Poppins, sans-serif'; const s = _mctx.measureText(sub); w += s.actualBoundingBoxLeft + s.actualBoundingBoxRight + 3; }
  return w;
}
function sizeWord(el, spec, target, threshold) {
  const [main, sub] = (spec || el.textContent).split('|');
  const ink100 = inkWidth100(main, sub);
  let F = 445, ls = 0.005;
  if (ink100 * 4.45 > threshold) { ls = -0.035; F = Math.min(445, target / (ink100 / 100)); }
  const baseline = 403.5 + 0.698 * F / 2;
  el.style.setProperty('--F', F.toFixed(2));
  el.style.setProperty('--wt', (baseline - 0.85 * F).toFixed(2));
  el.style.letterSpacing = ls + 'em';
}

/* ───────────── Blendy slider ───────────── */
class Blendy {
  constructor(stage, o = {}) {
    this.stage = stage; this.o = o;
    this.slides = [...stage.querySelectorAll(':scope > .bl-slide')];
    this.cur = Math.max(0, this.slides.findIndex(s => s.classList.contains('is-current')));
    this.busy = false; this.last = -1e9; this.U = { u: 1, fy: 0, mobile: false };
    this.slides.forEach((s, i) => { s.classList.toggle('is-current', i === this.cur); this.prepare(s); });
    this.layout();
    if (o.autoplay && !/noauto/.test(location.search)) setInterval(() => this.tick(), 2600);
  }
  prepare(slide) {
    const sh = slide.querySelector('.L-shadow');
    if (sh && !sh.children.length) SHADOWS.forEach(([cx, cy, w, h]) => {
      H('div', { class: 'bl-shadow', style: `left:calc(${cx - w / 2}*var(--u));top:calc(${cy - h / 2}*var(--u));width:calc(${w}*var(--u));height:calc(${h}*var(--u))` }, null, sh);
    });
    const ids = (slide.dataset.pieces || '').split(',').filter(Boolean);
    const lay = LAYOUTS[(+slide.dataset.layout || 0) % 4];
    if (ids.length && !slide.querySelector('.bl-piece')) {
      lay.forEach((p, n) => {
        const host = slide.querySelector(p.L === C ? '.L-corner' : '.L-fruit'); if (!host) return;
        const id = ids[(p.i - 1) % ids.length];
        const el = H('div', { class: 'bl-piece' + (p.m ? ' is-mirror' : ''), style: `left:calc(${p.x}*var(--u));top:calc(${p.y}*var(--u));width:calc(${p.w}*var(--u));height:calc(${p.w}*var(--a,1)*var(--u))` }, null, host);
        const i = H('i', { style: `--rot:${p.r};--dur:${(3.2 + Math.random() * 1.8).toFixed(2)}s;--del:${(-Math.random() * 4).toFixed(2)}s` }, null, el);
        whenSprite(id, sp => { el.style.setProperty('--a', sp.aspect.toFixed(4)); i.style.backgroundImage = `url(${sp.url})`; requestAnimationFrame(() => i.classList.add('is-ready')); });
      });
    }
    slide._layers = LAYER_NAMES.map(n => [n, slide.querySelector('.L-' + n)]).filter(([, e]) => e);
  }
  layout() {
    const r = this.stage.getBoundingClientRect();
    const w = r.width || innerWidth, h = r.height || innerHeight;
    this.U = units(w, h);
    const host = this.o.unitHost || this.stage;
    host.style.setProperty('--u', this.U.u + 'px');
    host.style.setProperty('--fy', this.U.fy + 'px');
    const vis = this.U.mobile ? Math.min(1440, w / this.U.u) * 0.92 : 1400;
    const thr = this.U.mobile ? vis * 1330 / 1400 : 1330;
    this.slides.forEach(s => { const wEl = s.querySelector('.bl-word'); if (wEl) sizeWord(wEl, s.dataset.word, vis, thr); });
    this.o.onLayout?.(this.U);
  }
  frameW() { return 1440 * this.U.u; }
  touch() { this.last = performance.now(); }
  tick() {
    if (document.hidden || this.busy) return;
    if (performance.now() - this.last < 6000) return;
    if (this.o.isActive && !this.o.isActive()) return;
    this.go((this.cur + 1) % this.slides.length, 1);
  }
  next(user) { if (user) this.touch(); this.go((this.cur + 1) % this.slides.length, 1); }
  prev(user) { if (user) this.touch(); this.go((this.cur - 1 + this.slides.length) % this.slides.length, -1); }
  to(i, user) { if (user) this.touch(); if (i === this.cur) return; this.go(i, i > this.cur ? 1 : -1); }
  go(to, dir) {
    if (this.busy || to === this.cur) return;
    const from = this.cur, A = this.slides[from], B = this.slides[to];
    this.busy = true;
    this.o.onStart?.(from, to, dir, A, B);
    B.classList.add('is-next');
    const W = this.frameW();
    const finish = () => {
      B.classList.remove('is-next'); B.classList.add('is-current'); A.classList.remove('is-current');
      for (const s of [A, B]) { s.style.clipPath = ''; s._layers.forEach(([, e]) => e.style.transform = ''); }
      this.cur = to; this.busy = false;
      this.o.onEnd?.(from, to, dir, A, B);
    };
    if (REDUCED.matches) { finish(); return; }
    B._layers.forEach(([n, e]) => e.style.transform = `translate3d(${dir * FACTORS[n] * W}px,0,0)`);
    const t0 = performance.now();
    const step = now => {
      const t = (now - t0) / 970, c = cover(Math.min(t, 1));
      A.style.clipPath = dir > 0 ? `inset(0 ${(c * 100).toFixed(3)}% 0 0)` : `inset(0 0 0 ${(c * 100).toFixed(3)}%)`;
      const ax = -dir * c * 0.14 * W;
      A._layers.forEach(([, e]) => e.style.transform = `translate3d(${ax}px,0,0)`);
      const k = easeOutQuad(clamp((t - 0.5) / 0.42, 0, 1));
      B._layers.forEach(([n, e]) => e.style.transform = `translate3d(${dir * (1 - k) * FACTORS[n] * W}px,0,0)`);
      this.o.onProgress?.(t, c, k, dir);
      if (t < 1 || k < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
  }
  /* opening: current slide layers glide in from the right */
  intro(extra = []) {
    if (REDUCED.matches) return;
    const W = this.frameW(), ease = 'cubic-bezier(0.22, 0.8, 0.3, 1)';
    this.slides[this.cur]._layers.forEach(([n, e]) => e.animate([{ transform: `translate3d(${FACTORS[n] * W}px,0,0)` }, { transform: 'translate3d(0,0,0)' }], { duration: 900, easing: ease }));
    extra.forEach(([el, f]) => el && el.animate([{ transform: `translate3d(${f * W}px,0,0)` }, { transform: 'translate3d(0,0,0)' }], { duration: 900, easing: ease }));
  }
}

/* swipe + drag on a stage, as in the spec */
function attachSwipe(el, onSwipe) {
  let sx = 0, sy = 0, on = false;
  el.addEventListener('pointerdown', e => { if (e.modelGrab || e.button > 0) return; on = true; sx = e.clientX; sy = e.clientY; });
  addEventListener('pointerup', e => {
    if (!on) return; on = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) onSwipe(dx < 0 ? 1 : -1);
  });
  addEventListener('pointercancel', () => { on = false; });
}

/* UI rise used by both openings (uses the separate translate property) */
function riseIn(items) {
  const ease = 'cubic-bezier(0.22, 0.8, 0.3, 1)';
  items.forEach(([el, delay]) => {
    if (!el) return;
    el.classList.remove('pre');
    if (REDUCED.matches) return;
    el.animate([{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], { duration: 1000, delay, easing: ease, fill: 'backwards' });
  });
}

function placeLine(line, tab, host) {
  if (!line || !tab) return;
  const hr = host.getBoundingClientRect(), tr = tab.getBoundingClientRect();
  line.style.width = tr.width + 'px';
  line.style.transform = `translateX(${tr.left - hr.left}px)`;
}
