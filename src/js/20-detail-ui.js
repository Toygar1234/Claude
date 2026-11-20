/* ───────────── Products (read from #productData) ───────────── */
const PRODUCTS = $$('#productData > article').map((a, i) => ({
  i, el: a, id: a.dataset.id, word: a.dataset.word, cat: a.dataset.cat, key: a.dataset.key,
  bg: a.dataset.bg, sheet: a.dataset.sheet, ink: a.dataset.ink, dark: a.dataset.dark === '1',
  wordColor: a.dataset.wordColor || '', pieces: a.dataset.pieces, section: a.dataset.section, model: a.dataset.model,
  title: $('h3', a).textContent, lead: $('.d-lead', a).textContent,
  stats: $$('dl > div', a).map(d => ({ dt: $('dt', d).textContent, dd: $('dd', d).textContent })),
  body: $('.sheet-body', a)
}));
const productById = id => PRODUCTS.find(p => p.id === id);

/* ───────────── Detail overlay (Blendy slider, colour follows the product) ───────────── */
const detailEl = $('#detail'), dStage = $('#dStage'), dScroll = $('#dScroll'), veil = $('#veil');
const dTabsEl = $('#dTabs'), dLine = $('#dLine'), dToggles = $('#dToggles');
const shadowFor = p => p.dark ? 'none' : '0 1px 6px rgba(90,70,40,.18)';
PRODUCTS.forEach((p, i) => {
  const s = H('section', { class: 'bl-slide' + (i === 0 ? ' is-current' : ''), 'data-word': p.word, 'data-layout': String(i % 4), 'data-pieces': p.pieces, 'aria-label': p.title });
  s.style.setProperty('--bl-bg', p.bg);
  s.style.setProperty('--bl-shadow', p.dark ? 'rgba(0,0,0,.55)' : 'rgba(60,40,80,.22)');
  s.style.setProperty('--d-ui', '#fff');
  s.style.setProperty('--d-shadow', shadowFor(p));
  s.style.setProperty('--d-ink', p.dark ? '#ffffff' : p.ink);
  let wordStyle = '';
  if (p.wordColor === 'heat') wordStyle = 'background:linear-gradient(180deg,#FFB067 0%,#FF6B1A 55%,#C2410C 100%);-webkit-background-clip:text;background-clip:text;color:transparent;opacity:.62';
  else if (p.wordColor) wordStyle = `color:${p.wordColor};opacity:.22`;
  else if (p.id === 'cip') wordStyle = 'background:linear-gradient(100deg,#8CF1FF,#B9A7FF 35%,#FF9BD2 60%,#FFE38A 85%);-webkit-background-clip:text;background-clip:text;color:transparent;opacity:.4';
  const wordHTML = p.word.replace(/\|(.*)$/, '<span class="sub">$1</span>');
  s.innerHTML = `<div class="bl-frame">
    <div class="bl-layer L-word"><div class="bl-word" style="${wordStyle}">${wordHTML}</div></div>
    <div class="bl-layer L-shadow"></div>
    <div class="bl-layer L-bottle"><div class="d-model"><canvas class="snap" aria-hidden="true"></canvas><div class="d-labels"></div><div class="grab" role="img" aria-label="${p.title}: döndürülebilir 3B model"></div></div></div>
    <div class="bl-layer L-fruit"></div>
    <div class="bl-layer L-corner"></div>
    <div class="bl-layer L-text">
      <div class="d-info"><div class="kicker">${p.cat}</div><h2>${p.title}</h2><p>${p.lead}</p></div>
      <dl class="d-stats">${p.stats.map(x => `<div><dt>${x.dt}</dt><dd>${x.dd}</dd></div>`).join('')}</dl>
    </div></div>`;
  dStage.appendChild(s);
  const b = H('button', { class: 'tab', type: 'button', 'aria-current': i === 0 ? 'true' : 'false' }, p.word.replace('|', ''), dTabsEl);
  b.addEventListener('click', () => { detail.to(i, true); });
  p.body.hidden = true;
  $('#dSheetIn').appendChild(p.body);
});
const dTabs = $$('.tab', dTabsEl);
const mountedBodies = new Set();
function showSheet(i) {
  PRODUCTS.forEach((p, n) => p.body.hidden = n !== i);
  const p = PRODUCTS[i];
  if (!mountedBodies.has(i)) { mountedBodies.add(i); mountWidgets(p.body); }
  const sheet = $('#dSheet');
  sheet.style.setProperty('--d-sheet', p.sheet);
  sheet.style.setProperty('--d-sheet-ink', p.ink);
  sheet.style.background = p.sheet; sheet.style.color = p.ink;
  sheet.classList.toggle('is-dark', p.dark);
  if (p.dark) { sheet.style.setProperty('--ink', '#F4F6FA'); sheet.style.setProperty('--ink-2', '#C7D0E2'); sheet.style.setProperty('--ink-3', '#9AA7C2'); sheet.style.setProperty('--mist', 'rgba(255,255,255,.06)'); sheet.style.setProperty('--mist-2', 'rgba(255,255,255,.12)'); sheet.style.setProperty('--line', 'rgba(255,255,255,.14)'); sheet.style.setProperty('--line-2', 'rgba(255,255,255,.24)'); sheet.style.setProperty('--paper', p.sheet); }
  else ['--ink', '--ink-2', '--ink-3', '--mist', '--mist-2', '--line', '--line-2', '--paper'].forEach(k => sheet.style.removeProperty(k));
  const more = $('#dMore') || H('p', { id: 'dMore', style: 'margin-top:28px' }, '', $('#dSheetIn'));
  more.innerHTML = `<a class="btn" href="${p.section}" data-close-detail>Bu konunun bölümüne git</a>`;
  detailEl.style.setProperty('--d-bg', p.bg);
  dScroll.style.background = p.bg;
  $('#dMob').innerHTML = `<b>${p.title}</b><span>${p.key}</span>`;
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = p.bg;
}
function renderToggles(i) {
  dToggles.innerHTML = '';
  const t = H3.detail?.toggles?.(i) || [];
  t.forEach(tg => {
    const b = H('button', { type: 'button', 'aria-pressed': tg.on ? 'true' : 'false' }, tg.label, dToggles);
    b.addEventListener('click', () => { tg.on = !tg.on; tg.set(tg.on); b.setAttribute('aria-pressed', tg.on ? 'true' : 'false'); });
  });
}

const detail = new Blendy(dStage, {
  unitHost: $('.detail__hero'),
  onStart: (from, to, dir, A, B) => {
    dTabs.forEach((t, i) => t.setAttribute('aria-current', i === to ? 'true' : 'false'));
    placeLine(dLine, dTabs[to], dTabsEl.parentElement);
    H3.detail?.transition(from, to, A, B);
    dToggles.innerHTML = '';
  },
  onEnd: (from, to) => { showSheet(to); renderToggles(to); }
});
$('#dPrev').addEventListener('click', () => detail.prev(true));
$('#dNext').addEventListener('click', () => detail.next(true));
attachSwipe($('.detail__hero'), d => { detail.touch(); d > 0 ? detail.next() : detail.prev(); });
document.fonts?.ready?.then(() => detail.layout());
const dTop = $('.d-top', detailEl);
dScroll.addEventListener('scroll', () => dTop.classList.toggle('is-solid', dScroll.scrollTop > innerHeight * 0.6), { passive: true });
const dGo = i => { if (i !== detail.cur) detail.to(i, true); };

let _dOpen = false, lastFocus = null, openOrigin = { x: innerWidth / 2, y: innerHeight / 2 };
function detailOpen() { return _dOpen; }
async function openDetail(i, origin) {
  if (_dOpen) { dGo(i); return; }
  _dOpen = true; lastFocus = document.activeElement;
  H3.needProducts?.();
  openOrigin = origin || { x: innerWidth / 2, y: innerHeight / 2 };
  const p = PRODUCTS[i];
  // jump without animation to the product
  if (detail.cur !== i) {
    detail.slides[detail.cur].classList.remove('is-current'); detail.slides[i].classList.add('is-current'); detail.cur = i;
  }
  dTabs.forEach((t, n) => t.setAttribute('aria-current', n === i ? 'true' : 'false'));
  showSheet(i);
  veil.style.background = p.bg;
  const R = Math.hypot(Math.max(openOrigin.x, innerWidth - openOrigin.x), Math.max(openOrigin.y, innerHeight - openOrigin.y));
  document.documentElement.style.overflow = 'hidden';
  if (!REDUCED.matches) {
    await veil.animate([{ clipPath: `circle(0px at ${openOrigin.x}px ${openOrigin.y}px)` }, { clipPath: `circle(${R}px at ${openOrigin.x}px ${openOrigin.y}px)` }], { duration: 620, easing: 'cubic-bezier(0.65,0,0.35,1)', fill: 'forwards' }).finished;
  }
  detailEl.classList.add('is-open'); detailEl.setAttribute('aria-hidden', 'false');
  dScroll.scrollTop = 0;
  detail.layout();
  placeLine(dLine, dTabs[i], dTabsEl.parentElement);
  H3.detail?.show(i, detail.slides[i]);
  renderToggles(i);
  veil.getAnimations().forEach(a => a.cancel());
  if (!REDUCED.matches) {
    detail.intro();
    riseIn([[$('.logo', detailEl), 250], [$('.tabs', detailEl), 330], [$('.acct', detailEl), 410], [$('#dPrev'), 490], [$('#dCta'), 570], [$('#dNext'), 650]]);
  }
  $('#dClose').focus({ preventScroll: true });
}
async function closeDetail(after) {
  if (!_dOpen) return;
  const p = PRODUCTS[detail.cur];
  veil.style.background = p.bg;
  const o = H3.wheel?.anchor?.() || openOrigin;
  const R = Math.hypot(Math.max(o.x, innerWidth - o.x), Math.max(o.y, innerHeight - o.y));
  H3.detail?.hide();
  detailEl.classList.remove('is-open'); detailEl.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = '#ffffff';
  _dOpen = false;
  if (typeof after === 'function') after();
  if (!REDUCED.matches) {
    await veil.animate([{ clipPath: `circle(${R}px at ${o.x}px ${o.y}px)` }, { clipPath: `circle(0px at ${o.x}px ${o.y}px)` }], { duration: 560, easing: 'cubic-bezier(0.65,0,0.35,1)' }).finished;
  }
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}
$('#dClose').addEventListener('click', () => closeDetail());
$('#dLogo').addEventListener('click', () => closeDetail());
$('#dCta').addEventListener('click', e => { e.preventDefault(); dScroll.scrollTo({ top: innerHeight * 0.92, behavior: REDUCED.matches ? 'auto' : 'smooth' }); });
detailEl.addEventListener('click', e => {
  const a = e.target.closest('[data-close-detail]'); if (!a) return;
  e.preventDefault(); const href = a.getAttribute('href');
  closeDetail(() => { const t = $(href); if (t) t.scrollIntoView({ behavior: 'auto' }); });
});
/* focus trap */
detailEl.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const f = $$('a[href],button:not([disabled]),input,[tabindex="0"]', detailEl).filter(x => x.offsetParent !== null && !x.closest('[hidden]'));
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-open-product]'); if (!b) return;
  const p = productById(b.dataset.openProduct); if (!p) return;
  const r = b.getBoundingClientRect();
  openDetail(p.i, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
});
