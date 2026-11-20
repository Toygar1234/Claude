/* ───────────── Hero (white Blendy slider) ───────────── */
const heroEl = $('#hero');
const heroTabs = $$('#heroTabs .tab');
const tabsHost = $('#tabs');
const tabLine = $('#tabLine');
const secTabset = $('#secTabs');
const heroTabset = $('#heroTabs');
let heroVisible = true;

const HERO_MOBILE = [
  { t: 'Silisyum dioksit', s: 'Ortada 1 silisyum, köşelerde 4 oksijen.', row: ['60,08 g/mol', '1,61 Å', '109,5°'] },
  { t: 'Kuvars: düzenli kristal', s: 'Dörtyüzlüler sarmal zincirler kurar.', row: ['2,65 g/cm³', 'Mohs 7', '573 °C'] },
  { t: 'Cam: düzensiz ağ', s: 'Aynı yapı taşları, düzen yok.', row: ['2,20 g/cm³', 'n ≈ 1,46', '0,55×10⁻⁶/K'] },
  { t: 'Stişovit: basınç altında', s: 'Her silisyum 6 oksijene bağlı.', row: ['~4,3 g/cm³', '6 komşu', '8–10 GPa'] }
];
function heroMobileInfo(i) {
  const d = HERO_MOBILE[i]; const el = $('#heroMob'); if (!el) return;
  el.innerHTML = `<b>${d.t}</b>${d.s}<div class="row">${d.row.map(x => `<span>${x}</span>`).join('')}</div>`;
}

const hero = new Blendy($('#heroStage'), {
  unitHost: heroEl,
  autoplay: true,
  isActive: () => heroVisible && !detailOpen() && !(H3.hero && H3.hero.dragging),
  onStart: (from, to, dir) => {
    heroTabs.forEach((t, i) => t.setAttribute('aria-current', i === to ? 'true' : 'false'));
    if (heroTabset.getAttribute('aria-hidden') !== 'true') placeLine(tabLine, heroTabs[to], tabsHost);
    H3.hero?.morph(to, dir);
    heroMobileInfo(to);
  },
  onLayout: U => { H3.hero?.resize(); }
});
heroMobileInfo(0);
heroTabs.forEach((t, i) => t.addEventListener('click', () => hero.to(i, true)));
$('#heroPrev').addEventListener('click', () => hero.prev(true));
$('#heroNext').addEventListener('click', () => hero.next(true));
attachSwipe(heroEl, d => { hero.touch(); d > 0 ? hero.next() : hero.prev(); });
new IntersectionObserver(es => es.forEach(e => { heroVisible = e.intersectionRatio > 0.45; H3.hero?.setVisible(e.isIntersecting); }), { threshold: [0, 0.45, 0.6] }).observe(heroEl);

/* opening sequence */
let opened = false;
async function heroOpening() {
  if (opened) return; opened = true;
  try { await document.fonts.ready; } catch (e) { }
  hero.layout();
  if (!tabsSwapped) placeLine(tabLine, heroTabs[hero.cur], tabsHost);
  if (REDUCED.matches) { $$('.pre').forEach(e => e.classList.remove('pre')); return; }
  hero.intro([[$('#heroModel .bl-frame'), FACTORS.bottle]]);
  H3.hero?.intro();
  riseIn([[$('.logo', $('#topbar')), 250], [tabsHost, 330], [$('.acct', $('#topbar')), 410], [$('#heroPrev'), 490], [$('#heroCta'), 570], [$('#heroNext'), 650]]);
}
setTimeout(() => { $$('.pre').forEach(e => e.classList.remove('pre')); }, 3000); // failsafe

/* ───────────── Top bar: solid state, tab swap, scrollspy, progress ───────────── */
const topbar = $('#topbar');
let tabsSwapped = false;
const secTabsEls = $$('#secTabs .tab');
let activeGroup = 'giris';
function setGroup(g) {
  activeGroup = g;
  secTabsEls.forEach(t => t.setAttribute('aria-current', t.dataset.group === g ? 'true' : 'false'));
  const at = secTabsEls.find(t => t.dataset.group === g);
  if (at && secTabset.scrollWidth > secTabset.clientWidth) secTabset.scrollTo({ left: at.offsetLeft - secTabset.clientWidth / 2 + at.offsetWidth / 2, behavior: REDUCED.matches ? 'auto' : 'smooth' });
  if (tabsSwapped) placeLine(tabLine, at, tabsHost);
}
function onScroll() {
  const y = scrollY;
  topbar.classList.toggle('is-solid', y > 8);
  const swap = y > heroEl.offsetHeight * 0.55;
  if (swap !== tabsSwapped) {
    tabsSwapped = swap; topbar.classList.toggle('is-swapped', swap);
    heroTabset.setAttribute('aria-hidden', swap ? 'true' : 'false');
    secTabset.setAttribute('aria-hidden', swap ? 'false' : 'true');
    if (swap) { const t = secTabsEls.find(t => t.dataset.group === activeGroup); t ? placeLine(tabLine, t, tabsHost) : (tabLine.style.width = '0'); }
    else placeLine(tabLine, heroTabs[hero.cur], tabsHost);
  }
  const max = document.documentElement.scrollHeight - innerHeight;
  $('#progress').style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
}
addEventListener('scroll', onScroll, { passive: true });
const spy = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) setGroup(e.target.dataset.group); });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[data-group]').forEach(s => spy.observe(s));

let rT;
addEventListener('resize', () => {
  clearTimeout(rT);
  rT = setTimeout(() => {
    hero.layout();
    placeLine(tabLine, tabsSwapped ? secTabsEls.find(t => t.dataset.group === activeGroup) : heroTabs[hero.cur], tabsHost);
    if (detailOpen()) detail.layout();
    onScroll();
  }, 120);
});

/* keyboard: arrows drive whichever slider is on screen */
addEventListener('keydown', e => {
  if (e.key === 'Escape' && detailOpen()) { closeDetail(); return; }
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable || t.closest?.('.tl__track'))) return;
  const d = e.key === 'ArrowRight' ? 1 : -1;
  if (detailOpen()) { detail.touch(); d > 0 ? detail.next() : detail.prev(); return; }
  if (heroVisible) { hero.touch(); d > 0 ? hero.next() : hero.prev(); return; }
  if (wheelVisible) { wheelStep(d, true); }
});
