/* ───────────── Calculators ───────────── */
W.porosity = el => {
  const D = sliderCtl(el, { label: 'Yoğunluk', min: -3, max: Math.log10(2.2), step: 0.005, value: Math.log10(0.02), fmt: v => nf(Math.pow(10, v), Math.pow(10, v) < 0.1 ? 3 : 2) + ' g/cm³', acc: 'var(--aero-ink)' });
  const seg = H('div', { class: 'seg' }, null, el);
  [['Aerojel', 0.02], ['LI-900', 0.1442], ['LI-2200', 0.3524], ['Cam', 2.2]].forEach(([l, v]) => { const b = H('button', { type: 'button', 'aria-pressed': 'false' }, l, seg); b.addEventListener('click', () => { D.set(Math.log10(v)); upd(); }); });
  const row = H('div', { style: 'display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;margin-top:16px' }, null, el);
  const grid = H('div', { style: 'display:grid;grid-template-columns:repeat(10,11px);gap:2px', 'aria-hidden': 'true' }, null, row);
  const cells = []; for (let i = 0; i < 100; i++) cells.push(H('i', { style: 'display:block;width:11px;height:11px;border-radius:3px;background:var(--mist-2);transition:background .3s' }, null, grid));
  const out = H('div', { 'aria-live': 'polite' }, null, row);
  const upd = () => {
    const rho = Math.pow(10, D.v), phi = clamp(1 - rho / 2.2, 0, 1), solid = Math.round((1 - phi) * 100);
    cells.forEach((c, i) => c.style.background = i < Math.max(solid, rho > 0 ? 1 : 0) ? 'var(--si)' : 'var(--mist-2)');
    out.innerHTML = `<div class="big" style="font-size:clamp(38px,4.4vw,58px)">%${nf(phi * 100, 1)}</div><p class="small muted" style="margin:6px 0 0">hava. Her kare hacmin %1'i; dolu kareler silika.</p>`;
  };
  D.inp.addEventListener('input', upd); upd();
  H('p', { class: 'note' }, 'Silika yoğunluğu 2,2 g/cm³ alındı. LI-900: 1 − 144,2 / 2200 = %93,4 (NASA: %94). Fark, 2,2 mi 2,3 g/cm³ mü alındığından gelir.', el);
};
W.clock = el => {
  const big = H('div', { class: 'counter', style: 'font-size:clamp(40px,5.4vw,72px)', 'aria-live': 'polite' }, '32.768 Hz', el);
  const dots = H('div', { style: 'display:flex;gap:5px;margin:14px 0;flex-wrap:wrap', 'aria-hidden': 'true' }, null, el);
  const ds = []; for (let i = 0; i < 15; i++) ds.push(H('i', { style: 'display:block;width:16px;height:16px;border-radius:50%;background:var(--mist-2);transition:background .25s,transform .25s' }, null, dots));
  const msg = H('p', { class: 'small', style: 'margin:0 0 12px' }, '2<sup>15</sup> = 32.768. Bölme sayısı: 0 / 15', el);
  const ctl = H('div', { style: 'display:flex;gap:8px' }, null, el);
  const b1 = H('button', { type: 'button', class: 'btn btn--sm' }, 'İkiye böl', ctl);
  const b2 = H('button', { type: 'button', class: 'btn btn--sm btn--ghost' }, 'Hepsini oynat', ctl);
  let k = 0, timer;
  const set = n => {
    k = n; const f = 32768 / Math.pow(2, k);
    big.textContent = nf(f) + ' Hz' + (k === 15 ? ' = 1 saniye' : '');
    ds.forEach((d, i) => { d.style.background = i < k ? 'var(--oxy)' : 'var(--mist-2)'; d.style.transform = i === k - 1 ? 'scale(1.25)' : 'none'; });
    msg.innerHTML = `2<sup>15</sup> = 32.768. Bölme sayısı: ${k} / 15`;
    b1.textContent = k === 15 ? 'Baştan' : 'İkiye böl';
  };
  b1.addEventListener('click', () => { clearInterval(timer); set(k === 15 ? 0 : k + 1); });
  b2.addEventListener('click', () => { clearInterval(timer); set(0); timer = setInterval(() => { if (k >= 15) return clearInterval(timer); set(k + 1); }, REDUCED.matches ? 10 : 220); });
};
W.sb = el => {
  const T = sliderCtl(el, { label: 'Yüzey sıcaklığı', min: 300, max: 1800, step: 1, value: 1533, fmt: v => `${nf(v)} K (${nf(v - 273)} °C)`, acc: 'var(--heat)' });
  const r = H('div', { class: 'readout', 'aria-live': 'polite' }, null, el);
  const upd = () => {
    const P = 0.85 * 5.670e-8 * 0.0225 * Math.pow(T.v, 4);
    r.innerHTML = `<b>${P >= 1000 ? nf(P / 1000, 1) + ' kW' : nf(P) + ' W'}</b><span>≈ ${nf(P / 2000, 1)} saç kurutma makinesi (≈ 2 kW kabulüyle)</span>`;
  };
  T.inp.addEventListener('input', upd); upd();
  H('p', { class: 'note' }, 'P = εσAT⁴; ε ≈ 0,85, σ = 5,67 × 10⁻⁸ W/(m²·K⁴), A = 0,0225 m². 1533 K için P ≈ 6,0 kW.', el);
};
W.radome = el => {
  const box = H('div', { class: 'chart' }, null, el);
  const F = sliderCtl(el, { label: 'Radar frekansı', min: 2, max: 40, step: 0.5, value: 10, fmt: v => nf(v, v % 1 ? 1 : 0) + ' GHz', acc: 'var(--si)' });
  const E = sliderCtl(el, { label: 'Dielektrik sabiti εr', min: 2, max: 10, step: 0.1, value: 3.3, fmt: v => nf(v, 1), acc: 'var(--si)' });
  const A = sliderCtl(el, { label: 'Geliş açısı θ', min: 0, max: 70, step: 1, value: 0, fmt: v => v + '°', acc: 'var(--si)' });
  const N = sliderCtl(el, { label: 'Kaç yarım dalga (n)', min: 1, max: 3, step: 1, value: 1, fmt: v => v, acc: 'var(--si)' });
  const r = H('div', { class: 'readout', 'aria-live': 'polite' }, null, el);
  let Wd = 500;
  const upd = () => {
    const l0 = 299.792458 / F.v, s = Math.sin(A.v * Math.PI / 180);
    const d = N.v * l0 / (2 * Math.sqrt(E.v - s * s));
    r.innerHTML = `<b>${nf(d, 1)} mm</b><span>duvar kalınlığı; λ₀ = ${nf(l0, 1)} mm, malzeme içinde λ = ${nf(l0 / Math.sqrt(E.v), 1)} mm</span>`;
    box.innerHTML = '';
    const Hh = 120, wallW = clamp(d * 9, 24, Wd * 0.7), x0 = (Wd - wallW) / 2;
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': `Radom duvarı ${nf(d, 1)} mm, içinde ${N.v} yarım dalga` }, box);
    S('rect', { x: x0, y: 10, width: wallW, height: Hh - 20, rx: 6, fill: '#F3EFE6', stroke: 'var(--line-2)' }, svg);
    let p = ''; for (let i = 0; i <= 80; i++) { const t = i / 80; p += (i ? 'L' : 'M') + (x0 + t * wallW) + ',' + (Hh / 2 - Math.sin(Math.PI * N.v * t) * (Hh * 0.32)); }
    S('path', { d: p, fill: 'none', stroke: 'var(--oxy)', 'stroke-width': 2.5 }, svg);
    let q = ''; for (let i = 0; i <= 60; i++) { const t = i / 60; q += (i ? 'L' : 'M') + (t * x0) + ',' + (Hh / 2 - Math.sin(t * 6 * Math.PI) * 14); }
    S('path', { d: q, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }, svg);
    S('text', { x: x0 + wallW / 2, y: Hh - 2, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px' }, svg).textContent = 'erimiş silika duvar';
    S('text', { x: 4, y: 16, class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg).textContent = 'radar dalgası';
  };
  responsive(box, w => { Wd = w; upd(); });
  [F, E, A, N].forEach(c => c.inp.addEventListener('input', upd));
};
W.mol = el => {
  const M = sliderCtl(el, { label: 'Saf kum (SiO₂) kütlesi', min: 10, max: 5000, step: 10, value: 1000, fmt: v => nf(v) + ' g' });
  const r = H('div', { 'aria-live': 'polite' }, null, el);
  const upd = () => {
    const n = M.v / 60.08;
    r.innerHTML = `<div class="readout"><b>${nf(n, 1)} mol</b><span>SiO₂ (n = m / 60,08)</span></div><p class="small" style="margin-top:10px">Cam yaparken Denklem 3a'ya göre her mol SiO₂ için 1 mol Na₂CO₃ (106 g) tepkimeye girer ve 1 mol CO₂ (44 g) çıkar: <b>${nf(n * 105.99 / 1000, 2)} kg Na₂CO₃ → ${nf(n * 44.01 / 1000, 2)} kg CO₂</b>.</p>`;
  };
  M.inp.addEventListener('input', upd); upd();
};
W.fourier = el => {
  const K = sliderCtl(el, { label: 'Isıl iletkenlik k', min: 0.02, max: 1.5, step: 0.01, value: 0.05, fmt: v => nf(v, 2) + ' W/(m·K)', acc: 'var(--heat)' });
  const T = sliderCtl(el, { label: 'Sıcaklık farkı ΔT', min: 100, max: 1500, step: 10, value: 1180, fmt: v => nf(v) + ' K', acc: 'var(--heat)' });
  const D = sliderCtl(el, { label: 'Kalınlık d', min: 1, max: 15, step: 0.5, value: 10, fmt: v => nf(v, 1) + ' cm', acc: 'var(--heat)' });
  const r = H('div', { class: 'readout', 'aria-live': 'polite' }, null, el);
  const upd = () => { const q = K.v * T.v / (D.v / 100); r.innerHTML = `<b>${nf(q)} W/m²</b><span>q = k·ΔT / d</span>`; };
  [K, T, D].forEach(c => c.inp.addEventListener('input', upd)); upd();
  H('p', { class: 'note' }, 'Sınırlılık: bu hesap kararlı durumu varsayar. Gerçek yeniden giriş ~20 dakikalık geçici bir süreçtir; k sıcaklık ve basınçla değişir, karo ısıyı depolar ve ışıma yapar.', el);
};
W.shock = el => {
  const mats = [['Erimiş silika', 50, 0.17, 72, 0.55], ['Soda camı', 50, 0.22, 70, 9]];
  const data = mats.map(([n, s, v, E, a]) => ({ label: n, v: Math.round(s * 1e6 * (1 - v) / (E * 1e9 * a * 1e-6)), hi: n === 'Erimiş silika', note: `σ ${s} MPa, ν ${nf(v, 2)}, E ${E} GPa, α ${nf(a, 2)} × 10⁻⁶/K` }));
  hbar(el, { data, min: 0, max: 1200, ticks: [0, 300, 600, 900, 1200], unit: 'K', labW: 110, valW: 70, head: ['Malzeme', 'R (K)'], fmt: v => '~' + nf(v) });
  H('p', { class: 'small', style: 'margin-top:8px' }, 'Erimiş silika ~1000 K, soda camı ~60 K sıcaklık şokuna dayanır. Karonun 1204 °C\'den buzlu suya atılabilmesinin sırrı bu.', el);
};

/* ───────────── 06 Havacılık ───────────── */
W.sagnac = el => {
  const box = H('div', { class: 'canvas-box', style: 'aspect-ratio:16/10;background:#0B1426;border:0' }, null, el);
  const cv = H('canvas', { 'aria-label': 'Halkada zıt yönlerde dolaşan iki ışık atımı', role: 'img' }, null, box);
  const O = sliderCtl(el, { label: 'Dönüş hızı (abartılı)', min: 0, max: 1, step: 0.01, value: 0.35, fmt: v => v === 0 ? 'duruyor' : '%' + Math.round(v * 100), acc: '#2EC4B6' });
  const out = H('p', { class: 'small', 'aria-live': 'polite', style: 'margin-top:6px' }, '', el);
  const g = cv.getContext('2d'); let Wd = 0, Hh = 0, dpr = 1;
  const size = () => { const r = box.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); Wd = r.width; Hh = r.height; cv.width = Wd * dpr; cv.height = Hh * dpr; };
  new ResizeObserver(size).observe(box); size();
  let t0 = performance.now(), vis = false;
  new IntersectionObserver(e => vis = e[0].isIntersecting).observe(box);
  const loop = now => {
    requestAnimationFrame(loop); if (!vis || !Wd) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wd, Hh);
    const cx = Wd / 2, cy = Hh / 2, R = Math.min(Wd, Hh) * 0.36;
    const Om = O.v * 0.9, c = 4.2, period = 2 * Math.PI / c * 1.35;
    const t = REDUCED.matches ? period * 0.5 : ((now - t0) / 1000) % period;
    const ring = Om * t;
    g.lineWidth = 10; g.strokeStyle = '#1B2B4D'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.strokeStyle = '#2B3F6A'; g.beginPath(); g.arc(cx, cy, R - 12, 0, Math.PI * 2); g.stroke();
    const det = -Math.PI / 2 + ring;
    const tA = 2 * Math.PI / (c - Om), tB = 2 * Math.PI / (c + Om);
    const pulse = (ang, col, done) => { const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R; const gr = g.createRadialGradient(x, y, 0, x, y, 18); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, done ? 3 : 4, 0, 7); g.fill(); };
    const a1 = -Math.PI / 2 + c * Math.min(t, tA), a2 = -Math.PI / 2 - c * Math.min(t, tB);
    pulse(a1, 'rgba(255,107,26,.95)', t >= tA); pulse(a2, 'rgba(110,200,255,.95)', t >= tB);
    const dx = cx + Math.cos(det) * R, dy = cy + Math.sin(det) * R;
    g.fillStyle = '#E0262F'; g.beginPath(); g.arc(dx, dy, 8, 0, 7); g.fill();
    g.fillStyle = '#C7D0E2'; g.font = '600 12px Poppins, sans-serif'; g.textAlign = 'center'; g.fillText('dedektör', dx, dy - 16);
    g.fillStyle = 'rgba(199,208,226,.85)'; g.font = '12px "IBM Plex Sans", sans-serif';
    g.fillText('turuncu: dönüş yönünde, mavi: ters yönde', cx, Hh - 10);
  };
  requestAnimationFrame(loop);
  const upd = () => { const Om = O.v * 0.9, c = 4.2; const dt = 2 * Math.PI / (c - Om) - 2 * Math.PI / (c + Om); out.innerHTML = O.v === 0 ? 'Halka durunca iki atım dedektöre aynı anda varır.' : `Mavi atım <b>${nf(dt / (2 * Math.PI / c) * 100, 0)}%</b> daha erken varıyor. Fark dönüş hızıyla orantılı büyür.`; };
  O.inp.addEventListener('input', upd); upd();
};
W.ash = el => {
  const box = H('div', { class: 'chart' }, null, el);
  responsive(box, Wd => {
    box.innerHTML = '';
    const Hh = 120, m = 8, sx = v => m + v / 2200 * (Wd - 2 * m);
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': 'Motor içi 1200–2000 °C; kum yaklaşık 1700 °C\'de erir; kül daha düşük sıcaklıkta erir' }, box);
    S('line', { x1: m, x2: Wd - m, y1: 74, y2: 74, stroke: 'var(--line-2)', 'stroke-width': 2 }, svg);
    S('path', { d: roundedBar(sx(1200), 60, sx(2000) - sx(1200), 28, 4, true), fill: 'var(--heat)', opacity: .85 }, svg);
    S('text', { x: (sx(1200) + sx(2000)) / 2, y: 79, 'text-anchor': 'middle', style: 'font:600 12px Poppins,sans-serif;fill:#2a1206' }, svg).textContent = 'motor içi 1200–2000 °C';
    S('line', { x1: sx(1700), x2: sx(1700), y1: 26, y2: 92, stroke: 'var(--ink)', 'stroke-width': 2 }, svg);
    S('text', { x: sx(1700), y: 18, 'text-anchor': 'middle', class: 'val' }, svg).textContent = 'kum (SiO₂) ~1700 °C';
    S('path', { d: `M${sx(1650)},40 H${sx(1250)}`, stroke: 'var(--oxy)', 'stroke-width': 2.5, fill: 'none' }, svg);
    S('path', { d: `M${sx(1250) + 8},34 L${sx(1250)},40 L${sx(1250) + 8},46`, stroke: 'var(--oxy)', 'stroke-width': 2.5, fill: 'none' }, svg);
    S('text', { x: sx(1250) - 6, y: 44, 'text-anchor': 'end', class: 'val', style: 'fill:var(--oxy-ink)' }, svg).textContent = 'kül daha erken erir';
    [0, 500, 1000, 1500, 2000].forEach((t, i) => S('text', { x: sx(t), y: 110, 'text-anchor': i === 0 ? 'start' : i === 4 ? 'end' : 'middle', class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg).textContent = t + ' °C');
  });
};

/* ───────────── 07 Uzay ───────────── */
const TPS = {
  RCC: { name: 'Takviyeli karbon-karbon (RCC)', where: 'Burun ve kanat hücum kenarı', color: 'Gri', t: 1650, fill: '#8A909B', text: 'En sıcak bölgeler. Columbia kazasında hasar gören parça bu panellerden biriydi.' },
  HRSI: { name: 'Yüksek sıcaklık karosu (LI-900 / LI-2200, FRCI-12)', where: 'Alt yüzey', color: 'Siyah', t: 1260, fill: '#15171C', text: 'Siyah RCG kaplama yüksek salım gücüyle ısıyı ışıma yoluyla geri yollar.' },
  LRSI: { name: 'Düşük sıcaklık karosu (LI-900, beyaz kaplama)', where: 'Yan ve üst yüzeyler', color: 'Beyaz', t: 650, fill: '#F2F1EC', text: 'Aynı silika karo, ama Güneş ışığını yansıtsın diye beyaz kaplamalı.' },
  AFRSI: { name: 'Silika elyaf yorgan (AFRSI)', where: 'Üst yüzey', color: 'Beyaz', t: 650, fill: '#E4DED0', text: 'Esnek silika yorganlar zamanla birçok LRSI karosunun yerini aldı.' },
  FRSI: { name: 'Nomex keçe (FRSI)', where: 'En soğuk bölgeler', color: 'Beyaz', t: 370, fill: '#FBFBF7', text: 'Yük bölmesi kapakları gibi en az ısınan yerler.' }
};
function setTPS(key) {
  const z = TPS[key]; if (!z) return;
  $('#tpsTag').textContent = key; $('#tpsName').textContent = z.name; $('#tpsText').textContent = `${z.where}. ${z.text}`;
  const el = $('#tpsTemp'), t0 = performance.now(), from = 0;
  const run = now => { const k = REDUCED.matches ? 1 : clamp((now - t0) / 900, 0, 1); el.textContent = '~' + nf(Math.round(from + (z.t - from) * easeOutCubic(k))) + ' °C'; el.style.color = z.t > 1000 ? 'var(--heat)' : z.t > 500 ? '#FFB067' : '#F4F6FA'; if (k < 1) requestAnimationFrame(run); };
  requestAnimationFrame(run);
  $$('#tpsRows tr').forEach(r => r.classList.toggle('is-on', r.dataset.k === key));
}
W.orbiter = el => {
  const rows = $('#tpsRows');
  [['RCC', 'Gri', '~1650 °C'], ['HRSI', 'Siyah', '~1260 °C'], ['LRSI', 'Beyaz', '~650 °C'], ['AFRSI', 'Beyaz', '~650 °C'], ['FRSI', 'Beyaz', '~370 °C'], ['AETB, TUFI', 'Siyah', '~1260 °C civarı']].forEach(([k, c, t]) => { const tr = H('tr', { 'data-k': k }, `<td>${k}</td><td>${c}</td><td class="num">${t}</td>`, rows); tr.style.cursor = TPS[k] ? 'pointer' : 'default'; tr.addEventListener('click', () => TPS[k] && pick(k)); });
  const seg = H('div', { class: 'seg', style: 'margin-bottom:12px' }, '<button type="button" aria-pressed="true" data-v="alt">Alttan</button><button type="button" aria-pressed="false" data-v="ust">Üstten</button>', el);
  const box = H('div', { class: 'chart', style: 'max-width:420px;margin:0 auto' }, null, el);
  const L = [[160, 20], [142, 38], [131, 70], [126, 112], [126, 182], [101, 300], [24, 462], [22, 484], [126, 494], [126, 530], [140, 548], [160, 549]];
  const mirror = pts => pts.map(([x, y]) => [320 - x, y]).reverse();
  const outline = [...L, ...mirror(L.slice(0, -1))];
  const poly = pts => 'M' + pts.map(p => p.join(',')).join('L') + 'Z';
  const lead = s => { const a = [[101, 300], [24, 462], [32, 463], [108, 304]]; return s ? mirror(a).reverse() : a; };
  let view = 'alt', svg;
  const zone = (d, key, extra = {}) => { const p = S('path', { d, fill: TPS[key].fill, class: 'zone', tabindex: 0, role: 'button', 'aria-label': TPS[key].name, 'data-k': key, ...extra }, svg); p.addEventListener('click', () => pick(key)); p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(key); } }); return p; };
  const draw = () => {
    box.innerHTML = '';
    svg = S('svg', { viewBox: '0 0 320 570', role: 'group', 'aria-label': 'Uzay mekiği ısıl koruma haritası' }, box);
    const defs = S('defs', {}, svg);
    defs.innerHTML = '<pattern id="quilt" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#E4DED0"/><path d="M0 0H10M0 0V10" stroke="#CFC7B4" stroke-width="1"/></pattern><pattern id="tiles" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#15171C"/><path d="M0 0H7M0 0V7" stroke="#2A2E37" stroke-width=".8"/></pattern>';
    if (view === 'alt') {
      zone(poly(outline), 'HRSI', { fill: 'url(#tiles)' });
      zone(poly(lead(0)), 'RCC'); zone(poly(lead(1)), 'RCC');
      zone('M160,20 L144,36 L150,48 L160,51 L170,48 L176,36 Z', 'RCC');
    } else {
      zone(poly(outline), 'AFRSI', { fill: 'url(#quilt)' });
      zone('M134,160 H186 V446 H134 Z', 'FRSI');
      zone('M126,186 L101,300 L60,380 L118,382 L126,300 Z', 'FRSI'); zone('M194,186 L219,300 L260,380 L202,382 L194,300 Z', 'FRSI');
      zone('M131,70 L126,112 L126,150 L194,150 L194,112 L189,70 L160,58 Z', 'LRSI');
      zone(poly(lead(0)), 'RCC'); zone(poly(lead(1)), 'RCC');
      zone('M160,20 L144,36 L150,48 L160,51 L170,48 L176,36 Z', 'RCC');
      S('path', { d: 'M144,92 L152,84 H168 L176,92 L170,100 H150 Z', fill: '#15171C', 'pointer-events': 'none' }, svg);
    }
    S('text', { x: 160, y: 566, 'text-anchor': 'middle', style: 'font:500 12px "IBM Plex Sans",sans-serif;fill:#93A0BC' }, svg).textContent = view === 'alt' ? 'alt yüzey (yere bakan)' : 'üst yüzey';
    const cur = $('#tpsTag').textContent; $$('.zone', svg).forEach(z => z.classList.toggle('is-on', z.dataset.k === cur));
  };
  const pick = key => { setTPS(key); $$('.zone', svg).forEach(z => z.classList.toggle('is-on', z.dataset.k === key)); };
  $$('button', seg).forEach(b => b.addEventListener('click', () => { view = b.dataset.v; $$('button', seg).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); draw(); pick(view === 'alt' ? 'HRSI' : 'AFRSI'); }));
  draw(); pick('HRSI');
};
function heatColor(T) {
  const st = [[20, [58, 63, 76]], [300, [110, 32, 22]], [700, [190, 50, 18]], [1000, [245, 110, 30]], [1260, [255, 214, 160]]];
  for (let i = 1; i < st.length; i++) if (T <= st[i][0]) { const k = (T - st[i - 1][0]) / (st[i][0] - st[i - 1][0]); const a = st[i - 1][1], b = st[i][1]; return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`; }
  return 'rgb(255,214,160)';
}
function simulateTile(L, k) {
  const rho = 144, c = 1000, tau = 1800, tEnd = 3600, hs = 10, Cal = 7290, N = 30, dx = L / N, a = k / (rho * c), dt = 0.4 * dx * dx / a;
  let T = new Float64Array(N + 1).fill(20), Tn = new Float64Array(N + 1), Tal = 20; const frames = []; let next = 0;
  for (let t = 0; t <= tEnd; t += dt) {
    const Ts = t < tau ? 20 + 1240 * Math.pow(Math.sin(Math.PI * t / tau), 2) : 20;
    if (t >= next) { frames.push({ t, prof: Array.from(T), Tal, Ts }); next += 15; }
    Tn[0] = Ts;
    for (let i = 1; i < N; i++) Tn[i] = T[i] + a * dt / (dx * dx) * (T[i + 1] - 2 * T[i] + T[i - 1]);
    const qin = k * (T[N - 1] - T[N]) / dx, qout = hs * (T[N] - Tal);
    Tn[N] = T[N] + dt * (qin - qout) / (rho * c * dx / 2);
    Tal += dt * qout / Cal; const s = T; T = Tn; Tn = s;
  }
  return frames;
}
W.heatsim = el => {
  const top = H('div', { style: 'display:grid;grid-template-columns:minmax(90px,150px) 1fr;gap:14px;align-items:stretch' }, null, el);
  const cvA = H('canvas', { role: 'img', 'aria-label': 'Karo kesitinde sıcaklık', style: 'width:100%;height:260px;border-radius:12px;display:block' }, null, top);
  const right = H('div', { style: 'min-width:0' }, null, top);
  const cvB = H('canvas', { role: 'img', 'aria-label': 'Zamana göre yüzey ve alüminyum sıcaklığı', style: 'width:100%;height:260px;display:block' }, null, right);
  const Lc = sliderCtl(el, { label: 'Karo kalınlığı', min: 2.5, max: 12.7, step: 0.1, value: 5, fmt: v => nf(v, 1) + ' cm', acc: 'var(--heat)' });
  const kseg = H('div', { class: 'seg', role: 'group', 'aria-label': 'Isıl iletkenlik' }, null, el);
  let k = 0.07;
  [['k = 0,048', 0.048], ['k = 0,07', 0.07], ['k = 0,126', 0.126]].forEach(([l, v]) => { const b = H('button', { type: 'button', 'aria-pressed': v === k ? 'true' : 'false' }, l, kseg); b.addEventListener('click', () => { k = v; $$('button', kseg).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); recompute(); }); });
  const ctl = H('div', { style: 'display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap' }, null, el);
  const play = H('button', { type: 'button', class: 'btn btn--sm', style: 'background:var(--heat);border-color:var(--heat);color:#1a0d05' }, 'Yeniden girişi oynat', ctl);
  const stat = H('span', { class: 'small', 'aria-live': 'polite' }, '', ctl);
  H('p', { class: 'note' }, 'Basitleştirilmiş eğitsel model: tek boyutlu ısı iletimi, yüzey 30 dakikada 1260 °C\'ye çıkıp iner; ρ = 144 kg/m³, c ≈ 1000 J/(kg·K), SIP ve 3 mm alüminyum sabit ısı sığasıyla. Gerçek uçuş verisi değildir.', el);
  let frames = [], fi = 0, playing = false, maxAl = 0;
  const recompute = () => { frames = simulateTile(Lc.v / 100, k); maxAl = Math.max(...frames.map(f => f.Tal)); fi = frames.length - 1; render(); };
  const render = () => {
    const f = frames[fi]; if (!f) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    // cross-section
    { const r = cvA.getBoundingClientRect(), w = r.width, h = r.height; cvA.width = w * dpr; cvA.height = h * dpr; const g = cvA.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#0E1830'; g.fillRect(0, 0, w, h);
      const tileH = h * 0.72, y0 = 14, n = f.prof.length;
      for (let i = 0; i < n; i++) { g.fillStyle = heatColor(f.prof[i]); g.fillRect(10, y0 + i / n * tileH, w - 20, tileH / n + 1); }
      g.fillStyle = '#05070B'; g.fillRect(10, y0 - 4, w - 20, 5);
      g.fillStyle = '#d8d2b8'; g.fillRect(14, y0 + tileH + 2, w - 28, 8);
      g.fillStyle = heatColor(f.Tal); g.fillRect(6, y0 + tileH + 12, w - 12, 10);
      g.fillStyle = '#C7D0E2'; g.font = '600 11px Poppins, sans-serif'; g.textAlign = 'center';
      g.fillText('RCG', w / 2, y0 - 6 < 8 ? 11 : y0 - 6); g.fillText('alüminyum', w / 2, y0 + tileH + 38);
      g.fillStyle = '#fff'; g.font = '700 14px Poppins, sans-serif'; g.fillText(nf(Math.round(f.Ts)) + ' °C', w / 2, y0 + 20); g.fillText(nf(Math.round(f.Tal)) + ' °C', w / 2, h - 10);
    }
    // time chart
    { const r = cvB.getBoundingClientRect(), w = r.width, h = r.height; cvB.width = w * dpr; cvB.height = h * dpr; const g = cvB.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ml = 40, mb = 24, pw = w - ml - 10, ph = h - mb - 10, sx = t => ml + t / 3600 * pw, sy = T => 10 + ph - T / 1300 * ph;
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = '#93A0BC'; g.font = '11px "IBM Plex Sans", sans-serif'; g.textAlign = 'right';
      [0, 400, 800, 1200].forEach(T => { g.beginPath(); g.moveTo(ml, sy(T)); g.lineTo(ml + pw, sy(T)); g.stroke(); g.fillText(nf(T), ml - 6, sy(T) + 4); });
      g.textAlign = 'center'; [0, 15, 30, 45, 60].forEach(m => g.fillText(m + ' dk', sx(m * 60), h - 6));
      g.strokeStyle = '#E0262F'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ml, sy(177)); g.lineTo(ml + pw, sy(177)); g.stroke();
      g.fillStyle = '#FF8A8F'; g.textAlign = 'left'; g.fillText('177 °C sınır', ml + 4, sy(177) - 5);
      const line = (key, col) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); frames.forEach((q, j) => { if (j > fi) return; const x = sx(q.t), y = sy(key === 'Ts' ? q.Ts : q.Tal); j ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
      line('Ts', '#FF6B1A'); line('Tal', '#8EC9FF');
      g.fillStyle = '#FF6B1A'; g.fillRect(ml + 8, 16, 14, 2.5); g.fillStyle = '#C7D0E2'; g.fillText('karo yüzeyi', ml + 28, 21);
      g.fillStyle = '#8EC9FF'; g.fillRect(ml + 8, 32, 14, 2.5); g.fillStyle = '#C7D0E2'; g.fillText('alüminyum gövde', ml + 28, 37);
    }
    const ok = maxAl < 177;
    stat.innerHTML = `Alüminyumun en yüksek sıcaklığı: <b style="color:${ok ? '#7EE2B8' : '#FF8A8F'}">${nf(Math.round(maxAl))} °C</b> ${ok ? '(güvenli)' : '(sınır aşıldı)'}`;
  };
  let raf = 0;
  const step = () => { if (!playing) return; fi = Math.min(frames.length - 1, fi + 2); render(); if (fi < frames.length - 1) raf = requestAnimationFrame(step); else { playing = false; play.textContent = 'Yeniden girişi oynat'; } };
  play.addEventListener('click', () => { if (playing) { playing = false; cancelAnimationFrame(raf); play.textContent = 'Devam et'; return; } if (fi >= frames.length - 1) fi = 0; playing = true; play.textContent = 'Durdur'; raf = requestAnimationFrame(step); });
  Lc.inp.addEventListener('input', () => { playing = false; recompute(); play.textContent = 'Yeniden girişi oynat'; });
  new ResizeObserver(() => render()).observe(right);
  recompute();
};
W.expansion = el => hbar(el, { data: [{ label: 'Erimiş silika', v: 0.055, hi: 1 }, { label: 'Soda camı', v: 0.9 }, { label: 'Alüminyum', v: 2.3 }], min: 0, max: 2.5, ticks: [0, 0.5, 1, 1.5, 2, 2.5], unit: 'mm', labW: 110, valW: 70, head: ['Malzeme', 'ΔL (mm)'], fmt: v => nf(v, v < 0.1 ? 3 : 1), tickFmt: t => nf(t, 1) });
W.artemis = el => hbar(el, { data: [{ label: 'Artemis I (2022)', v: 103 }, { label: 'Artemis II (2026)', v: 9, hi: 1 }], min: 0, max: 120, ticks: [0, 40, 80, 120], unit: 'nokta', labW: 120, valW: 70, head: ['Uçuş', 'Yanık kaybı noktası'], accent: 'var(--heat)', base: '#5B6B8C' });
W.hex = el => {
  el.classList.add('hexdemo');
  const mk = (title, kind) => {
    const fig = H('figure', {}, null, el);
    const svg = S('svg', { viewBox: '0 0 300 170', role: 'img', 'aria-label': title }, fig);
    S('rect', { width: 300, height: 170, rx: 12, fill: '#0E1424' }, svg);
    let seam = '';
    if (kind === 'sq') {
      const s = 34;
      for (let y = 4; y < 170; y += s) for (let x = 4; x < 300; x += s) S('rect', { x, y, width: s - 4, height: s - 4, rx: 2, fill: '#1B1F29' }, svg);
      seam = `M0,${4 + 2 * s - 2}H300`;
    } else {
      const s = 19, h = Math.sqrt(3) / 2 * s;
      for (let c = -1; c < 12; c++) for (let r = -1; r < 6; r++) { const cx = c * 1.5 * s + 6, cy = r * 2 * h + (c % 2 ? h : 0) + 6; let p = ''; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; p += (k ? 'L' : 'M') + (cx + (s - 2) * Math.cos(a)).toFixed(1) + ',' + (cy + (s - 2) * Math.sin(a)).toFixed(1); } S('path', { d: p + 'Z', fill: '#1B1F29' }, svg); }
      const r = 1; let pts = [];
      for (let c = -1; c < 12; c++) { const cx = c * 1.5 * s + 6, cy = r * 2 * h + (c % 2 ? h : 0) + 6; pts.push([cx - s / 2, cy + h], [cx + s / 2, cy + h]); }
      seam = 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join('L');
    }
    const base = S('path', { d: seam, fill: 'none', stroke: 'rgba(255,107,26,.35)', 'stroke-width': 3 }, svg);
    const flow = S('path', { d: seam, fill: 'none', stroke: '#FFB067', 'stroke-width': 3, 'stroke-dasharray': '6 18', 'stroke-linecap': 'round' }, svg);
    if (!REDUCED.matches) flow.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -240 }], { duration: 2400, iterations: Infinity });
    H('figcaption', {}, title, fig);
    return base;
  };
  mk('Kare karolar: aralık düz bir kanal oluşturur, sıcak gaz hızla akar.', 'sq');
  mk('Altıgen karolar: kanal zikzak çizer, sıcak gaz düz yol bulamaz.', 'hex');
};

/* ───────────── 08 Aerojel ───────────── */
W.solgel = el => {
  const STEPS = [
    ['Sol', 'TEOS su ile tepkimeye girer ve Si–OH grupları oluşur (Denklem 8). Sıvıda minik silika parçacıkları yüzer.'],
    ['Jel', 'Si–OH grupları su kaybederek Si–O–Si köprüleri kurar (Denklem 9). Parçacıklar bağlanıp üç boyutlu bir ağ olur.'],
    ['Yaşlandırma', 'Ağ birkaç gün bekletilir; bağlar kalınlaşır ve iskelet güçlenir.'],
    ['Çözücü değişimi', 'Gözeneklerdeki su önce alkolle, sonra sıvı CO₂ ile değiştirilir.'],
    ['Süperkritik kurutma', 'CO₂ kritik noktasının (~31 °C, ~7,4 MPa) üstüne çıkarılır. Sıvı ile gaz arasındaki yüzey kaybolur, kılcal kuvvet oluşmaz ve iskelet çökmeden kalır.']
  ];
  const chips = H('div', { class: 'seg', role: 'tablist' }, null, el);
  const fig = H('div', { class: 'canvas-box', style: 'aspect-ratio:16/8;margin:14px 0' }, null, el);
  const cv = H('canvas', { 'aria-hidden': 'true' }, null, fig);
  const txt = H('p', { 'aria-live': 'polite' }, '', el);
  H('p', { class: 'note' }, 'Alternatif yol: yüzey modifikasyonu (silanlama) ile normal basınçta kurutma.', el);
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const P = []; for (let i = 0; i < 70; i++) P.push([rnd(), rnd(), rnd()]);
  const links = []; P.forEach((a, i) => P.forEach((b, j) => { if (j > i && Math.hypot(a[0] - b[0], (a[1] - b[1]) * .5) < .14) links.push([i, j]); }));
  let st = 0, t0 = performance.now(), mix = 0;
  const btns = STEPS.map(([n], i) => { const b = H('button', { type: 'button', role: 'tab', 'aria-pressed': i ? 'false' : 'true' }, (i + 1) + '. ' + n, chips); b.addEventListener('click', () => set(i)); return b; });
  const set = i => { st = i; btns.forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false')); txt.innerHTML = `<b>${STEPS[i][0]}:</b> ${STEPS[i][1]}`; t0 = performance.now(); };
  const fluid = ['rgba(120,180,255,.30)', 'rgba(120,180,255,.30)', 'rgba(120,180,255,.30)', 'rgba(170,130,255,.28)', 'rgba(255,255,255,0)'];
  let vis = false; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(fig);
  const draw = now => {
    requestAnimationFrame(draw); if (!vis) return;
    const r = fig.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2), w = r.width, h = r.height;
    if (cv.width !== Math.round(w * dpr)) { cv.width = w * dpr; cv.height = h * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const k = REDUCED.matches ? 1 : clamp((now - t0) / 900, 0, 1);
    let fl = fluid[st]; if (st === 3) fl = k < .5 ? 'rgba(160,140,255,.28)' : 'rgba(200,200,210,.30)';
    g.fillStyle = fl; g.fillRect(0, 0, w, h);
    const tt = now / 1000;
    const pos = P.map(([x, y, z], i) => [x * w + (st === 0 ? Math.sin(tt * 1.2 + i) * 6 : 0), y * h + (st === 0 ? Math.cos(tt + i * 1.7) * 6 : 0)]);
    const lw = st === 0 ? 0 : st === 1 ? 1.6 * k : 3;
    if (lw > 0) { g.strokeStyle = 'rgba(43,58,94,.55)'; g.lineWidth = lw; links.forEach(([a, b]) => { g.beginPath(); g.moveTo(...pos[a]); g.lineTo(...pos[b]); g.stroke(); }); }
    pos.forEach(([x, y]) => { g.fillStyle = '#2B3A5E'; g.beginPath(); g.arc(x, y, st >= 2 ? 5 : 4, 0, 7); g.fill(); });
    if (st === 4) { g.fillStyle = `rgba(142,201,255,${0.25 * k})`; g.fillRect(0, 0, w, h); g.fillStyle = '#1D5D9B'; g.font = '600 14px Poppins, sans-serif'; g.fillText('aerojel: iskelet + hava', 12, h - 12); }
  };
  requestAnimationFrame(draw); set(0);
};
W.knudsen = el => {
  const fig = H('div', { class: 'canvas-box', style: 'aspect-ratio:16/9' }, null, el);
  const cv = H('canvas', { role: 'img', 'aria-label': 'Gözenekteki gaz molekülleri ve çarpışmalar' }, null, fig);
  const D = sliderCtl(el, { label: 'Gözenek boyutu', min: Math.log10(10), max: Math.log10(1000), step: 0.01, value: Math.log10(20), fmt: v => nf(Math.pow(10, v), 0) + ' nm', acc: 'var(--aero-ink)' });
  const out = H('div', { 'aria-live': 'polite' }, null, el);
  const lam = 68; let mol = [], gg = 0, gw = 0;
  const reset = () => { mol = []; for (let i = 0; i < 26; i++) { const a = Math.random() * 7; mol.push({ x: Math.random(), y: Math.random(), vx: Math.cos(a), vy: Math.sin(a), free: -Math.log(Math.random()) * lam, trail: [] }); } gg = 0; gw = 0; };
  reset();
  let vis = false; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(fig);
  const upd = () => { const d = Math.pow(10, D.v), Kn = lam / d; out.innerHTML = `<div class="readout"><b>Kn = ${nf(Kn, Kn < 1 ? 2 : 1)}</b><span>${Kn > 1 ? 'Kn > 1: moleküller çoğunlukla duvarlara çarpar, gaz ısıyı iyi taşıyamaz.' : 'Kn < 1: moleküller birbirine çarpıp ısıyı aktarır (sıradan hava).'}</span></div><p class="small muted" style="margin-top:6px">Kn = λ / d = 68 nm / ${nf(d, 0)} nm. 20 nm için Kn ≈ 3,4.</p>`; reset(); };
  D.inp.addEventListener('input', upd); upd();
  let last = performance.now();
  const loop = now => {
    requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!vis) return;
    const r = fig.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2), w = r.width, h = r.height;
    if (cv.width !== Math.round(w * dpr)) { cv.width = w * dpr; cv.height = h * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#F4F9FF'; g.fillRect(0, 0, w, h);
    const d = Math.pow(10, D.v); // pore = box of size d (nm), display height h
    const scale = h / d, speed = 0.9 * d * (REDUCED.matches ? 0 : 1);
    g.strokeStyle = '#2B3A5E'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    mol.forEach(m => {
      let step = speed * dt; // nm
      while (step > 0) {
        const s = Math.min(step, m.free); m.x += m.vx * s / d * (h / w); m.y += m.vy * s / d; m.free -= s; step -= s;
        if (m.x < 0 || m.x > 1) { m.vx *= -1; m.x = clamp(m.x, 0, 1); gw++; }
        if (m.y < 0 || m.y > 1) { m.vy *= -1; m.y = clamp(m.y, 0, 1); gw++; }
        if (m.free <= 0) { const a = Math.random() * 7; m.vx = Math.cos(a); m.vy = Math.sin(a); m.free = -Math.log(Math.random()) * lam; gg++; m.flash = 1; }
      }
      const px = 6 + m.x * (w - 12), py = 6 + m.y * (h - 12);
      m.trail.push([px, py]); if (m.trail.length > 14) m.trail.shift();
      g.strokeStyle = 'rgba(29,93,155,.25)'; g.lineWidth = 1.5; g.beginPath(); m.trail.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
      g.fillStyle = m.flash > 0 ? '#E0262F' : '#1D5D9B'; g.beginPath(); g.arc(px, py, m.flash > 0 ? 5 : 3.5, 0, 7); g.fill(); m.flash = Math.max(0, (m.flash || 0) - dt * 3);
    });
    const tot = gg + gw || 1;
    g.fillStyle = 'rgba(11,20,38,.78)'; g.fillRect(10, 10, 210, 46); g.fillStyle = '#fff'; g.font = '600 12px Poppins, sans-serif';
    g.fillText(`molekül–molekül: %${Math.round(gg / tot * 100)}`, 18, 28); g.fillText(`molekül–duvar: %${Math.round(gw / tot * 100)}`, 18, 46);
    if (gg + gw > 4000) { gg *= .5; gw *= .5; }
  };
  requestAnimationFrame(loop);
};
W.capillary = el => {
  const R = sliderCtl(el, { label: 'Gözenek yarıçapı r', min: Math.log10(2), max: 2, step: 0.01, value: 1, fmt: v => nf(Math.pow(10, v), 1) + ' nm', acc: 'var(--aero-ink)' });
  const seg = H('div', { class: 'seg' }, '<button type="button" aria-pressed="true" data-m="n">Normal kurutma</button><button type="button" aria-pressed="false" data-m="s">Süperkritik</button>', el);
  const out = H('div', { class: 'readout', 'aria-live': 'polite' }, null, el);
  let sc = false;
  const upd = () => { const r = Math.pow(10, R.v) * 1e-9, P = sc ? 0 : 2 * 0.072 / r; out.innerHTML = `<b>${nf(P / 1e6, 1)} MPa</b><span>${sc ? 'γ = 0: yüzey yok, basınç yok' : `≈ ${nf(P / 101325, 0)} atmosfer`}</span>`; };
  $$('button', seg).forEach(b => b.addEventListener('click', () => { sc = b.dataset.m === 's'; $$('button', seg).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); upd(); }));
  R.inp.addEventListener('input', upd); upd();
  H('p', { class: 'note' }, 'Su: γ = 0,072 N/m, θ = 0. r = 10 nm için ΔP = 1,44 × 10⁷ Pa ≈ 14 MPa.', el);
};
W.ucurve = el => {
  const box = H('div', { class: 'chart' }, null, el);
  responsive(box, Wd => {
    box.innerHTML = '';
    const Hh = 220, ml = 20, mb = 30, pw = Wd - ml - 10, ph = Hh - mb - 16;
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': 'Şematik U eğrisi: çok düşük ve yüksek yoğunlukta iletkenlik artar, arada en düşük' }, box);
    S('line', { x1: ml, x2: ml + pw, y1: 16 + ph, y2: 16 + ph, class: 'ax' }, svg); S('line', { x1: ml, x2: ml, y1: 10, y2: 16 + ph, class: 'ax' }, svg);
    let d = ''; for (let i = 0; i <= 100; i++) { const x = i / 100, y = 0.18 + 0.75 * Math.pow(x - 0.38, 2) / 0.38 + 0.25 * Math.exp(-x * 9); d += (i ? 'L' : 'M') + (ml + x * pw) + ',' + (16 + ph - clamp(1 - y, 0, 1) * ph * 0); }
    let d2 = ''; for (let i = 0; i <= 100; i++) { const x = i / 100, y = 0.25 * Math.exp(-x * 7) + 0.1 + 0.9 * Math.pow(Math.max(0, x - 0.3), 2); d2 += (i ? 'L' : 'M') + (ml + x * pw) + ',' + (16 + ph - y * ph * 0.95); }
    const p = S('path', { d: d2, fill: 'none', stroke: 'var(--aero-ink)', 'stroke-width': 2.5 }, svg);
    const mx = ml + 0.3 * pw; S('circle', { cx: mx, cy: 16 + ph - 0.1 * ph * 0.95 - 3, r: 5, fill: 'var(--aero-ink)', stroke: 'var(--paper)', 'stroke-width': 2 }, svg);
    S('text', { x: mx, y: 16 + ph - 0.1 * ph - 16, 'text-anchor': 'middle', class: 'val' }, svg).textContent = 'en iyi yalıtım';
    S('text', { x: ml + 8, y: 26, class: 'lbl', style: 'font-size:12px' }, svg).textContent = 'ışıma baskın';
    S('text', { x: ml + pw - 4, y: 26, 'text-anchor': 'end', class: 'lbl', style: 'font-size:12px' }, svg).textContent = 'katı iletim artar';
    S('text', { x: ml + pw / 2, y: Hh - 8, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg).textContent = 'yoğunluk →';
    S('text', { x: ml + 6, y: 14 + ph / 2, class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)', transform: `rotate(-90 ${ml + 6} ${14 + ph / 2})`, 'text-anchor': 'middle' }, svg).textContent = 'ısıl iletkenlik →';
    if (!REDUCED.matches) { const L = p.getTotalLength?.() || 600; p.style.strokeDasharray = L; p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1200, easing: 'ease-out' }); }
  });
};

/* ───────────── 10 Sağlık ───────────── */
W.particles = el => {
  el.classList.add('grid', 'g-7-5');
  const left = H('div', {}, null, el), right = H('div', {}, null, el);
  const box = H('div', { class: 'chart' }, null, left);
  const Sz = sliderCtl(left, { label: 'Tanecik boyutu', min: 0, max: Math.log10(2000), step: 0.01, value: Math.log10(3), fmt: v => { const u = Math.pow(10, v); return u >= 1000 ? nf(u / 1000, 1) + ' mm' : nf(u, u < 10 ? 1 : 0) + ' µm'; }, acc: 'var(--oxy)' });
  const verdict = H('div', { 'aria-live': 'polite', style: 'margin-top:10px' }, null, left);
  const marks = [['PM2.5', 2.5], ['solunabilir ~4 µm', 4], ['PM10', 10], ['saç teli ~70 µm', 70], ['plaj kumu 60 µm–2 mm', 60, 2000]];
  let Wd = 500, mk;
  const drawScale = () => {
    box.innerHTML = '';
    const Hh = 120, m = 10, sx = v => m + Math.log10(v) / Math.log10(2000) * (Wd - 2 * m);
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': 'Logaritmik boyut ölçeği 1 µm ile 2 mm arası' }, box);
    S('path', { d: roundedBar(sx(60), 52, sx(2000) - sx(60), 14, 4, true), fill: '#E2C690' }, svg);
    S('path', { d: roundedBar(sx(1), 52, sx(4) - sx(1), 14, 4, true), fill: '#F2A9AC' }, svg);
    S('line', { x1: m, x2: Wd - m, y1: 59, y2: 59, stroke: 'var(--line-2)' }, svg);
    [[1, '1 µm'], [10, '10 µm'], [100, '100 µm'], [1000, '1 mm']].forEach(([v, l]) => { S('line', { x1: sx(v), x2: sx(v), y1: 70, y2: 76, stroke: 'var(--ink-3)' }, svg); S('text', { x: sx(v), y: 92, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg).textContent = l; });
    [['solunabilir', 2, '#B3141D'], ['plaj kumu', 300, '#7A5A22']].forEach(([l, v, c]) => S('text', { x: sx(v), y: 44, 'text-anchor': 'middle', style: `font:600 12px Poppins,sans-serif;fill:${c}` }, svg).textContent = l);
    [[2.5, 'PM2.5'], [10, 'PM10'], [70, 'saç teli']].forEach(([v, l]) => { S('line', { x1: sx(v), x2: sx(v), y1: 48, y2: 70, stroke: 'var(--ink-2)', 'stroke-width': 1.5 }, svg); S('text', { x: sx(v), y: 112, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:11.5px' }, svg).textContent = l; });
    mk = S('g', {}, svg); S('path', { d: 'M0,0 l-7,-12 h14z', fill: 'var(--ink)' }, mk);
    placeMk();
    function placeMk() { mk.setAttribute('transform', `translate(${sx(Math.pow(10, Sz.v))},48)`); }
    drawScale.placeMk = placeMk;
  };
  responsive(box, w => { Wd = w; drawScale(); });
  // lung diagram
  const lung = S('svg', { viewBox: '0 0 260 300', class: 'lung', role: 'img', 'aria-label': 'Solunum yolu: burun ve boğaz, bronşlar, alveoller' }, H('div', { style: 'max-width:300px;margin:0 auto' }, null, right));
  const zoneUp = S('path', { d: 'M108,10 q22,-8 44,0 q8,18 -2,34 h-40 q-10,-16 -2,-34z M120,44 h20 v62 h-20z', fill: '#E7D3C9', class: 'dep' }, lung);
  const zoneBr = S('path', { d: 'M130,104 C118,130 96,140 80,170 M130,104 C142,130 164,140 180,170 M80,170 C70,188 62,200 58,222 M180,170 C190,188 198,200 202,222', fill: 'none', stroke: '#D9B8AC', 'stroke-width': 10, 'stroke-linecap': 'round', class: 'dep' }, lung);
  const zoneAl = S('g', { class: 'dep' }, lung);
  [[40, 226], [70, 246], [56, 266], [90, 270], [190, 226], [220, 246], [204, 266], [170, 270], [110, 230], [150, 230], [130, 262]].forEach(([x, y]) => S('circle', { cx: x, cy: y, r: 14, fill: '#EBC3C3' }, zoneAl));
  S('path', { d: 'M130,100 C70,96 22,150 24,236 C26,286 92,294 120,276 C128,250 128,140 130,100 C132,140 132,250 140,276 C168,294 234,286 236,236 C238,150 190,96 130,100Z', fill: 'none', stroke: '#C9A49A', 'stroke-width': 2 }, lung);
  const tags = [['burun ve boğaz', 200, 30], ['bronşlar', 210, 150], ['alveoller', 214, 296]];
  tags.forEach(([t, x, y]) => S('text', { x, y, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px;fill:var(--ink-2)' }, lung).textContent = t);
  const upd = () => {
    const u = Math.pow(10, Sz.v);
    drawScale.placeMk?.();
    let z, msg, col;
    if (u >= 60) { z = null; msg = '<b>Akciğere ulaşamaz.</b> Plaj kumu bu kadar iri; burunda ve boğazda kalır. Tehlike kumda değil.'; col = 'var(--good)'; }
    else if (u > 10) { z = zoneUp; msg = '<b>Burunda ve boğazda tutulur.</b> 10 µm üstü tanecikler genellikle üst solunum yolunda kalır.'; col = 'var(--warn)'; }
    else if (u > 4) { z = zoneBr; msg = '<b>Bronşlara iner (PM10).</b> Göğüs boşluğuna ulaşabilen toz.'; col = 'var(--heat-ink)'; }
    else { z = zoneAl; msg = '<b>Alveollere ulaşır: solunabilir toz.</b> Taze kırılmış kristal silika burada silikoza yol açar.'; col = 'var(--oxy)'; }
    [zoneUp, zoneBr, zoneAl].forEach(e => { e.style.opacity = !z || e === z ? 1 : .35; e.style.filter = e === z ? 'saturate(2.4) brightness(.92)' : 'none'; });
    verdict.innerHTML = `<p style="border-left:3px solid ${col};padding-left:12px;margin:0">${msg}</p>`;
  };
  Sz.inp.addEventListener('input', upd); upd();
};
W.silicosis = el => {
  const box = H('div', { class: 'chart', style: 'margin-top:12px' }, null, el);
  responsive(box, Wd => {
    box.innerHTML = '';
    const rows = [['Akut', 0.2, 3, 'aylar–birkaç yıl'], ['Hızlanmış', 5, 10, '5–10 yıl'], ['Kronik', 10, 30, '10+ yıl']];
    const lab = 78, Hh = rows.length * 34 + 28, sx = v => lab + v / 30 * (Wd - lab - 10);
    const svg = S('svg', { viewBox: `0 0 ${Wd} ${Hh}`, width: Wd, height: Hh, role: 'img', 'aria-label': 'Silikoz türleri ve ortaya çıkış süreleri' }, box);
    [0, 10, 20, 30].forEach(t => { S('line', { x1: sx(t), x2: sx(t), y1: 0, y2: Hh - 22, class: 'ax' }, svg); S('text', { x: sx(t), y: Hh - 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px;fill:var(--ink-3)' }, svg).textContent = t + (t ? ' yıl' : ''); });
    rows.forEach(([n, a, b, l], i) => {
      const y = i * 34 + 8;
      S('text', { x: lab - 8, y: y + 13, 'text-anchor': 'end', class: 'lbl', style: 'font-size:13px' }, svg).textContent = n;
      S('path', { d: roundedBar(sx(a), y, sx(b) - sx(a), 18, 4, true), fill: i === 2 ? 'url(#fadeR)' : 'var(--oxy)', opacity: i === 2 ? 1 : .85 }, svg);
      S('text', { x: sx(b) + (i === 2 ? -6 : 6), y: y + 13, 'text-anchor': i === 2 ? 'end' : 'start', class: 'val', style: `font-size:12px${i === 2 ? ';fill:#fff' : ''}` }, svg).textContent = l;
    });
    const defs = S('defs', {}, svg); defs.innerHTML = '<linearGradient id="fadeR"><stop offset="0" stop-color="#E0262F"/><stop offset="1" stop-color="#E0262F" stop-opacity=".35"/></linearGradient>';
  });
};
W.limits = el => hbar(el, {
  data: [{ label: 'AB Direktifi 2017/2398', v: 100, note: 'Bağlayıcı; bazı üye ülkelerde daha düşük' }, { label: 'OSHA (2016)', v: 50, note: 'Eylem düzeyi 25 µg/m³' }, { label: 'NIOSH', v: 50, note: 'Tavsiye (10 saate kadar)' }, { label: 'MSHA (2024)', v: 50, note: 'Madenler için; eski sınır 100 µg/m³' }, { label: 'ACGIH', v: 25, note: 'TLV (tavsiye)' }],
  min: 0, max: 100, ticks: [0, 25, 50, 75, 100], unit: 'µg/m³', labW: 170, valW: 86, single: 1, accent: 'var(--si)', head: ['Kurum', 'µg/m³']
});
W.masks = el => {
  const rows = [['FFP2', 94, 6], ['FFP3', 99, 1], ['P100', 99.97, 0.03]];
  const list = H('div', { style: 'display:grid;gap:14px;margin-top:6px' }, null, el);
  rows.forEach(([n, f, p]) => {
    const r = H('div', { style: 'display:grid;grid-template-columns:56px minmax(0,1fr) minmax(150px,auto);gap:12px;align-items:center' }, null, list);
    H('b', { style: 'font-family:var(--display)' }, n, r);
    const track = H('div', { style: 'height:12px;border-radius:999px;background:var(--mist-2);overflow:hidden' }, null, r);
    H('i', { style: `display:block;height:100%;width:${Math.max(1.5, p / 6 * 100)}%;background:var(--oxy);border-radius:999px` }, null, track);
    H('span', { class: 'small', style: 'font-variant-numeric:tabular-nums' }, `≥%${nf(f, f % 1 ? 2 : 0)} süzer, ≤%${nf(p, p < 1 ? 2 : 0)} geçer`, r);
  });
  H('p', { class: 'note' }, 'Çubuk, maskeden geçebilen toz oranını gösterir (en uzun çubuk %6).', el);
};

/* ───────────── 11 Çevre ───────────── */
W.globe = el => {
  const fig = H('div', { style: 'position:relative;aspect-ratio:1/0.78;max-width:520px;margin:10px auto 0' }, null, el);
  const cv = H('canvas', { role: 'img', 'aria-label': 'Dünyayı ekvatordan saran kum duvarı (ölçekli değil)', style: 'width:100%;height:100%;display:block' }, null, fig);
  H('p', { class: 'note', style: 'text-align:center' }, 'Ölçekli değil: gerçekte 27 m\'lik duvar Dünya\'nın yanında görünmeyecek kadar incedir. Uzunluğu ~40.000 km.', el);
  const pts = []; const N = 1400;
  for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; pts.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
  let vis = false; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(fig);
  const loop = now => {
    requestAnimationFrame(loop); if (!vis) return;
    const r = fig.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2), w = r.width, h = r.height;
    if (cv.width !== Math.round(w * dpr)) { cv.width = w * dpr; cv.height = h * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.36, rot = REDUCED.matches ? 0.6 : now / 6000, tilt = 0.32;
    const ring = (front) => {
      g.save(); g.translate(cx, cy);
      const rx = R * 1.18, ry = R * 1.18 * Math.sin(tilt), hh = R * 0.07;
      g.beginPath();
      if (front) { g.ellipse(0, 0, rx, ry, 0, 0, Math.PI); g.ellipse(0, -hh, rx, ry, 0, Math.PI, 0, true); }
      else { g.ellipse(0, -hh, rx, ry, 0, Math.PI, Math.PI * 2); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI, true); }
      g.closePath(); g.fillStyle = front ? '#D9B676' : '#B48D4D'; g.fill(); g.restore();
    };
    ring(false);
    const sg = g.createRadialGradient(cx - R * .3, cy - R * .35, R * .1, cx, cy, R);
    sg.addColorStop(0, '#2F5D9B'); sg.addColorStop(1, '#0E2242'); g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    pts.forEach(([x, y, z]) => {
      const X = x * Math.cos(rot) + z * Math.sin(rot), Z = -x * Math.sin(rot) + z * Math.cos(rot);
      const Y = y * Math.cos(tilt) - Z * Math.sin(tilt), Z2 = y * Math.sin(tilt) + Z * Math.cos(tilt);
      if (Z2 < 0) return;
      const land = Math.sin(x * 4.1 + 1.3) * Math.cos(y * 3.3 - z * 2.2) > 0.32;
      g.fillStyle = land ? `rgba(226,198,144,${0.45 + Z2 * 0.55})` : `rgba(142,201,255,${0.15 + Z2 * 0.35})`;
      g.beginPath(); g.arc(cx + X * R, cy - Y * R, land ? 1.9 : 1.2, 0, 7); g.fill();
    });
    ring(true);
    g.fillStyle = '#5B4524'; g.font = '600 13px Poppins, sans-serif'; g.textAlign = 'center';
    g.fillText('27 m × 27 m kum duvarı', cx, Math.min(h - 6, cy + R + 22));
  };
  requestAnimationFrame(loop);
};
(() => {
  const el = $('#sandCounter'); if (!el) return;
  const t0 = performance.now();
  const tick = () => { el.textContent = nf(Math.floor((performance.now() - t0) / 1000 * 1585)); };
  setInterval(tick, 250); tick();
})();

/* ───────────── 12 Sayılar ───────────── */
W.kchart = el => hbar(el, {
  log: 1, min: 0.01, max: 1000, ticks: [0.01, 0.1, 1, 10, 100, 1000], tickFmt: t => nf(t, t < 1 ? (t < 0.1 ? 2 : 1) : 0), labW: 132, valW: 96,
  data: [{ label: 'Bakır', v: 400 }, { label: 'Paslanmaz çelik', v: 15 }, { label: 'Cam', v: 1, hi: 1 }, { label: 'Su', v: 0.6 }, { label: 'LI-900', v: 0.048, v2: 0.126, hi: 1 }, { label: 'Durgun hava', v: 0.026 }, { label: 'Silika aerojel', v: 0.015, hi: 1 }],
  fmt: v => v < 1 ? nf(v, 3).replace(/0+$/, '').replace(/,$/, '') : nf(v, v < 10 ? 1 : 0).replace(/,0$/, ''), unit: '', head: ['Malzeme', 'W/(m·K)'], legend: [['var(--oxy)', 'SiO₂ esaslı'], ['#9AA6BC', 'Diğer']], aria: 'Isıl iletkenlik karşılaştırması, logaritmik'
});
W.rhochart = el => hbar(el, {
  log: 1, min: 1, max: 10000, ticks: [1, 10, 100, 1000, 10000], tickFmt: t => t >= 1000 ? nf(t / 1000) + ' bin' : nf(t), labW: 112, valW: 70,
  data: [{ label: 'Çelik', v: 7800 }, { label: 'Alüminyum', v: 2700 }, { label: 'Kuvars', v: 2650, hi: 1 }, { label: 'Su', v: 1000 }, { label: 'LI-2200', v: 352, hi: 1 }, { label: 'LI-900', v: 144, hi: 1 }, { label: 'Aerojel', v: 20, hi: 1 }, { label: 'Hava', v: 1.2 }],
  fmt: v => nf(v, v < 10 ? 1 : 0), head: ['Malzeme', 'kg/m³'], legend: [['var(--oxy)', 'SiO₂ esaslı'], ['#9AA6BC', 'Diğer']], aria: 'Yoğunluk karşılaştırması, logaritmik'
});
