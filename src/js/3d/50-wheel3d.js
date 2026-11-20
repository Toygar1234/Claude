/* ───────────── STRIDE arc: all products on one fan-shaped wheel ───────────── */
function initWheel3D() {
  const canvas = $('#wheelGL');
  const renderer = makeRenderer(canvas, { dprMax: 1.5 });
  renderer.transmissionResolutionScale = 0.6;
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer, 0.15);
  const key = new THREE.DirectionalLight(0xfff3e0, 1.6); key.position.set(-5, 7, 8); scene.add(key);
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
  transBackdrop(scene, '#f0dcae', '#8a6630');
  const shadowTex = canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(70,40,5,.42)'); gr.addColorStop(.55, 'rgba(70,40,5,.16)'); gr.addColorStop(1, 'rgba(70,40,5,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const items = PRODUCTS.map((p, i) => {
    const prod = buildProduct(p.model);
    const holder = new THREE.Group(), spin = new THREE.Group();
    spin.add(prod.root); holder.add(spin);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.8), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    sh.position.set(0.28, -0.32, -1.4); holder.add(sh);
    scene.add(holder);
    return { p, prod, holder, spin, sh, lift: 0, hov: 0 };
  });
  const N = items.length;
  let cur = 0, target = 0, vel = 0, visible = false, W = 1, Hh = 1, mobile = false, lastActive = -1;
  const resize = () => {
    const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); Hh = Math.max(1, r.height);
    mobile = W < 820 || Hh > W;
    renderer.setSize(W, Hh, false); cam.aspect = W / Hh; cam.updateProjectionMatrix();
  };
  resize(); new ResizeObserver(resize).observe(canvas);
  const wrapD = d => { d = ((d % N) + N) % N; return d > N / 2 ? d - N : d; };
  const step = (dt, now) => {
    if (!dragging) { const d = target - cur; vel += d * 26 * dt; vel *= Math.pow(0.0009, dt); cur += vel * dt; if (Math.abs(d) < 0.0005 && Math.abs(vel) < 0.001) { cur = target; vel = 0; } }
    const camZ = mobile ? 15.5 / Math.max(0.55, cam.aspect * 1.25) : 13.6;
    cam.position.set(0, mobile ? 0.9 : 0.7, camZ); cam.lookAt(0, mobile ? 0.25 : 0.32, 0);
    const D = mobile ? 0.34 : 0.215, Rw = 9.6;
    items.forEach((it, i) => {
      const d = wrapD(i - cur), th = d * D;
      const center = 1 - smooth(0, 1, Math.abs(d));
      const s = (mobile ? 1.0 : 0.82) + center * (mobile ? 0.35 : 0.45) + it.hov * 0.05;
      it.holder.visible = Math.abs(d) < (mobile ? 2.6 : 4.6);
      it.holder.position.set(Rw * Math.sin(th), Rw * (Math.cos(th) - 1) + center * 0.35 + it.hov * 0.12 + (mobile ? 0.25 : 0.1), -(1 - Math.cos(th)) * 3.2);
      it.holder.rotation.set(0, -th * 0.35, -th * 0.95);
      it.holder.scale.setScalar(s);
      it.spin.rotation.y = REDUCED.matches ? 0.35 : (now / 1000) * (0.22 + center * 0.25) + i * 1.3;
      it.prod.update(now / 1000, dt);
    });
    const active = ((Math.round(cur) % N) + N) % N;
    if (active !== lastActive) { lastActive = active; setWheelIndex(active); }
  };
  /* pointer: drag spins, click focuses/opens */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let dragging = false, sx = 0, sCur = 0, moved = 0, lastX = 0, lastT = 0;
  const hitItem = (x, y) => {
    const r = canvas.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    const hits = ray.intersectObjects(items.filter(i => i.holder.visible).map(i => i.spin), true);
    if (!hits.length) return -1; let o = hits[0].object; while (o && !items.some(i => i.spin === o)) o = o.parent; return items.findIndex(i => i.spin === o);
  };
  const pxPerItem = () => (mobile ? W * 0.42 : W * 0.135);
  canvas.addEventListener('pointerdown', e => { dragging = true; sx = lastX = e.clientX; sCur = cur; moved = 0; lastT = performance.now(); vel = 0; canvas.setPointerCapture(e.pointerId); wheelLastAct = performance.now(); });
  canvas.addEventListener('pointermove', e => {
    if (dragging) {
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) { cur = sCur - dx / pxPerItem(); const now = performance.now(); vel = -(e.clientX - lastX) / pxPerItem() / Math.max(0.008, (now - lastT) / 1000); lastX = e.clientX; lastT = now; }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const h = hitItem(e.clientX, e.clientY); items.forEach((it, i) => it.hovT = i === h ? 1 : 0); canvas.style.cursor = h >= 0 ? 'pointer' : '';
  });
  const up = e => {
    if (!dragging) return; dragging = false; wheelLastAct = performance.now();
    if (moved <= 4) {
      const h = hitItem(e.clientX, e.clientY);
      if (h >= 0) { const d = wrapD(h - cur); if (Math.abs(d) < 0.5) { openFromWheel(); } else { target = cur + d; target = Math.round(target); } }
      return;
    }
    target = Math.round(cur + clamp(vel * 0.25, -2, 2));
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => items.forEach(it => it.hovT = 0));
  let last = performance.now();
  const loop = now => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || detailOpen()) return;
    TIME.value = now / 1000;
    items.forEach(it => it.hov = damp(it.hov, it.hovT || 0, 10, dt));
    step(dt, now);
    renderer.render(scene, cam);
  };
  requestAnimationFrame(loop);
  H3.wheel = {
    step(d) { target = Math.round(target) + d; },
    goto(i) { target = Math.round(cur) + wrapD(i - cur); },
    setVisible(v) { visible = v; },
    anchor() { const it = items[((Math.round(cur) % N) + N) % N]; const v = new THREE.Vector3(); it.holder.getWorldPosition(v); v.project(cam); const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x * .5 + .5) * r.width, y: r.top + (-v.y * .5 + .5) * r.height }; }
  };
}
