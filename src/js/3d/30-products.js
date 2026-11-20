/* ───────────── Product models (procedural) ───────────── */
const TIME = { value: 0 };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

/* 1. Kuvars: crystal cluster on a sandstone matrix */
function buildQuartzProduct() {
  const g = new THREE.Group();
  const rock = new THREE.Mesh(rockGeo(5, { detail: 5, amp: 0.2, freq: 1.3, scale: [1.3, 0.5, 1.0] }), MAT.rock('#c6a676', 0.9));
  rock.position.y = -0.55; g.add(rock);
  const clear = crystalMat('#eef4ff', 2.6), smoky = crystalMat('#a88e70', 1.2, { color: '#fff6ec' }), milky = crystalMat('#ffffff', 1.6, { roughness: 1, color: '#f4f6ff' });
  const specs = [[0.27, 1.6, 0.52, 0, 0, 0.04, 0.02, 0.2, clear], [0.2, 1.15, 0.42, -0.45, 0.12, 0.08, 0.45, 1.2, clear], [0.19, 1.0, 0.38, 0.47, -0.04, -0.06, -0.47, 2.1, smoky],
    [0.15, 0.82, 0.3, 0.14, 0.4, 0.5, -0.1, 0.4, clear], [0.13, 0.62, 0.26, -0.2, -0.38, -0.55, 0.25, 3.0, milky], [0.11, 0.52, 0.22, 0.66, 0.3, 0.32, -0.8, 1.0, clear], [0.12, 0.56, 0.24, -0.74, -0.15, -0.2, 0.9, 2.6, smoky]];
  specs.forEach((s, i) => { const c = crystalMesh({ r: s[0], h: s[1], tip: s[2], seed: 100 + i * 13 }, s[8]); c.position.set(s[3], -0.42, s[4]); c.rotation.set(s[5], s[7], s[6]); g.add(c); });
  const grain = rockGeo(8, { detail: 2, amp: 0.22 }), R = rng(9), N = 90;
  const inst = new THREE.InstancedMesh(grain, MAT.rock('#ffffff', 0.85), N); const m = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = 0; i < N; i++) { const a = R() * 6.28, r = 0.95 + R() * 0.55, s = 0.025 + R() * 0.045; m.compose(V3(Math.cos(a) * r * 1.05, -0.78 + R() * 0.06, Math.sin(a) * r * 0.75), new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * 6, R() * 6, 0)), V3(s, s * 0.8, s)); inst.setMatrixAt(i, m); inst.setColorAt(i, col.setHSL(0.09 + R() * 0.03, 0.45, 0.55 + R() * 0.2)); }
  g.add(inst);
  return { root: normalize(g, 2, 2.3) };
}

/* 2. Cam: ince belli çay bardağı, tabak, kaşık */
function buildTeaProduct() {
  const g = new THREE.Group();
  const outer = [[0, 0], [0.19, 0], [0.207, 0.014], [0.222, 0.06], [0.246, 0.14], [0.256, 0.22], [0.242, 0.3], [0.207, 0.4], [0.19, 0.46], [0.2, 0.52], [0.232, 0.62], [0.266, 0.74], [0.29, 0.86], [0.305, 0.97], [0.306, 0.995]];
  const inner = [[0.296, 0.998], [0.293, 0.97], [0.278, 0.86], [0.254, 0.74], [0.22, 0.62], [0.188, 0.52], [0.178, 0.46], [0.195, 0.4], [0.23, 0.3], [0.244, 0.22], [0.234, 0.14], [0.206, 0.085], [0.17, 0.058], [0, 0.052]];
  const prof = [...outer, ...inner].map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y));
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), MAT.glass({ thickness: 0.07, ior: 1.5, roughness: 0.015, attenuationColor: new THREE.Color('#d8f6ee'), attenuationDistance: 0.6, specularIntensity: 1 }));
  g.add(glass);
  // tea (opaque so the glass refracts it)
  const fill = 0.86, teaPts = inner.slice().reverse().filter(([, y]) => y <= fill).map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r - 0.003), y));
  const rTop = 0.285; teaPts.push(new THREE.Vector2(rTop, fill), new THREE.Vector2(0.0001, fill + 0.004));
  const teaMat = new THREE.MeshPhysicalMaterial({ color: '#7a1a06', roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, emissive: '#3b0a02', emissiveIntensity: 0.55, sheen: 0.5, sheenColor: new THREE.Color('#ff7a3a') });
  g.add(new THREE.Mesh(new THREE.LatheGeometry(teaPts, 96), teaMat));
  // gilded rim lines
  const gold = MAT.gold();
  [[0.304, 0.958], [0.192, 0.47]].forEach(([r, y]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0055, 8, 120), gold); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); });
  // saucer
  const sp = [[0.0001, 0.012], [0.17, 0.012], [0.19, 0], [0.215, 0], [0.226, 0.016], [0.4, 0.036], [0.55, 0.07], [0.586, 0.086], [0.576, 0.093], [0.52, 0.08], [0.36, 0.052], [0.245, 0.036], [0.21, 0.031], [0.0001, 0.03]].map(([r, y]) => new THREE.Vector2(r, y));
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(sp, 120), MAT.ceramic('#fbfbfa'));
  saucer.position.y = -0.03; g.add(saucer);
  [[0.582, 0.058], [0.36, 0.024]].forEach(([r, y]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 8, 160), gold); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); });
  const redBand = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.012, 6, 160), new THREE.MeshPhysicalMaterial({ color: '#c21d2c', roughness: 0.3, clearcoat: 1 }));
  redBand.rotation.x = Math.PI / 2; redBand.position.y = 0.036; redBand.scale.z = 0.4; g.add(redBand);
  // spoon
  const sm = MAT.metal('#d9dde2', 0.14), spoon = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.36, 6, 12), sm); handle.rotation.z = Math.PI / 2; handle.scale.set(1, 1, 0.45); handle.position.x = 0.2;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), sm); bowl.scale.set(1.5, 0.4, 1); bowl.rotation.x = Math.PI;
  spoon.add(handle, bowl); spoon.position.set(0.3, 0.035, 0.3); spoon.rotation.y = -0.9; spoon.rotation.z = 0.06; g.add(spoon);
  const sugar = new THREE.Mesh(new RoundedBoxGeometry(0.085, 0.07, 0.085, 2, 0.012), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.92, normalMap: NT.fine(), sheen: 0.4 }));
  sugar.position.set(-0.38, 0.06, 0.2); sugar.rotation.y = 0.5; g.add(sugar);
  // steam
  const steam = new THREE.Group(); const puffs = [];
  for (let i = 0; i < 6; i++) { const s = glowSprite('255,255,255', 0.5, 0.05); s.userData.k = i / 6; puffs.push(s); steam.add(s); }
  steam.position.y = 0.9; g.add(steam);
  const root = normalize(g, 2, 2.3);
  return { root, update(t) { puffs.forEach((p, i) => { const k = (t * 0.12 + p.userData.k) % 1; p.position.set(Math.sin(t * 0.8 + i) * 0.05 * k, k * 0.55, Math.cos(t * 0.6 + i) * 0.03); p.scale.setScalar(0.3 + k * 0.6); setGlow(p, Math.sin(k * Math.PI) * 0.05); }); } };
}

/* 3. Diş macunu */
function toothLabel() {
  return memo('toothLabel', () => canvasTex(1024, 1024, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, '#e9fbf4'); bg.addColorStop(0.5, '#ffffff'); bg.addColorStop(1, '#e9fbf4');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#20b39a'; g.fillRect(0, h * 0.78, w, h * 0.06); g.fillStyle = '#0d6f8f'; g.fillRect(0, h * 0.84, w, h * 0.02); g.fillStyle = '#E0262F'; g.fillRect(0, h * 0.865, w, h * 0.012);
    g.fillStyle = '#d9f4ec'; g.fillRect(0, 0, w, h * 0.08);
    g.save(); g.translate(w * 0.5, h * 0.48); g.rotate(-Math.PI / 2);
    g.fillStyle = '#0B1426'; g.font = '800 150px Poppins, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('silika', 0, -10);
    g.font = '600 38px Poppins, sans-serif'; g.fillStyle = '#0d6f8f'; g.fillText('nazik beyazlık', 0, 92);
    g.restore();
    g.save(); g.translate(w * 0.36, h * 0.46); g.rotate(-Math.PI / 2); g.font = '600 30px Poppins, sans-serif'; g.fillStyle = '#20b39a'; g.textAlign = 'center'; g.fillText('Hidratlı silika (SiO₂)', 0, 0); g.restore();
    g.save(); g.translate(w * 0.64, h * 0.46); g.rotate(-Math.PI / 2); g.font = '700 30px Poppins, sans-serif'; g.fillStyle = '#0B1426'; g.textAlign = 'center'; g.fillText('RDA ≤ 250   ·   75 ml', 0, 0); g.restore();
    g.save(); g.translate(w * 0.06, h * 0.5); g.rotate(-Math.PI / 2); g.font = '400 18px "IBM Plex Sans", sans-serif'; g.fillStyle = '#5b6b80'; g.textAlign = 'center';
    g.fillText('Içindekiler: Aqua, Sorbitol, Hydrated Silica, Glycerin, Sodium Fluoride, Aroma', 0, 0); g.fillText('Örnek ürün tasarımı: SiO₂ sunum sitesi', 0, 26); g.restore();
  }));
}
function buildToothpasteProduct() {
  const g = new THREE.Group();
  const rT = 0.36, L = 1.95;
  const body = new THREE.CylinderGeometry(rT, rT, L, 80, 70, true), p = body.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = (y + L / 2) / L, s = smooth(0.28, 1.0, t); p.setXYZ(i, x * (1 + 0.42 * s), y, z * (1 - 0.94 * s) + Math.sin(y * 9 + x * 4) * 0.004 * s); }
  body.computeVertexNormals();
  const map = toothLabel(); map.offset.x = 0.5; map.wrapS = THREE.RepeatWrapping;
  const plastic = new THREE.MeshPhysicalMaterial({ map, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.12, sheen: 0.15, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(body, plastic));
  const seal = new THREE.Mesh(new RoundedBoxGeometry(rT * 2 * 1.42 + 0.04, 0.17, 0.03, 2, 0.01), new THREE.MeshPhysicalMaterial({ color: '#e9fbf4', roughness: 0.4, clearcoat: 0.6, normalMap: NT.ribs(), normalScale: new THREE.Vector2(0.6, 0.6) }));
  seal.position.y = L / 2 + 0.07; g.add(seal);
  const sh = [[rT, 0], [rT * 0.97, -0.05], [rT * 0.85, -0.11], [0.2, -0.16], [0.13, -0.18], [0.13, -0.22]].map(([r, y]) => new THREE.Vector2(r, y));
  const shoulder = new THREE.Mesh(new THREE.LatheGeometry(sh, 80), new THREE.MeshPhysicalMaterial({ color: '#f6fffb', roughness: 0.3, clearcoat: 0.9 }));
  shoulder.position.y = -L / 2; g.add(shoulder);
  const cp = [[0.0001, 0], [0.19, 0], [0.205, 0.015], [0.205, 0.3], [0.19, 0.315], [0.0001, 0.315]].map(([r, y]) => new THREE.Vector2(r, y));
  const capGeo = new THREE.LatheGeometry(cp, 96);
  const cap = new THREE.Mesh(capGeo, new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.35, clearcoat: 1, normalMap: NT.ribs(), normalScale: new THREE.Vector2(0.5, 0.5) }));
  cap.position.y = -L / 2 - 0.22 - 0.315; g.add(cap);
  g.rotation.z = 0.06;
  return { root: normalize(g, 2, 2.1) };
}

/* 4. Silika jel paketi */
function sachetTex() {
  return memo('sachetTex', () => canvasTex(512, 720, (g, w, h) => {
    g.fillStyle = '#fbfcfd'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e6eef7'; g.fillRect(0, 0, w, 50); g.fillRect(0, h - 50, w, 50);
    g.fillStyle = '#1b4f9c'; g.textAlign = 'center';
    g.font = '800 70px Poppins, sans-serif'; g.fillText('SILICA', w / 2, 190); g.fillText('GEL', w / 2, 262);
    g.font = '700 36px Poppins, sans-serif'; g.fillText('SİLİKA JEL', w / 2, 320);
    g.font = '600 26px Poppins, sans-serif'; g.fillStyle = '#3a6fb5'; g.fillText('DESICCANT · NEM ÇEKİCİ', w / 2, 368);
    g.strokeStyle = '#d6202b'; g.lineWidth = 8; g.beginPath(); g.arc(w / 2, 470, 52, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w / 2 - 36, 434); g.lineTo(w / 2 + 36, 506); g.stroke();
    g.fillStyle = '#1b4f9c'; g.beginPath(); g.ellipse(w / 2, 474, 26, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#d6202b'; g.font = '800 34px Poppins, sans-serif'; g.fillText('DO NOT EAT', w / 2, 575); g.fillText('YEMEYİN', w / 2, 615);
    g.fillStyle = '#6a7d96'; g.font = '500 22px Poppins, sans-serif'; g.fillText('THROW AWAY · ATINIZ', w / 2, 655);
  }));
}
function sachetAlpha() {
  return memo('sachetAlpha', () => canvasTex(256, 360, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.beginPath(); const zz = 14, d = 7; g.moveTo(0, d);
    for (let x = 0; x <= w; x += zz) g.lineTo(x, (x / zz) % 2 ? 0 : d);
    g.lineTo(w, h - d); for (let x = w; x >= 0; x -= zz) g.lineTo(x, (x / zz) % 2 ? h : h - d);
    g.closePath(); g.fill();
  }, { srgb: false }));
}
function buildSachetProduct() {
  const g = new THREE.Group(), w = 1.2, h = 1.7, seal = 0.09;
  const mk = sign => {
    const geo = new THREE.PlaneGeometry(w, h, 56, 80), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), ax = Math.abs(x) / (w / 2 - seal), ay = Math.abs(y) / (h / 2 - seal);
      let z = 0;
      if (ax < 1 && ay < 1) z = 0.13 * Math.pow(1 - Math.pow(ax, 4), 1.1) * Math.pow(1 - Math.pow(ay, 5), 1.1) + fbm(x * 3, y * 3, sign, 2) * 0.012;
      else z = 0.003 * Math.sin((ay >= 1 ? x : y) * 160);
      p.setZ(i, z * sign);
    }
    if (sign < 0) { const idx = geo.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } }
    geo.computeVertexNormals();
    return geo;
  };
  const front = new THREE.MeshPhysicalMaterial({ map: sachetTex(), alphaMap: sachetAlpha(), alphaTest: 0.5, roughness: 0.78, sheen: 0.7, sheenColor: new THREE.Color('#ffffff'), normalMap: NT.porous(), normalScale: new THREE.Vector2(0.12, 0.12) });
  const back = new THREE.MeshPhysicalMaterial({ color: '#f4f7fa', alphaMap: sachetAlpha(), alphaTest: 0.5, roughness: 0.8, sheen: 0.6, normalMap: NT.porous(), normalScale: new THREE.Vector2(0.12, 0.12) });
  const bag = new THREE.Group(); bag.add(new THREE.Mesh(mk(1), front), new THREE.Mesh(mk(-1), back));
  bag.rotation.set(-0.08, 0, 0.1); g.add(bag);
  const R = rng(4), N = 46, beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.048, 28, 14), MAT.glass({ ior: 1.45, thickness: 0.08, attenuationColor: new THREE.Color('#e1efff'), attenuationDistance: 0.4 }), N), m = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { const a = R() * Math.PI - 0.2, r = 0.25 + Math.pow(R(), 1.4) * 0.75, s = 0.8 + R() * 0.45; m.compose(V3(Math.cos(a) * r + 0.25, -h / 2 - 0.02 + R() * 0.03 + (i < 8 ? (R() * 0.08) : 0), 0.28 + Math.sin(a) * r * 0.45), new THREE.Quaternion(), V3(s, s, s)); beads.setMatrixAt(i, m); }
  g.add(beads);
  return { root: normalize(g, 2, 2.1) };
}

/* 5. Çip: silisyum yonga plakası */
function waferTextures() {
  return memo('waferTex', () => {
    const S0 = 2048, n = 21, R = rng(2048);
    const cells = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cells.push([i, j, R(), R()]);
    const inside = (i, j) => { const cx = (i + 0.5) / n * 2 - 1, cy = (j + 0.5) / n * 2 - 1; return Math.hypot(Math.abs(cx) + 1 / n, Math.abs(cy) + 1 / n) < 0.95 && cy > -0.9; };
    const map = canvasTex(S0, S0, (g, w) => {
      g.fillStyle = '#6b7384'; g.fillRect(0, 0, w, w);
      const cs = w / n;
      cells.forEach(([i, j, a, b]) => {
        const x = i * cs, y = j * cs;
        if (!inside(i, j)) { g.fillStyle = '#8a92a2'; g.fillRect(x + 3, y + 3, cs - 6, cs - 6); return; }
        g.fillStyle = `hsl(${215 + a * 30},14%,${52 + b * 12}%)`; g.fillRect(x + 4, y + 4, cs - 8, cs - 8);
        g.fillStyle = `hsl(${200 + b * 40},20%,${62 + a * 12}%)`;
        for (let k = 0; k < 4; k++) g.fillRect(x + 10 + k * (cs - 20) / 4, y + 10, (cs - 20) / 4 - 4, cs * 0.42);
        g.fillStyle = 'rgba(210,190,140,.85)'; for (let k = 0; k < 8; k++) { g.fillRect(x + 8 + k * (cs - 16) / 8, y + cs - 12, 5, 5); g.fillRect(x + 8 + k * (cs - 16) / 8, y + 6, 5, 5); }
        g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(x + 10, y + cs * 0.55 + k * 4); g.lineTo(x + cs - 10, y + cs * 0.55 + k * 4); g.stroke(); }
      });
    });
    map.repeat.set(0.5, 0.5); map.offset.set(0.5, 0.5);
    const thick = canvasTex(512, 512, (g, w) => { const cs = w / n; cells.forEach(([i, j, a]) => { const v = inside(i, j) ? 60 + a * 190 : 40; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i * cs, j * cs, cs, cs); }); }, { srgb: false });
    thick.repeat.set(0.5, 0.5); thick.offset.set(0.5, 0.5);
    return { map, thick };
  });
}
function buildWaferProduct() {
  const sh = new THREE.Shape(), dA = 0.22;
  sh.absarc(0, 0, 1, -Math.PI / 2 + dA, Math.PI * 1.5 - dA, false); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.028, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 128 });
  geo.center();
  const { map, thick } = waferTextures();
  const face = new THREE.MeshPhysicalMaterial({ map, color: '#e4e9f2', metalness: 0.92, roughness: 0.09, iridescence: 1, iridescenceIOR: 1.85, iridescenceThicknessRange: [120, 950], iridescenceThicknessMap: thick, clearcoat: 0.5, clearcoatRoughness: 0.08 });
  const side = MAT.metal('#9aa1ae', 0.35);
  const wafer = new THREE.Mesh(geo, [face, side]);
  const g = new THREE.Group(); g.add(wafer);
  wafer.rotation.x = -1.05;
  const chip = chipDie(); chip.scale.setScalar(0.32); chip.position.set(0.55, 0.62, 0.35); chip.rotation.set(0.6, 0.4, 0.2); g.add(chip);
  const root = normalize(g, 2, 2.4);
  return { root, update(t) { wafer.rotation.z = t * 0.25; chip.position.y = 0.62 + Math.sin(t * 1.3) * 0.04; chip.rotation.y = 0.4 + t * 0.4; } };
}

/* 6. Optik fiber demeti */
function buildFiberProduct() {
  const g = new THREE.Group();
  const cable = new THREE.CatmullRomCurve3([V3(0.05, -1.35, 0.05), V3(-0.08, -0.9, 0), V3(0.04, -0.45, -0.03), V3(0, -0.12, 0)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(cable, 64, 0.11, 28), new THREE.MeshPhysicalMaterial({ color: '#141a24', roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#3b5a8a'), clearcoat: 0.3 })));
  const fer = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.1, 40), MAT.metal('#d6dae0', 0.2)); fer.position.y = -0.1; g.add(fer);
  const R = rng(66), N = 120, geos = [], tips = [], seeds = [];
  for (let i = 0; i < N; i++) {
    const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * 0.075, th = Math.pow(R(), 0.8) * 1.15, ph = R() * Math.PI * 2, L = 1.0 + R() * 0.7;
    const s0 = V3(Math.cos(a) * rr, -0.05, Math.sin(a) * rr), d = V3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    const droop = th * th * 0.42 * L;
    const pts = [s0, s0.clone().addScaledVector(d, 0.3 * L), s0.clone().addScaledVector(d, 0.65 * L).add(V3(0, -droop * 0.35, 0)), s0.clone().addScaledVector(d, L).add(V3(0, -droop, 0))];
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.0065, 5);
    const sd = R(); tg.setAttribute('aSeed', new THREE.Float32BufferAttribute(new Array(tg.attributes.position.count).fill(sd), 1));
    geos.push(tg); tips.push(pts[3]); seeds.push(sd);
  }
  const fibers = mergeGeometries(geos);
  const fmat = glowBlend(new THREE.ShaderMaterial({
    uniforms: { uTime: TIME },
    vertexShader: 'attribute float aSeed; varying float vT; varying float vS; varying float vF; void main(){ vT = uv.x; vS = aSeed; vec4 mv = modelViewMatrix * vec4(position,1.0); vec3 n = normalize(normalMatrix*normal); vF = 1.0-abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform float uTime; varying float vT; varying float vS; varying float vF; void main(){ vec3 hue = mix(vec3(0.25,0.95,1.0), vec3(0.62,0.48,1.0), fract(vS*3.7)); float p = fract(vT*1.3 - uTime*0.45 - vS*5.0); float pulse = smoothstep(0.12,0.0,abs(p-0.5)); float tip = smoothstep(0.82,1.0,vT); float base = 0.10 + 0.22*vF; gl_FragColor = vec4(hue*(base + pulse*1.25 + tip*1.6), 1.0); }'
  }));
  g.add(new THREE.Mesh(fibers, fmat));
  const tg = new THREE.BufferGeometry().setFromPoints(tips); tg.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
  const pm = glowBlend(new THREE.ShaderMaterial({
    uniforms: { uTime: TIME, uMap: { value: softDotP('255,255,255', 64) }, uPx: { value: (devicePixelRatio || 1) } },
    vertexShader: 'attribute float aSeed; varying float vS; uniform float uPx; void main(){ vS=aSeed; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = 120.0*uPx/(-mv.z); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D uMap; uniform float uTime; varying float vS; void main(){ vec3 hue = mix(vec3(0.35,0.95,1.0), vec3(0.7,0.55,1.0), fract(vS*3.7)); float tw = 0.65+0.35*sin(uTime*3.0+vS*40.0); float a = texture2D(uMap, gl_PointCoord).r; gl_FragColor = vec4(hue*a*tw*1.4, 1.0); }'
  }));
  g.add(new THREE.Points(tg, pm));
  const halo = glowSprite('90,200,255', 1.4, 0.25); halo.position.y = 0.4; g.add(halo);
  return { root: normalize(g, 2, 2.4) };
}

/* 7. Aerojel bloğu + Stardust izleri */
function buildAerogelProduct() {
  const g = new THREE.Group();
  const block = new THREE.Mesh(new RoundedBoxGeometry(1.6, 1.0, 1.05, 6, 0.07), aeroMat());
  g.add(block);
  const haze = new THREE.Mesh(new RoundedBoxGeometry(1.52, 0.93, 0.98, 4, 0.06), glowBlend(new THREE.ShaderMaterial({
    vertexShader: 'varying float vF; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vec3 n = normalize(normalMatrix*normal); vF = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying float vF; void main(){ gl_FragColor = vec4(vec3(0.62,0.78,1.0)*(0.10+0.16*pow(vF,1.5)), 1.0); }', side: THREE.FrontSide
  })));
  g.add(haze);
  const trackMat = new THREE.MeshBasicMaterial({ color: '#f7c27e' }), dotMat = new THREE.MeshBasicMaterial({ color: '#5a3518' });
  [[0.35, 0.5, 0.1, 0.42, 0.25], [-0.2, 0.5, -0.15, 0.3, -0.2], [0.05, 0.5, 0.25, 0.22, 0.1], [-0.5, 0.5, 0.2, 0.18, 0.35]].forEach(([x, y, z, L, tilt]) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.028, L, 14, 1, true), trackMat);
    c.position.set(x + tilt * L * 0.5, y - L / 2, z); c.rotation.z = tilt; c.rotation.x = Math.PI; g.add(c);
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), dotMat); d.position.set(x + tilt * L, y - L, z); g.add(d);
  });
  const glow = glowSprite('120,180,255', 2.6, 0.22); glow.position.z = -0.6; g.add(glow);
  return { root: normalize(g, 2, 2.3) };
}

/* 8. LI-900 karosu: katmanlar, ısıtma */
function buildTileBlock(H = 0.55, heatU = { value: 0 }) {
  const geo = new RoundedBoxGeometry(1.5, H, 1.5, 5, 0.035);
  const mat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.9, normalMap: NT.porous(), normalScale: new THREE.Vector2(0.55, 0.55), clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const yCut = -H / 2 + H * 0.2;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uHeat = heatU; sh.uniforms.uTime = TIME;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vLP; uniform float uHeat; uniform float uTime;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float coat = smoothstep(${(yCut - 0.012).toFixed(4)}, ${(yCut + 0.012).toFixed(4)}, vLP.y + 0.01*sin(vLP.x*40.0)*sin(vLP.z*37.0));
        diffuseColor.rgb = mix(vec3(0.93,0.92,0.89), vec3(0.022,0.022,0.026), coat);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(0.96, 0.4, coat);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float topF = smoothstep(${(H / 2 - 0.06).toFixed(4)}, ${(H / 2 - 0.005).toFixed(4)}, vLP.y);
        float sideF = smoothstep(${(-H / 2).toFixed(4)}, ${(H / 2).toFixed(4)}, vLP.y);
        float r2 = dot(vLP.xz, vLP.xz) / 0.6;
        float hot = uHeat * (topF * (1.0 - 0.45*r2) + (1.0-topF)*pow(sideF, 6.0)*0.55);
        hot *= 0.92 + 0.08*sin(uTime*7.0 + vLP.x*9.0);
        vec3 hc = mix(vec3(0.55,0.06,0.0), vec3(1.0,0.48,0.12), clamp(hot*1.2,0.0,1.0));
        hc = mix(hc, vec3(1.0,0.86,0.62), smoothstep(0.7,1.0,hot));
        totalEmissiveRadiance += hc * hot * 2.6;`);
  };
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, heatU };
}
function buildTileProduct() {
  const g = new THREE.Group(), heatU = { value: 0 };
  const H = 0.55, tile = buildTileBlock(H, heatU).mesh;
  const rtvMat = new THREE.MeshPhysicalMaterial({ color: '#b8382a', roughness: 0.55, clearcoat: 0.4 });
  const sip = new THREE.Mesh(new RoundedBoxGeometry(1.42, 0.08, 1.42, 2, 0.01), new THREE.MeshPhysicalMaterial({ color: '#e7dfc6', roughness: 1, sheen: 1, sheenColor: new THREE.Color('#fff8e2'), normalMap: NT.fibers(), normalScale: new THREE.Vector2(0.8, 0.8) }));
  const rtv1 = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.014, 1.42), rtvMat), rtv2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.014, 1.4), rtvMat);
  const al = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.05, 2.0, 2, 0.01), new THREE.MeshPhysicalMaterial({ color: '#cfd4dc', metalness: 1, roughness: 0.3, anisotropy: 0.85, normalMap: NT.brushed(), normalScale: new THREE.Vector2(0.3, 0.3) }));
  const layers = [[al, 0, 0], [rtv2, 0.032, 0.2], [sip, 0.079, 0.45], [rtv1, 0.126, 0.72], [tile, 0.133 + H / 2, 1.05]];
  layers.forEach(([m, y]) => { m.position.y = y; g.add(m); });
  const embers = new THREE.Group(), E = [];
  for (let i = 0; i < 14; i++) { const s = glowSprite('255,150,60', 0.09, 0); s.userData.k = i / 14; s.userData.x = (Math.random() - .5) * 1.2; s.userData.z = (Math.random() - .5) * 1.2; E.push(s); embers.add(s); }
  const halo = glowSprite('255,110,30', 2.4, 0); halo.position.y = 0.6;
  embers.add(halo); g.add(embers);
  const root = normalize(g, 1.55, 2.5);
  let ex = 0, exT = 0, ht = 0, htT = 0;
  return {
    root,
    update(t, dt) {
      ex = damp(ex, exT, 5, dt); ht = damp(ht, htT, 2.2, dt);
      layers.forEach(([m, y, k]) => { m.position.y = y + ex * k * 0.9; });
      heatU.value = ht;
      const topY = 0.133 + H + ex * 1.05 * 0.9;
      halo.position.y = topY + 0.1; setGlow(halo, ht * 0.5);
      E.forEach(s => { const k = (t * 0.25 + s.userData.k) % 1; s.position.set(s.userData.x * (1 - k * .3), topY + k * 0.9, s.userData.z); setGlow(s, ht * Math.sin(k * Math.PI) * 0.9); });
    },
    toggles: [{ label: 'Katmanları ayır', on: false, set(v) { exT = v ? 1 : 0; } }, { label: 'Isıt: 1260 °C', on: false, set(v) { htT = v ? 1 : 0; } }],
    labels: [
      { text: 'RCG kaplama + silika gövde', obj: tile, off: V3(1.05, 0.1, 0.5), show: () => ex > 0.5 },
      { text: 'RTV yapıştırıcı', obj: rtv1, off: V3(0.95, 0, 0.5), show: () => ex > 0.5 },
      { text: 'SIP (Nomex keçe)', obj: sip, off: V3(0.95, 0, 0.5), show: () => ex > 0.5 },
      { text: 'Alüminyum gövde: en fazla ~177 °C', obj: al, off: V3(1.15, 0, 0.6), show: () => ex > 0.5 || ht > 0.5 },
      { text: 'Yüzey ~1260 °C', obj: tile, off: V3(-0.2, 0.42, 0), show: () => ht > 0.5 }
    ]
  };
}

/* 9. Füze radomu: erimiş silika, kesit, radar */
function buildRadomeProduct() {
  const g = new THREE.Group(), R = 0.55, L = 2.0, rho = (R * R + L * L) / (2 * R), t = 0.04;
  const prof = (off) => { const pts = []; for (let i = 0; i <= 64; i++) { const x = (1 - i / 64) * L; const y = Math.sqrt(Math.max(0, rho * rho - (L - x) * (L - x))) + R - rho; pts.push(new THREE.Vector2(Math.max(0.0005, y - off), L - x)); } return pts; };
  const o = prof(0), inn = prof(t).map(p => new THREE.Vector2(Math.max(0.0005, p.x), p.y));
  const cer = new THREE.MeshPhysicalMaterial({ color: '#f3f2ee', roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.4, sheen: 0.35, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide });
  const cut0 = 0.85, cutLen = Math.PI * 2 - 2 * cut0;
  const full = new THREE.Mesh(new THREE.LatheGeometry(o, 120), cer);
  const outerCut = new THREE.Mesh(new THREE.LatheGeometry(o, 120, cut0, cutLen), cer);
  const innerCut = new THREE.Mesh(new THREE.LatheGeometry(inn, 120, cut0, cutLen), new THREE.MeshPhysicalMaterial({ color: '#e2ded4', roughness: 0.8, side: THREE.DoubleSide }));
  const faceGeo = phi => { const pos = []; const P = (r, y) => [Math.sin(phi) * r, y, Math.cos(phi) * r]; for (let i = 0; i < inn.length - 1; i++) { const a = P(o[i].x, o[i].y), b = P(o[i + 1].x, o[i + 1].y), c = P(inn[i].x, inn[i].y), d = P(inn[i + 1].x, inn[i + 1].y); pos.push(...a, ...b, ...c, ...b, ...d, ...c); } const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.computeVertexNormals(); return gg; };
  const faceMat = new THREE.MeshPhysicalMaterial({ color: '#d9d4c8', roughness: 0.9, side: THREE.DoubleSide, normalMap: NT.porous(), normalScale: new THREE.Vector2(0.4, 0.4) });
  const cutGroup = new THREE.Group(); cutGroup.add(outerCut, innerCut, new THREE.Mesh(faceGeo(cut0), faceMat), new THREE.Mesh(faceGeo(cut0 + cutLen), faceMat));
  g.add(cutGroup); g.add(full); full.visible = false;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.09, 96, 1, true), MAT.metal('#aeb5c0', 0.28)); ring.position.y = 0.0; g.add(ring);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.95, 96), new THREE.MeshPhysicalMaterial({ color: '#e9ebe4', roughness: 0.45, clearcoat: 0.6 }));
  body.position.y = -0.52; g.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.08, 96, 1, true), new THREE.MeshPhysicalMaterial({ color: '#2f3a2c', roughness: 0.6 })); band.position.y = -0.3; g.add(band);
  // seeker antenna
  const slots = memo('slotTex', () => canvasTex(512, 512, (c, w) => { c.fillStyle = '#c99a4a'; c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, 7); c.fill(); c.fillStyle = '#5a3d14'; for (let y = 30; y < w - 30; y += 26) for (let x = 30; x < w - 30; x += 40) { if (Math.hypot(x - w / 2, y - w / 2) < w * 0.44) c.fillRect(x + ((y / 26) % 2) * 20 - 12, y - 3, 24, 6); } }));
  const seeker = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.035, 72), [MAT.metal('#b88a40', 0.35), new THREE.MeshPhysicalMaterial({ map: slots, metalness: 0.85, roughness: 0.3 }), MAT.metal('#8a6a30', 0.4)]);
  const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.018, 10, 64, Math.PI), MAT.metal('#9aa2ad', 0.3)); yoke.rotation.z = Math.PI;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.42, 24), MAT.metal('#7c848f', 0.35)); post.position.y = -0.3;
  seeker.add(disc, yoke, post); seeker.position.y = 0.42; g.add(seeker);
  // radar waves
  const waves = []; const wm = () => glowBlend(new THREE.MeshBasicMaterial({ color: '#7ff0ff', transparent: true, opacity: 0 }));
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 80), wm()); w.rotation.x = Math.PI / 2; w.userData.k = i / 4; waves.push(w); g.add(w); }
  g.rotation.x = 0.18;
  const root = normalize(g, 2, 2.0);
  let radar = 0, radarT = 1, cut = 1;
  return {
    root,
    update(tt, dt) {
      radar = damp(radar, radarT, 3, dt);
      disc.rotation.x = Math.sin(tt * 0.9) * 0.3; disc.rotation.z = Math.cos(tt * 0.7) * 0.25; yoke.rotation.y = Math.sin(tt * 0.9) * 0.3;
      waves.forEach(w => { const k = (tt * 0.35 + w.userData.k) % 1; w.position.y = 0.45 + k * 2.4; const s = 1 + k * 1.6; w.scale.set(s, s, s); w.material.opacity = radar * Math.sin(k * Math.PI) * 0.9; });
    },
    toggles: [{ label: 'Kesiti göster', on: true, set(v) { cut = v; cutGroup.visible = v; full.visible = !v; } }, { label: 'Radar dalgaları', on: true, set(v) { radarT = v ? 1 : 0; } }],
    labels: [
      { text: 'Döküm erimiş silika radom', obj: outerCut, off: V3(-0.62, 1.05, 0), show: () => cut },
      { text: 'Radar anteni (arayıcı)', obj: seeker, off: V3(0.65, 0.05, 0.2), show: () => cut }
    ]
  };
}

const PRODUCT_BUILDERS = { quartz: buildQuartzProduct, tea: buildTeaProduct, toothpaste: buildToothpasteProduct, sachet: buildSachetProduct, wafer: buildWaferProduct, fiber: buildFiberProduct, aerogel: buildAerogelProduct, tile: buildTileProduct, radome: buildRadomeProduct };
function buildProduct(kind) {
  const p = PRODUCT_BUILDERS[kind]();
  p.update ||= () => { }; p.toggles ||= []; p.labels ||= [];
  return p;
}
