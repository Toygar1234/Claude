/* ───────────── Boot ───────────── */
let heroReadyResolve;
const heroReadyP = new Promise(r => { heroReadyResolve = r; });
function heroFallback() {
  const box = $('#heroBox'); if (!box || box.querySelector('svg')) return;
  const s = S('svg', { viewBox: '-120 -120 240 240', style: 'position:absolute;inset:14%;width:72%;height:72%', 'aria-hidden': 'true' }, box);
  const pts = [[0, -84], [-74, 34], [74, 34], [0, 10]];
  pts.forEach(p => S('line', { x1: 0, y1: 0, x2: p[0], y2: p[1], stroke: '#9AA6BC', 'stroke-width': 10, 'stroke-linecap': 'round' }, s));
  pts.forEach(p => S('circle', { cx: p[0], cy: p[1], r: 24, fill: '#d81f2a' }, s));
  S('circle', { cx: 0, cy: 0, r: 30, fill: '#2a3a63' }, s);
}
const webglOK = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();

mountLazy($('main'));
initFlips(); initQuiz(); initTimeline(); initCounters();
onScroll();
if (webglOK) boot3D().catch(err => { console.warn('3D yüklenemedi:', err); if (!H3.hero) heroFallback(); if (!H3.wheel) wheelFallback(); heroReadyResolve(); });
else { heroFallback(); wheelFallback(); heroReadyResolve(); }
Promise.race([heroReadyP, wait(2600)]).then(heroOpening);

if (/debug/.test(location.search)) window.__sio = { hero, detail, H3, PRODUCTS, openDetail, closeDetail, wheelGoto, mountAll: () => mountWidgets(document.querySelector("main")) };
