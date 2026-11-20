/* ───────────── Detail overlay: one live canvas that moves between Blendy slides ───────────── */
function initDetail3D() {
  let renderer, canvas, env, cam, running = false, cur = -1, W = 1, Hh = 1;
  const scenes = [];
  const ensure = () => {
    if (renderer) return;
    canvas = H('canvas', { 'aria-hidden': 'true' });
    renderer = makeRenderer(canvas, { dprMax: 2 });
    renderer.transmissionResolutionScale = 0.8;
    env = studioEnv(renderer);
    cam = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    requestAnimationFrame(loop);
  };
  const build = i => {
    if (scenes[i]) return scenes[i];
    const p = PRODUCTS[i];
    const scene = new THREE.Scene(); scene.environment = env;
    const key = new THREE.DirectionalLight(0xffffff, p.dark ? 1.1 : 1.5); key.position.set(-4, 6, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(p.dark ? 0x9fc4ff : 0xffffff, p.dark ? 1.6 : 0.6); rim.position.set(5, 2, -5); scene.add(rim);
    const bd = transBackdrop(scene); const bgc = new THREE.Color(p.bg); bd.setColors('#' + bgc.clone().lerp(new THREE.Color('#ffffff'), 0.08).getHexString(), '#' + bgc.clone().multiplyScalar(0.7).getHexString());
    const prod = buildProduct(p.model);
    const pivot = new THREE.Group(); pivot.add(prod.root); scene.add(pivot);
    const sph = new THREE.Box3().setFromObject(pivot).getBoundingSphere(new THREE.Sphere());
    const S0 = { scene, prod, pivot, radius: sph.radius * (p.model === 'tile' ? 1.32 : 1.0), center: sph.center.clone(), yaw: 0.35, pitch: 0.12, vy: 0, vp: 0, lastUser: -1e9, labels: [] };
    scenes[i] = S0; return S0;
  };
  const sizeTo = host => {
    const r = host.getBoundingClientRect(); W = Math.max(1, r.width); Hh = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, W * Hh > 1000000 ? 1.5 : 2));
    renderer.setSize(W, Hh, false); cam.aspect = W / Hh; cam.updateProjectionMatrix();
  };
  let hostEl = null, labelHost = null;
  const attach = (i, slide) => {
    const S0 = build(i);
    hostEl = $('.d-model', slide); labelHost = $('.d-labels', hostEl);
    hostEl.insertBefore(canvas, hostEl.firstChild);
    const snap = $('.snap', hostEl); snap.style.display = 'none';
    sizeTo(hostEl); cur = i;
    labelHost.innerHTML = ''; S0.labels = S0.prod.labels.map(l => ({ ...l, el: H('div', { class: 'd-label is-off' }, l.text, labelHost) }));
    wireGrab(slide, S0);
  };
  const wireGrab = (slide, S0) => {
    const grab = $('.grab', slide); if (grab._wired) { grab._S = S0; return; } grab._wired = true; grab._S = S0;
    let on = false, px = 0, py = 0;
    grab.addEventListener('pointerdown', e => { e.modelGrab = true; on = true; px = e.clientX; py = e.clientY; grab.setPointerCapture(e.pointerId); detail.touch(); });
    grab.addEventListener('pointermove', e => { if (!on) return; const S = grab._S; const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY; S.vy = dx * 0.009; S.vp = dy * 0.006; S.yaw += S.vy; S.pitch = clamp(S.pitch + S.vp, -0.9, 0.9); S.lastUser = performance.now(); });
    const end = () => { on = false; }; grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
  };
  const render = (S0, now, dt) => {
    if (now - S0.lastUser > 2200 && !REDUCED.matches) { S0.yaw += dt * 0.28; S0.pitch += (0.12 - S0.pitch) * dt; }
    else { S0.vy *= Math.pow(0.05, dt); S0.vp *= Math.pow(0.05, dt); S0.yaw += S0.vy; S0.pitch = clamp(S0.pitch + S0.vp, -0.9, 0.9); }
    S0.pivot.rotation.set(S0.pitch, S0.yaw, 0);
    S0.prod.update(now / 1000, dt);
    const d = frameCamera(cam, S0.radius, cam.aspect, 1.0);
    cam.position.set(S0.center.x, S0.center.y + d * 0.06, S0.center.z + d); cam.lookAt(S0.center);
    renderer.render(S0.scene, cam);
    const v = new THREE.Vector3();
    S0.labels.forEach(l => {
      const show = l.show(); l.el.classList.toggle('is-off', !show); if (!show) return;
      l.obj.updateMatrixWorld(); v.copy(l.off); l.obj.localToWorld(v); v.project(cam);
      l.el.style.transform = `translate(${(v.x * .5 + .5) * W}px, ${(-v.y * .5 + .5) * Hh}px) translate(0,-50%)`;
    });
  };
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!running || cur < 0) return;
    TIME.value = now / 1000;
    render(scenes[cur], now, dt);
  }
  addEventListener('resize', () => { if (running && hostEl) sizeTo(hostEl); });
  H3.detail = {
    show(i, slide) { ensure(); attach(i, slide); running = true; },
    hide() { running = false; },
    transition(from, to, A, B) {
      if (!renderer) return;
      // freeze the outgoing model into slide A, then move the live canvas to slide B
      const S0 = scenes[from];
      if (S0) render(S0, performance.now(), 0);
      const snap = $('.snap', A);
      const dpr = renderer.getPixelRatio();
      snap.width = Math.round(W * dpr); snap.height = Math.round(Hh * dpr);
      snap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      snap.getContext('2d').drawImage(canvas, 0, 0, snap.width, snap.height);
      attach(to, B);
    },
    toggles(i) { const S0 = scenes[i] || build(i); return S0.prod.toggles; }
  };
}
