/* ───────────── Hero: live SiO₂ model ───────────── */
function initHero3D() {
  const box = $('#heroBox');
  const canvas = H('canvas', { 'aria-hidden': 'true' });
  box.prepend(canvas);
  const renderer = makeRenderer(canvas, { dprMax: 2 });
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  scene.environmentIntensity = 1.0;
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfd2ff, 0.9); rim.position.set(5, 2, -6); scene.add(rim);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const model = new AtomModel();
  const pivot = new THREE.Group(); pivot.add(model.group); scene.add(pivot);
  model.group.rotation.set(0.18, 0.5, 0);
  let W = 1, Hh = 1, camD = 20, camT = 20, visible = true;
  let yaw = 0.5, pitch = 0.18, vyaw = 0, vpitch = 0, lastUser = -1e9, dragging = false;
  const resize = () => {
    const r = box.getBoundingClientRect(); W = Math.max(1, r.width); Hh = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, W * Hh > 900000 ? 1.5 : 2));
    renderer.setSize(W, Hh, false); cam.aspect = W / Hh; cam.updateProjectionMatrix();
    camT = frameCamera(cam, model.radius[model.view], cam.aspect, 1.02);
  };
  resize(); camD = camT;
  new ResizeObserver(resize).observe(box);

  /* callouts */
  const host = $('#heroCallouts'); const callEls = new Map();
  const project = v => { const p = v.clone().applyMatrix4(model.group.matrixWorld).project(cam); return { x: (p.x * .5 + .5) * W, y: (-p.y * .5 + .5) * Hh, z: p.z }; };
  const updCallouts = () => {
    const list = model.t >= 0.85 && model.introK > 0.9 ? model.anchors() : [];
    const seen = new Set();
    list.forEach(a => {
      seen.add(a.id);
      let el = callEls.get(a.id);
      if (!el) { el = H('div', { class: 'callout is-off' }, `${a.t}<small>${a.s}</small>`, host); callEls.set(a.id, el); requestAnimationFrame(() => el.classList.remove('is-off')); }
      const pt = project(a.p.clone().add(V3(...a.off)));
      const hw = el.offsetWidth / 2 + 8, hh = el.offsetHeight / 2 + 6;
      el.style.transform = `translate(${clamp(pt.x, hw, W - hw)}px,${clamp(pt.y, hh + 34, Hh - hh - 10)}px) translate(-50%,-50%)`;
    });
    callEls.forEach((el, id) => { if (!seen.has(id)) { el.classList.add('is-off'); setTimeout(() => { if (el.classList.contains('is-off')) { el.remove(); callEls.delete(id); } }, 450); } });
  };

  /* pointer: drag to rotate, hover for atom info */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tip = $('#tip');
  const pick = (cx, cy) => {
    const r = box.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects([model.siMesh, model.oMesh], false).find(h => (h.object === model.siMesh ? model.cur.sSi : model.cur.sO)[h.instanceId] > 0.5);
    return hit ? { type: hit.object === model.siMesh ? 'Si' : 'O', i: hit.instanceId } : null;
  };
  const showTip = (h, x, y) => {
    if (!h) { tip.classList.remove('is-on'); return; }
    const n = model.neighbours(h.type, h.i);
    tip.innerHTML = h.type === 'O'
      ? `<b><span class="sw" style="background:#d81f2a"></span>O, oksijen</b>Atom numarası 8<br>1s² 2s² 2p⁴<br>Elektronegatiflik 3,44<br>Bu modelde ${n} silisyuma bağlı${n === 2 ? ' (köprü oksijen)' : ''}`
      : `<b><span class="sw" style="background:#2a3a63"></span>Si, silisyum</b>Atom numarası 14<br>[Ne] 3s² 3p²<br>Elektronegatiflik 1,90<br>Bu modelde ${n} oksijene bağlı`;
    tip.style.left = Math.min(x + 16, innerWidth - 280) + 'px'; tip.style.top = Math.max(8, y - 20) + 'px';
    tip.classList.add('is-on');
  };
  let px = 0, py = 0, downX = 0, downY = 0, hoverRaf = 0, tipTimer;
  box.addEventListener('pointerdown', e => {
    const h = pick(e.clientX, e.clientY);
    const r = box.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const inCore = Math.hypot(e.clientX - cx, e.clientY - cy) < Math.min(r.width, r.height) * 0.36;
    if (!h && !inCore) return;
    e.modelGrab = true; dragging = true; px = downX = e.clientX; py = downY = e.clientY; lastUser = performance.now();
    box.setPointerCapture(e.pointerId); hero.touch();
  });
  box.addEventListener('pointermove', e => {
    if (dragging) {
      const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
      vyaw = dx * 0.0085; vpitch = dy * 0.006; yaw += vyaw; pitch = clamp(pitch + vpitch, -1.2, 1.2); lastUser = performance.now(); hero.touch();
      return;
    }
    if (e.pointerType !== 'mouse') return;
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => { hoverRaf = 0; const h = pick(e.clientX, e.clientY); model.hover = h || { type: null, i: -1 }; model.dirty = true; box.style.cursor = h ? 'pointer' : ''; showTip(h, e.clientX, e.clientY); if (h) hero.touch(); });
  });
  box.addEventListener('pointerleave', () => { if (!dragging) { model.hover = { type: null, i: -1 }; model.dirty = true; tip.classList.remove('is-on'); } });
  const end = e => {
    if (!dragging) return; dragging = false;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) {
      const h = pick(e.clientX, e.clientY);
      model.hover = h || { type: null, i: -1 }; model.dirty = true; showTip(h, e.clientX, e.clientY);
      clearTimeout(tipTimer); tipTimer = setTimeout(() => { tip.classList.remove('is-on'); model.hover = { type: null, i: -1 }; model.dirty = true; }, 2600);
    }
  };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);

  /* loop */
  let last = performance.now(), spin = 0;
  const loop = now => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible) return;
    if (!dragging) {
      vyaw *= Math.pow(0.04, dt); vpitch *= Math.pow(0.04, dt);
      yaw += vyaw; pitch = clamp(pitch + vpitch, -1.2, 1.2);
      if (now - lastUser > 2500 && !REDUCED.matches) { yaw += dt * 0.16; pitch += (0.18 - pitch) * dt * 0.6; }
    }
    if (spin) { const s = spin * dt * 3.2; yaw += s; spin -= s; if (Math.abs(spin) < 0.002) spin = 0; }
    model.group.rotation.set(pitch, yaw, 0);
    camT = frameCamera(cam, model.radius[model.view], cam.aspect, 1.1);
    camD += (camT - camD) * Math.min(1, dt * 3.2);
    cam.position.set(0, 0, camD); cam.lookAt(0, 0, 0);
    model.update(now);
    model.group.updateMatrixWorld(true);
    renderer.render(scene, cam);
    updCallouts();
  };
  requestAnimationFrame(loop);

  H3.hero = {
    morph(to, dir) { model.morph(to); spin += dir * 0.9; },
    resize, intro() { model.introK = 0; model.introStart = 0; model.dirty = true; },
    setVisible(v) { visible = v; },
    get dragging() { return dragging; },
    get model() { return model; }
  };
}
