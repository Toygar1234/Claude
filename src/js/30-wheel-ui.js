/* ───────────── STRIDE-style product arc: DOM side ───────────── */
const wheelEl = $('#kullanim');
let wheelVisible = false, wheelIdx = 0, wheelAuto = false, wheelLastAct = -1e9;
new IntersectionObserver(es => es.forEach(e => { wheelVisible = e.intersectionRatio > 0.4; H3.wheel?.setVisible(e.isIntersecting); }), { threshold: [0, 0.4, 0.7] }).observe(wheelEl);

function setWheelIndex(i) {
  if (i === wheelIdx && $('#wheelName').dataset.ready) return;
  wheelIdx = i; const p = PRODUCTS[i];
  const name = $('#wheelName');
  name.dataset.ready = '1';
  name.innerHTML = `${p.word.replace('|', '')}<small>${p.cat}: ${p.title}</small>`;
  $('#wheelNum').textContent = String(i + 1).padStart(2, '0');
  $('#wheelKey').textContent = p.key;
  $$('#wheelCats button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === p.cat ? 'true' : 'false'));
}
function wheelStep(d, user) {
  if (user) wheelLastAct = performance.now();
  if (H3.wheel) H3.wheel.step(d); else setWheelIndex((wheelIdx + d + PRODUCTS.length) % PRODUCTS.length);
}
function wheelGoto(i, user) {
  if (user) wheelLastAct = performance.now();
  if (H3.wheel) H3.wheel.goto(i); else setWheelIndex(i);
}
function openFromWheel() {
  const o = H3.wheel?.anchor?.() || { x: innerWidth / 2, y: innerHeight * 0.45 };
  openDetail(wheelIdx, o);
}
$('#wheelOpen').addEventListener('click', openFromWheel);
$('#wheelInfo').addEventListener('click', openFromWheel);
$('#wheelPlayBtn').addEventListener('click', openFromWheel);
$('#wheelAuto').addEventListener('click', e => { wheelAuto = !wheelAuto; e.currentTarget.setAttribute('aria-pressed', wheelAuto ? 'true' : 'false'); wheelLastAct = -1e9; });
$$('#wheelCats button').forEach(b => b.addEventListener('click', () => {
  const cat = b.dataset.cat;
  const i = cat === 'all' ? 0 : PRODUCTS.findIndex(p => p.cat === cat);
  if (i >= 0) wheelGoto(i, true);
}));
setInterval(() => {
  if (!wheelAuto || !wheelVisible || detailOpen() || document.hidden) return;
  if (performance.now() - wheelLastAct < 6000) return;
  wheelStep(1);
}, 3200);
setWheelIndex(0);

/* raked-sand background */
function drawSand() {
  const c = $('#sand'); const r = wheelEl.getBoundingClientRect();
  const W = Math.max(1, r.width), Hh = Math.max(1, r.height), dpr = Math.min(devicePixelRatio || 1, 1.5);
  c.width = Math.round(W * dpr); c.height = Math.round(Hh * dpr);
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = W / 2, cy = Hh * 0.47, R = Math.hypot(W, Hh) * 0.62;
  const bg = g.createRadialGradient(cx, cy, 0, cx, cy, R);
  bg.addColorStop(0, '#EED39A'); bg.addColorStop(.45, '#DDB878'); bg.addColorStop(1, '#B68B49');
  g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
  const step = clamp(W / 40, 16, 30);
  for (let rr = step * 1.4; rr < R * 1.25; rr += step) {
    const fade = 1 - smooth(R * 0.2, R * 1.2, rr) * 0.55;
    g.lineWidth = step * 0.34;
    g.strokeStyle = `rgba(118,78,28,${0.17 * fade})`;
    g.beginPath(); g.arc(cx + 1.2, cy + 2.2, rr, 0, Math.PI * 2); g.stroke();
    g.lineWidth = step * 0.22;
    g.strokeStyle = `rgba(255,242,210,${0.32 * fade})`;
    g.beginPath(); g.arc(cx - 0.8, cy - 1.6, rr - step * 0.2, 0, Math.PI * 2); g.stroke();
  }
  // fine grain
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = Math.min(26000, (W * Hh) / 60);
  for (let k = 0; k < n; k++) {
    const x = rnd() * W, y = rnd() * Hh, l = rnd();
    g.fillStyle = l > .5 ? `rgba(255,248,230,${.10 + l * .14})` : `rgba(90,60,20,${.06 + l * .12})`;
    g.fillRect(x, y, 1, 1);
  }
  const vg = g.createRadialGradient(cx, cy, R * 0.45, cx, cy, R * 1.05);
  vg.addColorStop(0, 'rgba(60,35,5,0)'); vg.addColorStop(1, 'rgba(60,35,5,.28)');
  g.fillStyle = vg; g.fillRect(0, 0, W, Hh);
}
drawSand();
addEventListener('resize', () => { clearTimeout(drawSand._t); drawSand._t = setTimeout(drawSand, 150); });

/* floating pieces around the arc (baked 3D sprites), with pointer parallax */
const FLOATS = [
  // id, x%, y%, width(px @1440), layer(0 back sharp, 1 front blurred), rot
  ['sandGrain', 8, 22, 70, 0, 10], ['quartzPoint', 18, 72, 92, 0, -22], ['mintLeaf', 31, 16, 78, 0, 30], ['gelBead', 64, 14, 54, 0, 0],
  ['ember', 80, 24, 70, 0, 0], ['hexTile', 88, 64, 96, 0, 18], ['glassMarble', 70, 78, 64, 0, 0], ['fiberOrb', 44, 82, 60, 0, 0],
  ['amethyst', -3, 52, 230, 1, -20], ['tileChip', 92, 6, 210, 1, 24], ['pasteSwirl', 86, 92, 240, 1, -12], ['aeroCube', 4, 96, 200, 1, 15]
];
const floatBack = $('#floatBack'), floatFront = $('#floatFront');
FLOATS.forEach(([id, x, y, w, front, rot]) => {
  const host = front ? floatFront : floatBack;
  const el = H('i', { style: `left:${x}%;top:${y}%;width:calc(${w}px * var(--fs,1));height:calc(${w}px * var(--fs,1) * var(--a,1));transform:translate(-50%,-50%) rotate(${rot}deg);${front ? 'filter:blur(10px);' : ''}` }, null, host);
  whenSprite(id, sp => { el.style.setProperty('--a', sp.aspect); el.style.backgroundImage = `url(${sp.url})`; requestAnimationFrame(() => el.classList.add('is-ready')); });
});
function floatScale() { const s = clamp(wheelEl.clientWidth / 1440, 0.55, 1.25); floatBack.style.setProperty('--fs', s); floatFront.style.setProperty('--fs', s); }
floatScale(); addEventListener('resize', floatScale);
wheelEl.addEventListener('pointermove', e => {
  if (REDUCED.matches || e.pointerType !== 'mouse') return;
  const r = wheelEl.getBoundingClientRect();
  const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
  floatBack.style.transform = `translate(${dx * -14}px,${dy * -10}px)`;
  floatFront.style.transform = `translate(${dx * 28}px,${dy * 20}px)`;
});

/* fallback when WebGL is unavailable: a plain list of buttons */
function wheelFallback() {
  const box = H('div', { style: 'position:absolute;z-index:3;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:min(900px,92vw)' }, null, wheelEl);
  PRODUCTS.forEach(p => {
    const b = H('button', { type: 'button', class: 'btn', style: `background:${p.bg};border-color:${p.bg};color:${p.dark ? '#fff' : '#111'}` }, p.word.replace('|', ''), box);
    b.addEventListener('click', () => { setWheelIndex(p.i); openDetail(p.i, { x: innerWidth / 2, y: innerHeight / 2 }); });
  });
}
