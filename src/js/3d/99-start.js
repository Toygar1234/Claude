/* ───────────── 3D start-up order ───────────── */
async function start3D() {
  try { await Promise.all(['800 80px Poppins', '700 40px Poppins', '600 30px Poppins', '400 18px "IBM Plex Sans"'].map(f => document.fonts.load(f))); } catch (e) { }
  initHero3D();
  initDetail3D();
  H3.ready = true;
  if (detailOpen()) { H3.detail.show(detail.cur, detail.slides[detail.cur]); renderToggles(detail.cur); }
  await bakePieces(['atomO', 'atomSi', 'tetraMini']);
  heroReadyResolve();
  await bakePieces(['quartzPoint', 'amethyst', 'quartzCluster', 'glassMarble', 'glassShard', 'glassDrop', 'meteorite', 'impactRock', 'stishCrystal']);
  // the arc builds nine models; do it when the visitor heads that way (or when the page is idle)
  let wheelBuilt = false;
  const buildWheel = async () => {
    if (wheelBuilt) return; wheelBuilt = true;
    initWheel3D();
    H3.wheel.setVisible(wheelVisible || wheelEl.getBoundingClientRect().top < innerHeight);
    const rest = new Set(); PRODUCTS.forEach(p => p.pieces.split(',').forEach(id => rest.add(id))); FLOATS.forEach(f => rest.add(f[0]));
    await bakePieces([...rest]);
  };
  H3.needProducts = buildWheel;
  if (detailOpen()) buildWheel();
  new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); buildWheel(); } }, { rootMargin: '900px 0px' }).observe(wheelEl);
  setTimeout(buildWheel, 3500);
  document.addEventListener('click', e => { if (e.target.closest('[data-open-product]')) buildWheel(); }, true);
}
