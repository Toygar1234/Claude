/* ───────────── Widget registry ───────────── */
const W = {};
function mountWidgets(root = document) {
  $$('[data-widget]', root).forEach(el => {
    if (el._mounted) return; el._mounted = true;
    const fn = W[el.dataset.widget];
    if (fn) { try { fn(el); } catch (err) { console.error('widget', el.dataset.widget, err); } }
  });
}
function responsive(el, render) {
  let w0 = -1, raf = 0;
  const run = () => { raf = 0; const w = Math.round(el.clientWidth); if (w && w !== w0) { w0 = w; render(w); } };
  new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(run); }).observe(el);
  run();
}
function chartTip(host) {
  host.style.position = 'relative';
  const t = H('div', { class: 'chart-tip', role: 'status' }, null, host);
  return {
    show(html, x, y) { t.innerHTML = html; t.style.left = x + 'px'; t.style.top = y + 'px'; t.classList.add('is-on'); },
    hide() { t.classList.remove('is-on'); }
  };
}
function tableView(host, head, rows) {
  const d = H('details', { class: 'tview' }, '<summary>Tablo görünümü</summary>', host);
  const tw = H('div', { class: 'tbl-wrap' }, null, d);
  const t = H('table', {}, null, tw);
  const tr = H('tr', {}, null, H('thead', {}, null, t));
  head.forEach((h, i) => H('th', i ? { class: 'num' } : {}, null, tr).textContent = h);
  const tb = H('tbody', {}, null, t);
  rows.forEach(r => { const row = H('tr', {}, null, tb); r.forEach((c, i) => H('td', i ? { class: 'num' } : {}, null, row).textContent = c); });
}
function sliderCtl(host, { label, min, max, step, value, fmt = v => v, acc, id }) {
  const sid = id || uid('rng');
  const wrap = H('div', { class: 'ctl' }, null, host);
  const lab = H('label', { for: sid }, `<span>${label}</span>`, wrap);
  const out = H('output', { for: sid }, '', lab);
  const inp = H('input', { type: 'range', id: sid, min, max, step, value }, null, wrap);
  if (acc) inp.style.setProperty('--acc', acc);
  const paint = () => { const p = (inp.value - min) / (max - min) * 100; inp.style.setProperty('--p', p + '%'); out.textContent = fmt(+inp.value); };
  inp.addEventListener('input', paint); paint();
  return { inp, out, get v() { return +inp.value; }, set(v) { inp.value = v; paint(); }, paint };
}
function roundedBar(x, y, w, h, r = 4, both = false) {
  w = Math.max(0, w); r = Math.min(r, w / 2, h / 2);
  if (both) return `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - 2 * r}a${r},${r} 0 0 1 -${r},-${r}v-${h - 2 * r}a${r},${r} 0 0 1 ${r},-${r}z`;
  return `M${x},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - r}z`;
}
const CSSV = n => getComputedStyle(document.body).getPropertyValue(n).trim();

/* Horizontal bar chart: linear or log, single series with optional emphasis, ranges allowed */
function hbar(host, o) {
  const tip = chartTip(host);
  const box = H('div', { class: 'chart' }, null, host);
  const fmt = o.fmt || (v => nf(v));
  responsive(box, Wd => {
    box.innerHTML = '';
    const rowH = 34, top = 6, bottom = o.axis === false ? 6 : 30;
    const labW = Math.min(o.labW || 150, Wd * 0.36), valW = o.valW || 70;
    const x0 = labW + 10, bw = Math.max(40, Wd - x0 - valW);
    const Hh = top + o.data.length * rowH + bottom;
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': o.aria || '' }, box);
    const lo = o.min ?? 0, hi = o.max;
    const sx = v => o.log ? (Math.log10(Math.max(v, lo)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) * bw : (v - lo) / (hi - lo) * bw;
    if (o.ticks) o.ticks.forEach(t => {
      const x = x0 + sx(t);
      S('line', { x1: x, x2: x, y1: top - 2, y2: top + o.data.length * rowH, class: 'ax' }, svg);
      if (o.axis !== false) { const tx = S('text', { x, y: Hh - 8, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg); tx.textContent = o.tickFmt ? o.tickFmt(t) : nf(t); }
    });
    const accent = o.accent || 'var(--oxy)', base = o.base || '#9AA6BC';
    o.data.forEach((d, i) => {
      const y = top + i * rowH, bh = 18, by = y + (rowH - bh) / 2;
      const lt = S('text', { x: labW, y: y + rowH / 2 + 4.5, 'text-anchor': 'end', class: 'lbl', style: `font-size:${Wd < 420 ? 12 : 13.5}px;fill:var(--ink-2)${d.hi ? ';font-weight:600;fill:var(--ink)' : ''}` }, svg);
      lt.textContent = d.label;
      const xa = d.v2 != null ? x0 + sx(d.v) : x0, xb = x0 + sx(d.v2 ?? d.v);
      const fill = d.color || (d.hi ? accent : (o.single ? accent : base));
      const p = S('path', { d: roundedBar(xa, by, Math.max(2, xb - xa), bh, 4, d.v2 != null), fill }, svg);
      if (!REDUCED.matches) p.animate([{ opacity: 0, transform: `translateX(${-8}px)` }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 60 * i, easing: 'ease-out', fill: 'backwards' });
      const vt = S('text', { x: xb + 7, y: y + rowH / 2 + 4.5, class: 'val' }, svg);
      vt.textContent = d.vl || (d.v2 != null ? `${fmt(d.v)}–${fmt(d.v2)}` : fmt(d.v)) + (o.unit ? ' ' + o.unit : '');
      const hit = S('rect', { x: 0, y, width: Wd, height: rowH, class: 'hit', tabindex: 0, 'aria-label': `${d.label}: ${vt.textContent}` }, svg);
      const show = () => { p.setAttribute('opacity', .82); tip.show(`<b>${vt.textContent}</b><br>${d.label}${d.note ? '<br><span style="opacity:.75">' + d.note + '</span>' : ''}`, Math.min(xb, Wd - 60), y + 4); };
      const hide = () => { p.removeAttribute('opacity'); tip.hide(); };
      hit.addEventListener('pointerenter', show); hit.addEventListener('pointerleave', hide);
      hit.addEventListener('focus', show); hit.addEventListener('blur', hide);
    });
  });
  if (o.legend) { const ul = H('ul', { class: 'legend', style: 'margin-top:10px' }, null, host); o.legend.forEach(([c, l]) => H('li', {}, `<i style="background:${c}"></i>${l}`, ul)); }
  if (o.table !== false) tableView(host, o.head || ['', 'Değer'], o.data.map(d => [d.label, d.v2 != null ? `${fmt(d.v)}–${fmt(d.v2)}` : fmt(d.v)]));
}

/* Tall segmented bar (one whole, <= 6 parts) */
function segbar(host, parts, o = {}) {
  const tip = chartTip(host);
  const bar = H('div', { class: 'segbar', role: 'img', 'aria-label': parts.map(p => `${p.label} ${o.fmt ? o.fmt(p.v) : p.v}`).join(', ') }, null, host);
  const total = parts.reduce((s, p) => s + p.v, 0);
  parts.forEach(p => {
    const d = H('div', { class: p.dk ? 'dk' : '', style: `flex:${p.v} 1 0;background:${p.color}`, tabindex: 0 }, null, bar);
    const txt = o.fmt ? o.fmt(p.v) : `%${nf(p.v / total * 100, o.d || 0)}`;
    d.dataset.t = txt;
    const show = () => { const r = d.getBoundingClientRect(), hr = host.getBoundingClientRect(); tip.show(`<b>${txt}</b><br>${p.label}`, r.left - hr.left + r.width / 2, r.top - hr.top); };
    d.addEventListener('pointerenter', show); d.addEventListener('focus', show);
    d.addEventListener('pointerleave', () => tip.hide()); d.addEventListener('blur', () => tip.hide());
  });
  const fit = () => $$('div', bar).forEach(d => { d.textContent = d.clientWidth > d.dataset.t.length * 8 + 14 ? d.dataset.t : ''; });
  new ResizeObserver(fit).observe(bar); fit();
  const ul = H('ul', { class: 'legend', style: 'margin-top:12px' }, null, host);
  parts.forEach(p => H('li', {}, `<i style="background:${p.color}"></i>${p.label}`, ul));
  tableView(host, ['Parça', 'Değer'], parts.map(p => [p.label, o.fmt ? o.fmt(p.v) : '%' + nf(p.v / total * 100, o.d || 0)]));
}

/* ───────────── 01 Kimlik ───────────── */
W.crust = el => segbar(el, [
  { label: 'Oksijen (O)', v: 46, color: '#E0262F' }, { label: 'Silisyum (Si)', v: 28, color: '#2B3A5E' },
  { label: 'Alüminyum (Al)', v: 8, color: '#6F8FC4' }, { label: 'Demir (Fe)', v: 5, color: '#D08C12' }, { label: 'Diğer', v: 13, color: '#AEB8C8', dk: 1 }
], { fmt: v => '%' + nf(v) });
W.masspct = el => segbar(el, [{ label: 'Silisyum', v: 46.7, color: '#2B3A5E' }, { label: 'Oksijen', v: 53.3, color: '#E0262F' }], { fmt: v => '%' + nf(v, 1) });

/* ───────────── 02 Yapı ───────────── */
W.orbitals = el => {
  const seg = H('div', { class: 'seg', role: 'group', 'aria-label': 'Element seç' }, '<button type="button" aria-pressed="true" data-e="Si">Si (Z = 14)</button><button type="button" aria-pressed="false" data-e="O">O (Z = 8)</button>', el);
  const conf = H('p', { class: 'econf', style: 'margin:14px 0 4px' }, '', el);
  const orb = H('div', { class: 'orb' }, '', el);
  const note = H('p', { class: 'small muted', style: 'margin-top:10px' }, '', el);
  const CFG = { Si: [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 2]], O: [['1s', 2], ['2s', 2], ['2p', 4]] };
  const NOTE = { Si: '4 değerlik elektronu (3s² 3p²): dört bağ kurar.', O: '6 değerlik elektronu (2s² 2p⁴): iki bağ yaparak oktete ulaşır.' };
  const draw = e => {
    conf.innerHTML = CFG[e].map(([s, n]) => `${s}<sup>${n}</sup>`).join(' ');
    orb.innerHTML = ''; const arrows = [];
    const lastN = CFG[e][CFG[e].length - 1][0][0];
    CFG[e].forEach(([s, n]) => {
      const g = H('div', { class: 'orb__g' }, null, orb);
      const bx = H('div', { class: 'orb__boxes' }, null, g);
      const k = s[1] === 's' ? 1 : 3; const boxes = [];
      for (let i = 0; i < k; i++) boxes.push(H('div', { class: 'orb__b', style: s[0] === lastN ? 'border-color:var(--oxy)' : '' }, null, bx));
      const fill = [];
      for (let i = 0; i < n; i++) { const b = boxes[i % k]; fill.push(H('i', { class: i < k ? 'up' : 'dn' }, null, b)); }
      // keep up before down inside each box
      boxes.forEach(b => { const d = b.querySelector('.dn'); const u = b.querySelector('.up'); if (d && u) b.insertBefore(u, d); });
      arrows.push(...fill);
      H('span', { class: 'orb__n' }, s, g);
    });
    note.textContent = NOTE[e];
    arrows.forEach((a, i) => REDUCED.matches ? a.classList.add('on') : setTimeout(() => a.classList.add('on'), 60 + i * 55));
  };
  $$('button', seg).forEach(b => b.addEventListener('click', () => { $$('button', seg).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); draw(b.dataset.e); }));
  draw('Si');
};
W.en = el => {
  const box = H('div', { class: 'chart' }, null, el);
  responsive(box, Wd => {
    box.innerHTML = '';
    const Hh = 104, m = 18, sx = v => m + v / 4 * (Wd - 2 * m);
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': 'Elektronegatiflik: Si 1,90, O 3,44, fark yaklaşık 1,54' }, box);
    S('line', { x1: m, x2: Wd - m, y1: 70, y2: 70, stroke: 'var(--line-2)', 'stroke-width': 2 }, svg);
    [0, 1, 2, 3, 4].forEach(t => { S('line', { x1: sx(t), x2: sx(t), y1: 64, y2: 76, stroke: 'var(--line-2)' }, svg); S('text', { x: sx(t), y: 94, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg).textContent = nf(t); });
    const br = S('path', { d: `M${sx(1.9)},44 v-8 H${sx(3.44)} v8`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }, svg);
    S('text', { x: (sx(1.9) + sx(3.44)) / 2, y: 28, 'text-anchor': 'middle', class: 'val', style: 'font-size:14px' }, svg).textContent = 'Δ ≈ 1,54';
    [[1.9, '#2B3A5E', 'Si 1,90'], [3.44, '#E0262F', 'O 3,44']].forEach(([v, c, l]) => {
      const g = S('g', {}, svg);
      S('circle', { cx: sx(v), cy: 70, r: 9, fill: c, stroke: 'var(--paper)', 'stroke-width': 2 }, g);
      S('text', { x: sx(v), y: 58, 'text-anchor': 'middle', class: 'val' }, g).textContent = l;
      if (!REDUCED.matches) g.animate([{ transform: `translateX(${-sx(v) + m}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  });
};
W.enNote = 0;
W.bond = el => hbar(el, { data: [{ label: 'Si–O', v: 452, hi: 1 }, { label: 'C–C', v: 346 }], min: 0, max: 500, ticks: [0, 100, 200, 300, 400, 500], unit: 'kJ/mol', labW: 60, valW: 92, head: ['Bağ', 'kJ/mol'], aria: 'Bağ enerjisi: Si–O 452, C–C 346 kJ/mol' });
W.bridge = el => {
  const box = H('div', { class: 'chart' }, null, el);
  const ctl = H('div', { style: 'display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:10px' }, null, el);
  const btn = H('button', { type: 'button', class: 'btn btn--sm' }, 'Adım adım say', ctl);
  const eq = H('p', { class: 'econf', style: 'margin:0', 'aria-live': 'polite' }, '1 Si + 4 × ½ O = SiO<sub>2</sub>', ctl);
  const svg = S('svg', { viewBox: '0 0 640 300', role: 'img', style: 'overflow:hidden', 'aria-label': 'Ortadaki silisyum dört oksijene bağlı; her oksijen komşu bir silisyumla paylaşılıyor' }, box);
  const labP = H('p', { class: 'small muted', style: 'margin:6px 0 0;text-align:center', 'aria-live': 'polite' }, '', el);
  const Si0 = [320, 150], O = [[248, 92], [392, 92], [248, 208], [392, 208]], Sn = [[170, 44], [470, 44], [170, 256], [470, 256]];
  const stubs = [[[110, 70], [150, -2]], [[530, 70], [490, -2]], [[110, 230], [150, 302]], [[530, 230], [490, 302]]];
  const bonds = S('g', { stroke: '#AEB8C8', 'stroke-width': 7, 'stroke-linecap': 'round' }, svg);
  O.forEach((o, i) => { S('line', { x1: Si0[0], y1: Si0[1], x2: o[0], y2: o[1], class: 'b0' }, bonds); S('line', { x1: Sn[i][0], y1: Sn[i][1], x2: o[0], y2: o[1] }, bonds); stubs[i].forEach(s => S('line', { x1: Sn[i][0], y1: Sn[i][1], x2: s[0], y2: s[1], opacity: .5 }, bonds)); });
  const grad = S('defs', {}, svg);
  grad.innerHTML = '<radialGradient id="gO" cx="35%" cy="30%"><stop offset="0" stop-color="#ff8f94"/><stop offset=".55" stop-color="#d81f2a"/><stop offset="1" stop-color="#8e0d14"/></radialGradient><radialGradient id="gSi" cx="35%" cy="30%"><stop offset="0" stop-color="#9aabde"/><stop offset=".55" stop-color="#2a3a63"/><stop offset="1" stop-color="#121a30"/></radialGradient>';
  const halves = [];
  Sn.forEach(s => S('circle', { cx: s[0], cy: s[1], r: 21, fill: 'url(#gSi)', opacity: .55 }, svg));
  O.forEach((o, i) => {
    S('circle', { cx: o[0], cy: o[1], r: 17, fill: 'url(#gO)' }, svg);
    const ux = o[0] - Si0[0], uy = o[1] - Si0[1], L = Math.hypot(ux, uy), nx = -uy / L * 17, ny = ux / L * 17;
    const h = S('path', { d: `M${o[0] + nx},${o[1] + ny} A17 17 0 0 0 ${o[0] - nx},${o[1] - ny} Z`, fill: 'var(--paper)', opacity: 0 }, svg);
    halves.push(h);
  });
  const si = S('circle', { cx: Si0[0], cy: Si0[1], r: 25, fill: 'url(#gSi)' }, svg);
  const ring = S('circle', { cx: Si0[0], cy: Si0[1], r: 36, fill: 'none', stroke: 'var(--oxy)', 'stroke-width': 3, opacity: 0 }, svg);
  const lab = { set textContent(v) { labP.textContent = v; } }; lab.textContent = 'Kırmızı: oksijen, lacivert: silisyum';
  const STEPS = [
    ['Kırmızı: oksijen, lacivert: silisyum', '1 Si + 4 × ½ O = SiO<sub>2</sub>', () => { ring.setAttribute('opacity', 0); halves.forEach(h => h.setAttribute('opacity', 0)); }],
    ['Ortadaki silisyum 4 oksijene bağlı', '1 Si + 4 O ?', () => { ring.setAttribute('opacity', 1); halves.forEach(h => h.setAttribute('opacity', 0)); }],
    ['Her oksijenin yarısı komşu silisyuma ait', '1 Si + 4 × ½ O', () => { halves.forEach(h => h.setAttribute('opacity', .78)); }],
    ['Sonuç: 1 silisyuma 2 oksijen düşer', '1 Si + 2 O = SiO<sub>2</sub>', () => { }]
  ];
  let st = 0;
  const set = n => { st = n; lab.textContent = STEPS[n][0]; eq.innerHTML = STEPS[n][1]; STEPS[n][2](); btn.textContent = n === 3 ? 'Baştan' : 'Sonraki adım'; };
  btn.addEventListener('click', () => set((st + 1) % 4));
};

/* ───────────── 03 Polimorflar: interactive phase map ───────────── */
const PHASES = {
  alfa: { n: 'α-kuvars', c: '#EBD7AA', d: '2,65', k: '4, sarmal zincirler', w: 'Kum, granit' },
  beta: { n: 'β-kuvars', c: '#F2C784', d: '~2,53', k: '4', w: 'Volkanik kayaç' },
  tridimit: { n: 'Tridimit', c: '#F4A974', d: '~2,26', k: '4', w: 'Volkanik kayaç' },
  kristobalit: { n: 'Kristobalit', c: '#EE8E73', d: '~2,33', k: '4', w: 'Isıtılmış silika' },
  koezit: { n: 'Koezit', c: '#A9C3E6', d: '~2,9–3,0', k: '4 (yoğun)', w: 'Meteor kraterleri' },
  stisovit: { n: 'Stişovit', c: '#8AA0D6', d: '~4,3', k: '6', w: 'Meteor kraterleri' },
  sivi: { n: 'Sıvı (eriyik)', c: '#E46F69', d: '–', k: 'Düzensiz', w: 'Lav, cam fırını' }
};
function phaseAt(T, P) {
  if (T >= 1713 + 130 * P) return 'sivi';
  if (P >= 7.5 + 0.0016 * T) return 'stisovit';
  if (P >= 2.0 + 0.0008 * T) return 'koezit';
  if (P < 0.25) { if (T >= 1470) return 'kristobalit'; if (T >= 870) return 'tridimit'; }
  return T >= 573 + 260 * P ? 'beta' : 'alfa';
}
W.phase = el => {
  el.classList.add('grid', 'g-7-5');
  const left = H('div', { class: 'panel panel--paper', style: 'padding:clamp(14px,2vw,22px)' }, null, el);
  const right = H('div', { class: 'panel panel--paper' }, null, el);
  const wrap = H('div', { style: 'position:relative;touch-action:none;cursor:crosshair' }, null, left);
  const cv = H('canvas', { 'aria-hidden': 'true', style: 'display:block;width:100%;border-radius:12px' }, null, wrap);
  const marker = H('div', { style: 'position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:3px solid #fff;background:var(--ink);box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none' }, null, wrap);
  H('p', { class: 'note', style: 'margin-top:8px' }, 'Şematik çizim, ölçekli değil. Basınç ekseni karekök ölçekli; sınırlar yaklaşık.', left);
  const Tc = sliderCtl(right, { label: 'Sıcaklık', min: 0, max: 2000, step: 10, value: 25, fmt: v => nf(v) + ' °C' });
  const Pc = sliderCtl(right, { label: 'Basınç', min: 0, max: 12, step: 0.05, value: 0, fmt: v => nf(v, v < 1 ? 2 : 1) + ' GPa', acc: 'var(--si)' });
  const card = H('div', { style: 'margin-top:14px', 'aria-live': 'polite' }, null, right);
  const presets = H('div', { class: 'seg', style: 'margin-top:14px' }, null, right);
  [['Plaj', 25, 0], ['573 °C', 600, 0], ['Volkan', 1200, 0.05], ['Meteor', 500, 9.5]].forEach(([l, t, p]) => { const b = H('button', { type: 'button', 'aria-pressed': 'false' }, l, presets); b.addEventListener('click', () => { Tc.set(t); Pc.set(p); upd(); }); });
  let dims = { w: 0, h: 0, m: 0 };
  const py = P => Math.sqrt(P / 12);
  const draw = Wd => {
    const Hh = Math.round(Math.max(260, Wd * 0.62)), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Wd * dpr; cv.height = Hh * dpr; cv.style.height = Hh + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ml = 46, mb = 34, mt = 8, mr = 8, pw = Wd - ml - mr, ph = Hh - mt - mb;
    dims = { w: Wd, h: Hh, ml, mb, mt, pw, ph };
    const step = 3;
    for (let x = 0; x < pw; x += step) for (let y = 0; y < ph; y += step) {
      const T = x / pw * 2000, pn = 1 - y / ph, P = pn * pn * 12;
      g.fillStyle = PHASES[phaseAt(T, P)].c; g.fillRect(ml + x, mt + y, step, step);
    }
    g.strokeStyle = 'rgba(11,20,38,.12)'; g.lineWidth = 1;
    g.fillStyle = '#38435C'; g.font = '12px "IBM Plex Sans", sans-serif'; g.textAlign = 'center';
    [0, 500, 1000, 1500, 2000].forEach((t, i, a) => { const x = ml + t / 2000 * pw; g.beginPath(); g.moveTo(x, mt); g.lineTo(x, mt + ph); g.stroke(); g.textAlign = i === a.length - 1 ? 'right' : 'center'; g.fillText(String(t), i === a.length - 1 ? x - 2 : x, Hh - 14); }); g.textAlign = 'center';
    g.textAlign = 'right';
    [0, 1, 3, 6, 10].forEach(p => { const y = mt + (1 - py(p)) * ph; g.beginPath(); g.moveTo(ml, y); g.lineTo(ml + pw, y); g.stroke(); g.fillText(nf(p), ml - 8, y + 4); });
    g.textAlign = 'center'; g.fillText('Sıcaklık (°C)', ml + pw / 2, Hh - 1);
    g.save(); g.translate(12, mt + ph / 2); g.rotate(-Math.PI / 2); g.fillText('Basınç (GPa)', 0, 0); g.restore();
    const lab = (t, T, P) => { g.font = '600 13px Poppins, sans-serif'; g.fillStyle = '#0B1426'; g.fillText(t, ml + T / 2000 * pw, mt + (1 - py(P)) * ph); };
    lab('α-kuvars', 260, 0.9); lab('β-kuvars', 1180, 0.9); lab('Koezit', 900, 4.2); lab('Stişovit', 900, 10.6); lab('Sıvı', 1880, 0.5);
    g.font = '600 11px Poppins, sans-serif'; g.fillText('tridimit', ml + 1170 / 2000 * pw, mt + ph - 8); g.fillText('kristobalit', ml + 1592 / 2000 * pw, mt + ph - 8);
  };
  const place = () => { const T = Tc.v, P = Pc.v; marker.style.left = (dims.ml + T / 2000 * dims.pw) + 'px'; marker.style.top = (dims.mt + (1 - py(P)) * dims.ph) + 'px'; };
  const upd = () => {
    const ph = phaseAt(Tc.v, Pc.v), d = PHASES[ph]; place();
    card.innerHTML = `<span class="tag" style="background:${d.c};color:#0B1426">Bu koşulda</span><div class="big" style="font-size:clamp(34px,4vw,52px);margin:12px 0 10px">${d.n}</div><dl class="props" style="grid-template-columns:1fr"><div><dt>Koordinasyon</dt><dd>${d.k}</dd></div><div><dt>Yoğunluk</dt><dd>${d.d} g/cm³</dd></div><div><dt>Nerede bulunur?</dt><dd>${d.w}</dd></div></dl>`;
    $$('#polyTable tbody tr').forEach(r => r.classList.toggle('is-on', r.dataset.ph === ph));
  };
  responsive(wrap, w => { draw(w); place(); });
  [Tc, Pc].forEach(c => c.inp.addEventListener('input', upd));
  const pick = e => { const r = cv.getBoundingClientRect(); const x = clamp(e.clientX - r.left - dims.ml, 0, dims.pw), y = clamp(e.clientY - r.top - dims.mt, 0, dims.ph); Tc.set(Math.round(x / dims.pw * 200) * 10); const pn = 1 - y / dims.ph; Pc.set(Math.round(pn * pn * 12 * 20) / 20); upd(); };
  let drag = false;
  cv.addEventListener('pointerdown', e => { drag = true; cv.setPointerCapture(e.pointerId); pick(e); });
  cv.addEventListener('pointermove', e => { if (drag) pick(e); });
  cv.addEventListener('pointerup', () => drag = false);
  upd();
};

/* ───────────── 04 Üretim ───────────── */
(() => {
  const items = $$('#flow li'), d = $('#flowDetail');
  items.forEach((li, i) => {
    li.tabIndex = 0;
    const act = () => { items.forEach(x => x.classList.toggle('is-on', x === li)); d.innerHTML = `<p><b>${i + 1}. ${$('b', li).textContent}:</b> ${li.dataset.d}</p>`; };
    li.addEventListener('click', act); li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    if (i === 0) li.classList.add('is-on');
  });
})();

/* ───────────── 05 Günlük hayat ───────────── */
const OXIDES = [['SiO₂', '#2B5FA8'], ['Na₂O', '#E39B1B'], ['CaO', '#2E9E77'], ['B₂O₃', '#8A5CC9'], ['Diğer', '#AEB8C8']];
W.glassbars = el => {
  const rows = [['Soda-kireç camı', [72, 14.5, 10, 0, 3.5]], ['Borosilikat cam', [80, 0, 0, 13, 7]], ['Kuvars camı', [99.9, 0, 0, 0, 0.1]]];
  const ul = H('ul', { class: 'legend' }, null, el);
  OXIDES.forEach(([n, c]) => H('li', {}, `<i style="background:${c}"></i>${n}`, ul));
  const tip = chartTip(el);
  const box = H('div', { class: 'chart' }, null, el);
  responsive(box, Wd => {
    box.innerHTML = '';
    const rowH = 64, top = 4, bw = Wd, Hh = top + rows.length * rowH + 26;
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': 'Cam türlerinin yaklaşık oksit bileşimi' }, box);
    [0, 25, 50, 75, 100].forEach(t => { const x = t / 100 * bw; S('line', { x1: x, x2: x, y1: 0, y2: Hh - 22, class: 'ax' }, svg); S('text', { x: clamp(x, 10, Wd - 16), y: Hh - 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg).textContent = '%' + t; });
    rows.forEach(([name, vals], r) => {
      const y = top + r * rowH;
      S('text', { x: 0, y: y + 16, class: 'lbl', style: 'font-size:14px;font-weight:600;fill:var(--ink)' }, svg).textContent = name;
      let x = 0; const by = y + 24, bh = 24;
      vals.forEach((v, k) => {
        if (v <= 0) return;
        const w = v / 100 * bw - 2;
        const p = S('rect', { x, y: by, width: Math.max(1, w), height: bh, rx: 4, fill: OXIDES[k][1], tabindex: 0 }, svg);
        if (w > 44) { const t = S('text', { x: x + 8, y: by + 16.5, style: `font:600 12.5px Poppins,sans-serif;fill:${k === 4 ? '#0B1426' : '#fff'}` }, svg); t.textContent = '%' + nf(v, v % 1 ? 1 : 0); }
        const show = () => { p.setAttribute('opacity', .85); tip.show(`<b>%${nf(v, v % 1 ? 1 : 0)}</b><br>${name}: ${OXIDES[k][0]}`, x + w / 2, by); };
        const hide = () => { p.removeAttribute('opacity'); tip.hide(); };
        p.addEventListener('pointerenter', show); p.addEventListener('pointerleave', hide); p.addEventListener('focus', show); p.addEventListener('blur', hide);
        x += w + 2;
      });
    });
  });
  tableView(el, ['Cam', ...OXIDES.map(o => o[0])], rows.map(([n, v]) => [n, ...v.map(x => x ? '%' + nf(x, x % 1 ? 1 : 0) : '–')]));
};
W.rda = el => {
  const box = H('div', { class: 'chart' }, null, el);
  responsive(box, Wd => {
    box.innerHTML = '';
    const Hh = 96, m = 6, sx = v => m + v / 300 * (Wd - 2 * m);
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': 'RDA ölçeği: 250 üst sınır' }, box);
    S('path', { d: roundedBar(sx(0), 30, sx(250) - sx(0) - 1, 20, 4, true), fill: '#BFE6D2' }, svg);
    S('path', { d: roundedBar(sx(250) + 1, 30, sx(300) - sx(250) - 1, 20, 4, true), fill: '#F7C9CB' }, svg);
    S('line', { x1: sx(250), x2: sx(250), y1: 18, y2: 60, stroke: 'var(--oxy)', 'stroke-width': 2.5 }, svg);
    S('text', { x: sx(250), y: 12, 'text-anchor': 'middle', class: 'val' }, svg).textContent = 'Üst sınır 250';
    [0, 100, 200, 300].forEach(t => S('text', { x: sx(t), y: 78, 'text-anchor': t ? (t === 300 ? 'end' : 'middle') : 'start', class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg).textContent = nf(t));
    S('text', { x: sx(125), y: 45, 'text-anchor': 'middle', style: 'font:600 12.5px Poppins,sans-serif;fill:#0E3B26' }, svg).textContent = 'İzin verilen aralık';
  });
  H('p', { class: 'small', style: 'margin-top:8px' }, 'Daha iri ve sert taneler daha çok aşındırır. Üretici tane boyutunu ayarlayarak macunu sınırın altında tutar.', el);
};
W.gelcurve = el => {
  const box = H('div', { class: 'chart' }, null, el);
  responsive(box, Wd => {
    box.innerHTML = '';
    const Hh = 190, ml = 30, mb = 30, pw = Wd - ml - 10, ph = Hh - mb - 14;
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': 'Hipotez H1 şematik eğrisi: ilk 30 dakikada hızlı artış, sonra yavaşlama' }, box);
    [0, 30, 60, 90, 120].forEach(t => { const x = ml + t / 120 * pw; S('line', { x1: x, x2: x, y1: 10, y2: 10 + ph, class: 'ax' }, svg); S('text', { x, y: Hh - 10, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg).textContent = t + ' dk'; });
    let d = ''; for (let t = 0; t <= 120; t += 2) { const v = 1 - Math.exp(-t / 32); d += (t ? 'L' : 'M') + (ml + t / 120 * pw) + ',' + (10 + ph - v * ph * .92); }
    const path = S('path', { d, fill: 'none', stroke: 'var(--oxy)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, svg);
    S('rect', { x: ml, y: 10, width: 30 / 120 * pw, height: ph, fill: 'var(--oxy)', opacity: .07 }, svg);
    S('text', { x: ml + 6, y: 26, class: 'val', style: 'font-size:12.5px' }, svg).textContent = 'hızlı';
    S('text', { x: ml + pw - 4, y: 10 + ph * .25, 'text-anchor': 'end', class: 'lbl', style: 'font-size:12.5px;fill:var(--ink-2)' }, svg).textContent = 'sonra yavaşlar';
    S('text', { x: 4, y: 20, class: 'lbl', style: 'font-size:11.5px;fill:var(--ink-3)' }, svg).textContent = 'kütle artışı';
    if (!REDUCED.matches) { const L = path.getTotalLength?.() || 600; path.style.strokeDasharray = L; path.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1400, easing: 'ease-out' }); }
  });
  H('p', { class: 'note' }, 'Şematik: hipotezin beklenen biçimi, ölçüm değil.', el);
};
W.mos = el => {
  const svg = S('svg', { viewBox: '0 0 520 280', role: 'img', 'aria-label': 'MOSFET kesiti: kapı ile kanal arasında ince SiO₂ yalıtkan katman' }, H('div', { class: 'chart' }, null, el));
  const r = (x, y, w, h, f, rx = 4) => S('rect', { x, y, width: w, height: h, fill: f, rx }, svg);
  r(20, 140, 480, 120, '#C9D1DE', 10);
  r(40, 140, 120, 46, '#7FA6E0', 6); r(360, 140, 120, 46, '#7FA6E0', 6);
  const ox = r(150, 120, 220, 18, '#E0262F', 3);
  r(160, 70, 200, 50, '#5B6B8C', 6);
  r(70, 112, 60, 28, '#B7BFCC', 4); r(390, 112, 60, 28, '#B7BFCC', 4); r(230, 44, 60, 26, '#B7BFCC', 4);
  const T = (x, y, t, a = 'middle', c = 'var(--ink)') => { const e = S('text', { x, y, 'text-anchor': a, style: `font:600 13px Poppins,sans-serif;fill:${c}` }, svg); e.textContent = t; return e; };
  T(100, 166, 'kaynak (n)', 'middle', '#0B1426'); T(420, 166, 'savak (n)', 'middle', '#0B1426'); T(260, 100, 'kapı', 'middle', '#fff'); T(260, 238, 'p-tipi silisyum', 'middle', '#38435C');
  T(384, 133, 'SiO₂ geçit oksidi', 'start', 'var(--oxy)');
  const ch = S('g', { opacity: 0 }, svg);
  const dots = []; for (let i = 0; i < 9; i++) dots.push(S('circle', { cx: 160 + i * 25, cy: 148, r: 4.5, fill: '#2B5FA8' }, ch));
  const btn = H('button', { type: 'button', class: 'btn btn--sm', style: 'margin-top:10px' }, 'Kapıya gerilim ver', el);
  const txt = H('p', { class: 'small', style: 'margin-top:10px' }, 'SiO₂ çok iyi bir yalıtkandır (bant aralığı ~9 eV). Kapıdan akım geçmez; sadece elektrik alanı oksidin altındaki kanalı açar.', el);
  let on = false, raf = 0, t0 = 0;
  const run = t => { if (!on) return; const k = ((t - t0) / 1000) % 1; dots.forEach((d, i) => d.setAttribute('cx', 150 + ((i / 9 + k) % 1) * 220)); raf = requestAnimationFrame(run); };
  btn.addEventListener('click', () => { on = !on; ch.setAttribute('opacity', on ? 1 : 0); btn.textContent = on ? 'Gerilimi kes' : 'Kapıya gerilim ver'; if (on && !REDUCED.matches) { t0 = performance.now(); raf = requestAnimationFrame(run); } else cancelAnimationFrame(raf); });
};
W.tir = el => {
  const n1 = 1.468, n2 = 1.462, thc = Math.asin(n2 / n1) * 180 / Math.PI;
  const box = H('div', { class: 'chart' }, null, el);
  const A = sliderCtl(el, { label: 'Geliş açısı (normale göre)', min: 70, max: 89.5, step: 0.1, value: 87, fmt: v => nf(v, 1) + '°', acc: '#2EC4B6' });
  const out = H('p', { class: 'small', 'aria-live': 'polite', style: 'margin-top:6px' }, '', el);
  H('p', { class: 'note' }, `Kritik açı θc = arcsin(n₂/n₁) = arcsin(1,462 / 1,468) ≈ ${nf(thc, 1)}°. Çizimde açılar görünür olsun diye abartıldı.`, el);
  let Wd = 520;
  const draw = () => {
    box.innerHTML = '';
    const Hh = Math.round(Math.max(150, Wd * .34)), core0 = Hh * .3, core1 = Hh * .7;
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': 'Optik fiberde ışık yolu' }, box);
    S('rect', { x: 0, y: 0, width: Wd, height: Hh, fill: '#DCEFF2', rx: 12 }, svg);
    S('rect', { x: 0, y: core0, width: Wd, height: core1 - core0, fill: '#9ED9D3' }, svg);
    S('text', { x: 10, y: 18, class: 'lbl', style: 'font-size:12px;fill:#2F5B5E' }, svg).textContent = 'kılıf n₂ = 1,462';
    S('text', { x: 10, y: core0 + 18, class: 'lbl', style: 'font-size:12px;fill:#0D3B3F' }, svg).textContent = 'çekirdek n₁ = 1,468';
    const th = A.v, tir = th >= thc;
    const vis = Math.max(2.5, (90 - th) * 6);
    const slope = Math.tan(vis * Math.PI / 180);
    let x = 0, y = (core0 + core1) / 2, dy = -1, d = `M${x},${y}`, esc = null, guard = 0;
    while (x < Wd && guard++ < 60) {
      const yT = dy < 0 ? core0 : core1, dist = Math.abs(yT - y) / slope;
      if (x + dist >= Wd) { d += `L${Wd},${y + dy * (Wd - x) * slope}`; break; }
      x += dist; y = yT; d += `L${x},${y}`;
      if (!tir && !esc) { esc = [x, y, dy]; }
      dy = -dy;
    }
    S('path', { d, fill: 'none', stroke: '#FF6B1A', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: tir ? 1 : .45 }, svg);
    if (esc) { const [ex, ey, edy] = esc; S('path', { d: `M${ex},${ey}L${ex + 70},${ey + edy * 70 * 0.9}`, stroke: '#E0262F', 'stroke-width': 3, 'stroke-dasharray': '0', fill: 'none', 'stroke-linecap': 'round' }, svg); S('text', { x: ex + 12, y: edy < 0 ? 14 : Hh - 6, class: 'val', style: 'fill:#B3141D;font-size:12.5px' }, svg).textContent = 'ışık kaçıyor'; }
    out.innerHTML = tir ? `<b>θ = ${nf(th, 1)}° ≥ θc:</b> tam iç yansıma. Işık lifin içinde kalır ve kilometrelerce ilerler.` : `<b>θ = ${nf(th, 1)}° &lt; θc:</b> ışığın bir kısmı kılıfa kaçar, sinyal zayıflar.`;
  };
  responsive(box, w => { Wd = w; draw(); });
  A.inp.addEventListener('input', draw);
};
