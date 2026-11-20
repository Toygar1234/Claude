/* ───────────── Line chart with crosshair ───────────── */
function lineChart(host, o) {
  const box = host._lc || (host._lc = H('div', { class: 'chart' }, null, host));
  const tip = host._tip || (host._tip = chartTip(host));
  const draw = Wd => {
    box.innerHTML = '';
    const Hh = o.h || 220, ml = 44, mr = 12, mt = 12, mb = 34, pw = Wd - ml - mr, ph = Hh - mt - mb;
    const [x0, x1] = o.x, [y0, y1] = o.y;
    const sx = v => ml + (v - x0) / (x1 - x0) * pw, sy = v => mt + ph - (v - y0) / (y1 - y0) * ph;
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': o.aria || '' }, box);
    o.yTicks.forEach(t => { S('line', { x1: ml, x2: ml + pw, y1: sy(t), y2: sy(t), class: 'ax' }, svg); S('text', { x: ml - 6, y: sy(t) + 4, 'text-anchor': 'end', class: 'lbl', style: 'font-size:11.5px;fill:var(--ink-3)' }, svg).textContent = o.yFmt ? o.yFmt(t) : nf(t); });
    o.xTicks.forEach(t => S('text', { x: sx(t), y: Hh - 14, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:11.5px;fill:var(--ink-3)' }, svg).textContent = o.xFmt ? o.xFmt(t) : nf(t));
    if (o.xLabel) S('text', { x: ml + pw / 2, y: Hh - 1, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:11.5px;fill:var(--ink-3)' }, svg).textContent = o.xLabel;
    o.series.forEach(s => {
      const pts = s.pts.filter(p => p[1] != null && !isNaN(p[1])); if (!pts.length) return;
      S('path', { d: 'M' + pts.map(p => sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1)).join('L'), fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      const last = pts[pts.length - 1]; S('circle', { cx: sx(last[0]), cy: sy(last[1]), r: 4, fill: s.color, stroke: 'var(--paper)', 'stroke-width': 2 }, svg);
    });
    const cross = S('line', { y1: mt, y2: mt + ph, stroke: 'var(--ink-3)', 'stroke-width': 1, opacity: 0 }, svg);
    const hit = S('rect', { x: ml, y: mt, width: pw, height: ph, fill: 'transparent' }, svg);
    const xs = [...new Set(o.series.flatMap(s => s.pts.map(p => p[0])))].sort((a, b) => a - b);
    const move = e => {
      const r = svg.getBoundingClientRect(); const vx = x0 + (e.clientX - r.left - ml) / pw * (x1 - x0);
      const X = xs.reduce((b, v) => Math.abs(v - vx) < Math.abs(b - vx) ? v : b, xs[0]);
      cross.setAttribute('x1', sx(X)); cross.setAttribute('x2', sx(X)); cross.setAttribute('opacity', 1);
      const rows = o.series.map(s => { const p = s.pts.find(q => q[0] === X); return p && p[1] != null && !isNaN(p[1]) ? `<div><span style="display:inline-block;width:12px;height:2.5px;background:${s.color};vertical-align:middle;margin-right:6px"></span><b>${o.yFmt ? o.yFmt(p[1]) : nf(p[1], 2)}</b> ${s.name}</div>` : ''; }).join('');
      tip.show(`<div style="opacity:.7">${o.xFmt ? o.xFmt(X) : X}</div>${rows}`, sx(X), mt + 10);
    };
    hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { cross.setAttribute('opacity', 0); tip.hide(); });
  };
  host._draw = draw;
  if (!host._ro) { host._ro = true; responsive(box, w => { host._w = w; draw(w); }); } else if (host._w) draw(host._w);
}

/* ───────────── 14 Deneyler: data tables + live charts ───────────── */
W.exp1 = el => {
  const T = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
  const EX = [10.00, 10.55, 10.96, 11.27, 11.50, 11.67, 11.79, 11.88, 11.95, 12.00, 12.04, 12.07, 12.09];
  let vals = store.get('exp1', null), example = !vals;
  if (!vals) vals = EX.slice();
  const bar = H('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px' }, null, el);
  const badge = H('span', { class: 'tag tag--red' }, 'Örnek veri: kendi ölçümünü yaz', bar);
  const bEx = H('button', { type: 'button', class: 'btn btn--sm btn--ghost' }, 'Örnek veri', bar);
  const bClr = H('button', { type: 'button', class: 'btn btn--sm btn--ghost' }, 'Temizle', bar);
  const chartHost = H('div', {}, null, el);
  const tw = H('div', { class: 'tbl-wrap', style: 'max-height:300px;overflow:auto;margin-top:12px' }, null, el);
  const t = H('table', {}, '<thead><tr><th>Zaman (dk)</th><th>Kütle (g)</th><th class="num">Artış (g)</th><th class="num">% artış</th></tr></thead>', tw);
  const tb = H('tbody', {}, null, t);
  const inputs = T.map((m, i) => {
    const tr = H('tr', {}, `<td>${m}</td>`, tb);
    const td = H('td', {}, null, tr);
    const inp = H('input', { type: 'number', step: '0.01', min: '0', inputmode: 'decimal', 'aria-label': `${m}. dakikadaki kütle (g)`, style: 'width:90px;height:32px;border:1px solid var(--line-2);border-radius:8px;padding:0 8px;font:inherit;background:var(--paper);color:var(--ink)' }, null, td);
    inp.value = vals[i] ?? '';
    H('td', { class: 'num' }, '', tr); H('td', { class: 'num' }, '', tr);
    inp.addEventListener('input', () => { example = false; vals[i] = inp.value === '' ? null : parseFloat(inp.value.replace(',', '.')); store.set('exp1', vals); upd(); });
    return [inp, tr];
  });
  const upd = () => {
    badge.hidden = !example;
    const m0 = vals[0];
    inputs.forEach(([inp, tr], i) => { const v = vals[i]; const ok = v != null && m0 != null && !isNaN(v); tr.children[2].textContent = ok ? nf(v - m0, 2) : '–'; tr.children[3].textContent = ok && m0 ? '%' + nf((v - m0) / m0 * 100, 1) : '–'; });
    const pts = T.map((m, i) => [m, vals[i] != null && m0 != null ? vals[i] - m0 : null]);
    const mx = Math.max(0.5, ...pts.map(p => p[1] || 0));
    const top = Math.ceil(mx * 2) / 2;
    lineChart(chartHost, { series: [{ name: 'kütle artışı (g)', color: 'var(--oxy)', pts }], x: [0, 120], y: [0, top], xTicks: [0, 30, 60, 90, 120], yTicks: [0, top / 2, top], xFmt: v => v + ' dk', yFmt: v => nf(v, 2) + ' g', h: 200, aria: 'Silika jel kütle artışı' });
  };
  bEx.addEventListener('click', () => { vals = EX.slice(); example = true; inputs.forEach(([inp], i) => inp.value = vals[i]); store.set('exp1', null); upd(); });
  bClr.addEventListener('click', () => { vals = T.map(() => null); example = false; inputs.forEach(([inp]) => inp.value = ''); store.set('exp1', vals); upd(); });
  upd();
};
W.exp2 = el => {
  const T = Array.from({ length: 16 }, (_, i) => i * 2);
  const SER = [['Çıplak', '#E0262F', 0.035], ['Havlu', '#E39B1B', 0.022], ['Köpük', '#2E9E77', 0.012], ['Aerojel', '#2B5FA8', 0.008]];
  const EX = SER.map(([, , k]) => T.map(t => Math.round((22 + 38 * Math.exp(-k * t)) * 10) / 10));
  let vals = store.get('exp2', null), example = !vals; if (!vals) vals = EX.map(r => r.slice());
  let Ta = store.get('exp2Ta', 22);
  const bar = H('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px' }, null, el);
  const badge = H('span', { class: 'tag tag--red' }, 'Örnek veri: kendi ölçümünü yaz', bar);
  const bEx = H('button', { type: 'button', class: 'btn btn--sm btn--ghost' }, 'Örnek veri', bar);
  const bClr = H('button', { type: 'button', class: 'btn btn--sm btn--ghost' }, 'Temizle', bar);
  const ta = H('label', { class: 'small', style: 'display:inline-flex;gap:6px;align-items:center' }, 'Oda (°C)', bar);
  const taIn = H('input', { type: 'number', step: '0.5', value: Ta, style: 'width:70px;height:32px;border:1px solid var(--line-2);border-radius:8px;padding:0 8px;font:inherit;background:var(--paper);color:var(--ink)' }, null, ta);
  const ul = H('ul', { class: 'legend' }, null, el); SER.forEach(([n, c]) => H('li', {}, `<i style="background:${c};height:3px;border-radius:2px"></i>${n}`, ul));
  const chartHost = H('div', {}, null, el);
  const fit = H('div', { class: 'small', style: 'margin-top:8px', 'aria-live': 'polite' }, null, el);
  const tw = H('div', { class: 'tbl-wrap', style: 'max-height:280px;overflow:auto;margin-top:12px' }, null, el);
  const t = H('table', {}, `<thead><tr><th>Zaman (dk)</th>${SER.map(s => `<th>${s[0]} (°C)</th>`).join('')}</tr></thead>`, tw);
  const tb = H('tbody', {}, null, t);
  const cells = T.map((m, i) => { const tr = H('tr', {}, `<td>${m}</td>`, tb); return SER.map((s, j) => { const td = H('td', {}, null, tr); const inp = H('input', { type: 'number', step: '0.1', inputmode: 'decimal', 'aria-label': `${m}. dakika, ${s[0]}`, style: 'width:72px;height:30px;border:1px solid var(--line-2);border-radius:8px;padding:0 6px;font:inherit;background:var(--paper);color:var(--ink)' }, null, td); inp.value = vals[j][i] ?? ''; inp.addEventListener('input', () => { example = false; vals[j][i] = inp.value === '' ? null : parseFloat(inp.value.replace(',', '.')); store.set('exp2', vals); upd(); }); return inp; }); });
  const upd = () => {
    badge.hidden = !example;
    lineChart(chartHost, { series: SER.map(([n, c], j) => ({ name: n, color: c, pts: T.map((m, i) => [m, vals[j][i]]) })), x: [0, 30], y: [20, 62], xTicks: [0, 10, 20, 30], yTicks: [20, 30, 40, 50, 60], xFmt: v => v + ' dk', yFmt: v => nf(v, 1) + ' °C', h: 230, aria: 'Dört kabın soğuma eğrileri' });
    const ks = SER.map(([n], j) => { let num = 0, den = 0; const T0 = vals[j][0]; T.forEach((m, i) => { const v = vals[j][i]; if (v == null || T0 == null || v - Ta <= 0 || T0 - Ta <= 0) return; const y = Math.log((v - Ta) / (T0 - Ta)); num += m * y; den += m * m; }); return den ? -num / den : NaN; });
    const order = SER.map((s, j) => [s[0], ks[j]]).filter(x => !isNaN(x[1])).sort((a, b) => a[1] - b[1]);
    fit.innerHTML = `<b>Newton soğuma yasası uyumu</b> T(t) = T<sub>oda</sub> + (T₀ − T<sub>oda</sub>)·e<sup>−kt</sup>: ` + SER.map(([n], j) => `${n} k ≈ ${isNaN(ks[j]) ? '–' : nf(ks[j], 3)} /dk`).join(', ') + (order.length ? `. En yavaş soğuyan: <b>${order[0][0]}</b>.` : '');
  };
  taIn.addEventListener('input', () => { Ta = parseFloat(taIn.value) || 22; store.set('exp2Ta', Ta); upd(); });
  bEx.addEventListener('click', () => { vals = EX.map(r => r.slice()); example = true; cells.forEach((row, i) => row.forEach((inp, j) => inp.value = vals[j][i])); store.set('exp2', null); upd(); });
  bClr.addEventListener('click', () => { vals = SER.map(() => T.map(() => null)); example = false; cells.forEach(row => row.forEach(inp => inp.value = '')); store.set('exp2', vals); upd(); });
  upd();
};

/* ───────────── Flip cards, quiz, timeline, counters ───────────── */
function initFlips(root = document) {
  $$('.flip', root).forEach(f => {
    if (f._flip) return; f._flip = true;
    const tg = e => { if (e.target.closest('button, a, input')) return; f.classList.toggle('is-flipped'); };
    f.addEventListener('click', tg);
    f.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === f) { e.preventDefault(); f.classList.toggle('is-flipped'); } });
  });
}
function initQuiz() {
  const host = $('#quizGrid'); if (!host) return;
  const qs = $$('#quizData li').map(li => ({ q: li.textContent, a: li.dataset.a }));
  let marks = store.get('quiz', {});
  const score = () => {
    const got = Object.values(marks).filter(v => v === 1).length, miss = Object.values(marks).filter(v => v === 0).length;
    $('#qScore').textContent = `${got} / ${qs.length} bildin`;
    $('#qGot').style.width = got / qs.length * 100 + '%'; $('#qMiss').style.width = miss / qs.length * 100 + '%';
  };
  qs.forEach((d, i) => {
    const c = H('div', { class: 'flip qcard', tabindex: 0, role: 'button', 'aria-label': `Soru ${i + 1}: ${d.q}. Cevabı görmek için çevir.` }, `<div class="flip__in"><div class="flip__f"><span class="qn">Soru ${i + 1}</span><span class="q">${d.q}</span><span class="flip-hint" style="margin:0">Çevir</span></div><div class="flip__b"><span class="qn">Cevap</span><span class="a">${d.a}</span><div class="self"><button type="button" data-v="1">Bildim</button><button type="button" data-v="0">Bilemedim</button></div></div></div>`, host);
    const paint = () => { c.classList.toggle('got', marks[i] === 1); c.classList.toggle('miss', marks[i] === 0); $$('.self button', c).forEach(b => b.setAttribute('aria-pressed', String(marks[i]) === b.dataset.v ? 'true' : 'false')); };
    $$('.self button', c).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); marks[i] = +b.dataset.v; store.set('quiz', marks); paint(); score(); setTimeout(() => c.classList.remove('is-flipped'), 500); }));
    paint();
  });
  $('#qReset').addEventListener('click', () => { marks = {}; store.set('quiz', marks); $$('.qcard', host).forEach(c => c.classList.remove('got', 'miss', 'is-flipped')); $$('.self button', host).forEach(b => b.setAttribute('aria-pressed', 'false')); score(); });
  score(); initFlips(host);
}
function initTimeline() {
  const tr = $('#tlTrack'); if (!tr) return;
  const by = d => { const it = $('.tl__item', tr); tr.scrollBy({ left: d * ((it?.offsetWidth || 260) + 18), behavior: REDUCED.matches ? 'auto' : 'smooth' }); };
  $('#tlPrev').addEventListener('click', () => by(-1)); $('#tlNext').addEventListener('click', () => by(1));
  tr.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); by(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); by(-1); } });
  let down = false, sx = 0, sl = 0;
  tr.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = tr.scrollLeft; tr.style.scrollSnapType = 'none'; });
  addEventListener('pointermove', e => { if (down) tr.scrollLeft = sl - (e.clientX - sx); });
  addEventListener('pointerup', () => { if (down) { down = false; tr.style.scrollSnapType = ''; } });
}
function initCounters() {
  const els = $$('[data-count]'); if (REDUCED.matches) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', t0 = performance.now();
    const run = now => { const k = clamp((now - t0) / 1200, 0, 1); el.textContent = pre + nf(Math.round(to * easeOutCubic(k))) + suf; if (k < 1) requestAnimationFrame(run); };
    requestAnimationFrame(run);
  }), { threshold: .6 });
  els.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) io.observe(el); });
}
function mountLazy(root) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); mountWidgets(e.target.parentElement || e.target); } }), { rootMargin: '600px 0px' });
  $$('[data-widget]', root).forEach(el => io.observe(el));
}
