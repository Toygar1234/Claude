/* ───────────── Geometry helpers shared by pieces and products ───────────── */
function fixWinding(pos) {
  // make every triangle face away from the mesh centroid (works for convex-ish solids)
  let cx = 0, cy = 0, cz = 0; const n = pos.length / 3;
  for (let i = 0; i < pos.length; i += 3) { cx += pos[i]; cy += pos[i + 1]; cz += pos[i + 2]; }
  cx /= n; cy /= n; cz /= n;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), m = new THREE.Vector3();
  for (let i = 0; i < pos.length; i += 9) {
    a.fromArray(pos, i); b.fromArray(pos, i + 3); c.fromArray(pos, i + 6);
    e1.subVectors(b, a); e2.subVectors(c, a); const nn = e1.cross(e2);
    m.copy(a).add(b).add(c).multiplyScalar(1 / 3).sub(V3(cx, cy, cz));
    if (nn.dot(m) < 0) { for (let k = 0; k < 3; k++) { const t = pos[i + 3 + k]; pos[i + 3 + k] = pos[i + 6 + k]; pos[i + 6 + k] = t; } }
  }
}
function crystalGeo({ r = 0.2, h = 1, tip = 0.36, sides = 6, seed = 1, irr = 0.14, tipOff = 0.06 } = {}) {
  const R = rng(seed), rad = [];
  for (let i = 0; i < sides; i++) rad.push(r * (1 + (R() - .5) * 2 * irr));
  const ring = y => rad.map((rr, i) => { const a = i / sides * Math.PI * 2; return V3(Math.cos(a) * rr, y, Math.sin(a) * rr); });
  const b0 = ring(0), b1 = ring(h), apex = V3((R() - .5) * tipOff, h + tip, (R() - .5) * tipOff);
  const tipRing = b1.map((p, i) => p.clone().lerp(apex, 0.06 + R() * 0.05));
  const pos = [], uv = [], H_ = h + tip;
  const tri = (a, b, c) => { pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); uv.push(0, a.y / H_, 1, b.y / H_, .5, c.y / H_); };
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    tri(b0[i], b1[i], b1[j]); tri(b0[i], b1[j], b0[j]);
    tri(b1[i], tipRing[i], tipRing[j]); tri(b1[i], tipRing[j], b1[j]);
    tri(tipRing[i], apex, tipRing[j]);
    tri(b0[j], V3(0, 0, 0), b0[i]);
  }
  fixWinding(pos);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
function rockGeo(seed = 1, { detail = 5, amp = 0.22, freq = 1.5, scale = [1, 1, 1], dents = 0 } = {}) {
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let n = fbm(v.x * freq + seed, v.y * freq + seed * .3, v.z * freq, 5) * amp * 2 + fbm(v.x * 9 + seed, v.y * 9, v.z * 9, 2) * 0.025;
    if (dents) n -= Math.max(0, fbm(v.x * 3.1 + seed * 2, v.y * 3.1, v.z * 3.1, 2) - 0.08) * dents;
    v.multiplyScalar(1 + n); v.x *= scale[0]; v.y *= scale[1]; v.z *= scale[2];
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
function shardGeo(seed = 3, flat = [1, 0.16, 0.72], n = 14) {
  const R = rng(seed), pts = [];
  for (let i = 0; i < n; i++) { const u = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - u * u); pts.push(V3(Math.cos(a) * s * flat[0] * (0.7 + R() * .3), u * flat[1], Math.sin(a) * s * flat[2] * (0.6 + R() * .4))); }
  pts.push(V3(flat[0] * 1.1, 0, 0), V3(-flat[0] * 0.5, 0, flat[2] * 0.4));
  const g = new ConvexGeometry(pts); g.computeVertexNormals(); return g;
}
function dropGeo(n = 48) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI; pts.push(new THREE.Vector2(Math.max(0.0001, Math.sin(a) * Math.pow(Math.sin(a / 2), 0.9) * 0.62), Math.cos(a))); }
  return new THREE.LatheGeometry(pts, 48);
}
function leafTex() {
  return memo('leafTex', () => {
    const draw = (g, w, h, mode) => {
      g.clearRect(0, 0, w, h);
      const path = () => { g.beginPath(); g.moveTo(w / 2, h * 0.02); const teeth = 11; for (let s = 0; s <= 1; s++) { for (let i = 0; i <= teeth; i++) { const t = i / teeth, y = h * (0.02 + t * 0.9), wid = Math.sin(Math.PI * Math.min(1, t * 1.05)) * w * 0.42 * (1 - t * 0.25); const x = w / 2 + (s ? -1 : 1) * (wid + (i % 2 ? 0 : 6)); g.lineTo(x, y); } } g.closePath(); };
      if (mode === 'alpha') { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; path(); g.fill(); return; }
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5fbf5a'); gr.addColorStop(1, '#2f8a3c');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(210,255,190,.55)'; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h * 0.04); g.lineTo(w / 2, h * 0.96); g.stroke();
      g.lineWidth = 3; for (let i = 1; i < 9; i++) { const y = h * (0.12 + i * 0.09); g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w * 0.32, y - h * 0.04, w * 0.14, y - h * 0.09); g.moveTo(w / 2, y); g.quadraticCurveTo(w * 0.68, y - h * 0.04, w * 0.86, y - h * 0.09); g.stroke(); }
    };
    const map = canvasTex(256, 384, (g, w, h) => draw(g, w, h, 'col'));
    const alpha = canvasTex(256, 384, (g, w, h) => draw(g, w, h, 'alpha'), { srgb: false });
    return { map, alpha };
  });
}

/* ───────────── Floating pieces (baked to sprites) ───────────── */
function crystalMat(att = '#e9f0ff', attD = 2.2, extra = {}) {
  const rough = memo('frostGrad', () => canvasTex(4, 128, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.35, '#2a2a2a'); gr.addColorStop(1, '#060606'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { srgb: false }));
  return MAT.glass({ ior: 1.544, thickness: 0.55, roughness: 1, roughnessMap: rough, attenuationColor: new THREE.Color(att), attenuationDistance: attD, envMapIntensity: 1.5, specularIntensity: 1, clearcoat: 0.6, clearcoatRoughness: 0.04, ...extra });
}
function crystalMesh(o, mat) { return new THREE.Mesh(crystalGeo(o), mat); }
function sphere(r, mat, seg = 64) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg / 2), mat); }
function miniTetra() {
  const g = new THREE.Group(), tp = tetraStruct();
  g.add(sphere(0.5, MAT.Si()));
  const cyl = new THREE.CylinderGeometry(0.15, 0.15, 1, 20); cyl.translate(0, 0.5, 0);
  tp.forEach(p => {
    const v = V3(...p).multiplyScalar(1.5), dir = v.clone().normalize();
    const b = new THREE.Mesh(cyl, MAT.O()); b.scale.set(1, v.length(), 1); b.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); g.add(b);
    const o = sphere(0.38, MAT.O()); o.position.copy(v); g.add(o);
  });
  return g;
}
function cluster(n = 3, seed = 5, mat) {
  const g = new THREE.Group(), R = rng(seed);
  const base = new THREE.Mesh(rockGeo(seed, { detail: 4, amp: 0.18, scale: [1.1, 0.45, 0.9] }), MAT.rock('#cdb48a'));
  base.position.y = -0.1; g.add(base);
  for (let i = 0; i < n; i++) {
    const c = crystalMesh({ r: 0.16 + R() * 0.1, h: 0.5 + R() * 0.6, tip: 0.3, seed: seed + i * 7 }, mat || crystalMat());
    c.position.set((R() - .5) * 0.8, 0.12, (R() - .5) * 0.5); c.rotation.set((R() - .5) * 0.9, R() * 6, (R() - .5) * 0.9); g.add(c);
  }
  return g;
}
function marble() {
  const g = new THREE.Group();
  g.add(sphere(1, MAT.glass({ thickness: 1.8, ior: 1.5, attenuationColor: new THREE.Color('#d9fff6'), attenuationDistance: 3 })));
  const rib = new THREE.PlaneGeometry(1.5, 0.42, 60, 6), p = rib.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), a = x * 2.4; p.setXYZ(i, x, Math.cos(a) * y, Math.sin(a) * y); }
  rib.computeVertexNormals();
  const vane = new THREE.Mesh(rib, new THREE.MeshPhysicalMaterial({ color: '#1f8fd6', roughness: 0.3, side: THREE.DoubleSide, clearcoat: 0.5, sheen: 0.4, sheenColor: new THREE.Color('#9be7ff') }));
  vane.scale.setScalar(0.92); g.add(vane);
  return g;
}
function leaf() {
  const { map, alpha } = leafTex();
  const geo = new THREE.PlaneGeometry(1, 1.5, 20, 30), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -Math.abs(x) * 0.35 + Math.pow(y + 0.75, 2) * 0.12 + Math.sin(y * 3) * 0.04); }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map, alphaMap: alpha, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#d6ffd0'), normalMap: NT.fine(), clearcoat: 0.2 }));
}
function beadPile(clear, n = 18, seed = 9) {
  const g = new THREE.Group(), R = rng(seed);
  const mat = clear ? MAT.glass({ ior: 1.45, thickness: 0.3, attenuationColor: new THREE.Color('#dff1ff'), attenuationDistance: 0.8 }) : new THREE.MeshPhysicalMaterial({ color: '#f6f7f8', roughness: 0.75, sheen: 0.4 });
  for (let i = 0; i < n; i++) { const s = sphere(0.18 + R() * 0.05, mat, 32); const a = R() * 6.28, r = Math.sqrt(R()) * 0.55; s.position.set(Math.cos(a) * r, (R() * 0.3) * (1 - r), Math.sin(a) * r); g.add(s); }
  return g;
}
function stripeTex(cols, bands = 6) {
  return canvasTex(64, 256, (g, w, h) => { for (let i = 0; i < bands; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(0, i / bands * h, w, h / bands + 1); } });
}
function pasteSwirl() {
  const pts = []; for (let i = 0; i <= 120; i++) { const t = i / 120, a = t * Math.PI * 2 * 2.6, r = 0.62 * (1 - t * 0.78); pts.push(V3(Math.cos(a) * r, t * 1.05 + Math.sin(a * 0.5) * 0.02, Math.sin(a) * r)); }
  pts.push(V3(0.02, 1.18, 0.0));
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.2, 32, false);
  const map = memo('pasteStripes', () => stripeTex(['#ffffff', '#5fd3b3', '#ffffff', '#2aa7c9', '#ffffff', '#5fd3b3']));
  return new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.3 }));
}
function chipDie() {
  const g = new THREE.Group();
  const label = memo('chipLabel', () => canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#16181d'; c.fillRect(0, 0, w, h); c.fillStyle = '#9aa1ad'; c.font = '700 64px Poppins, sans-serif'; c.textAlign = 'center'; c.fillText('SiO₂', w / 2, h / 2 + 10); c.font = '500 24px Poppins, sans-serif'; c.fillText('KU-2026', w / 2, h / 2 + 50); c.beginPath(); c.arc(40, 40, 12, 0, 7); c.fillStyle = '#2a2d35'; c.fill(); }));
  const body = new THREE.Mesh(new RoundedBoxGeometry(1, 0.14, 1, 3, 0.03), [new THREE.MeshPhysicalMaterial({ color: '#191b20', roughness: 0.6 }), new THREE.MeshPhysicalMaterial({ color: '#191b20', roughness: 0.6 }), new THREE.MeshPhysicalMaterial({ map: label, roughness: 0.55 }), new THREE.MeshPhysicalMaterial({ color: '#191b20', roughness: 0.6 }), new THREE.MeshPhysicalMaterial({ color: '#191b20', roughness: 0.6 }), new THREE.MeshPhysicalMaterial({ color: '#191b20', roughness: 0.6 })]);
  g.add(body);
  const lead = new THREE.BoxGeometry(0.05, 0.03, 0.2), lm = MAT.metal('#d6d9de', 0.2);
  for (let s = 0; s < 4; s++) for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(lead, lm); const off = -0.4 + i * 0.1; const ang = s * Math.PI / 2; m.position.set(Math.cos(ang) * 0.58 - Math.sin(ang) * off, -0.04, Math.sin(ang) * 0.58 + Math.cos(ang) * off); m.rotation.y = -ang + Math.PI / 2; g.add(m); }
  return g;
}
function waferShard() {
  const sh = new THREE.Shape(); sh.moveTo(-0.8, -0.5); sh.lineTo(0.9, -0.35); sh.lineTo(0.2, 0.75); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#8f97a8', metalness: 0.9, roughness: 0.12, iridescence: 1, iridescenceIOR: 1.9, iridescenceThicknessRange: [200, 800] }));
}
function hc49() {
  const g = new THREE.Group();
  const sh = new THREE.Shape(); const w = 0.55, r = 0.2; sh.moveTo(-w, -r); sh.lineTo(w, -r); sh.absarc(w, 0, r, -Math.PI / 2, Math.PI / 2); sh.lineTo(-w, r); sh.absarc(-w, 0, r, Math.PI / 2, Math.PI * 1.5);
  const can = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4, curveSegments: 24 }), MAT.metal('#d9dde3', 0.18));
  can.rotation.x = -Math.PI / 2; g.add(can);
  const legs = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 12);
  [-0.35, 0.35].forEach(x => { const l = new THREE.Mesh(legs, MAT.metal('#c8ccd2', 0.3)); l.position.set(x, -0.42, 0); g.add(l); });
  return g;
}
function fiberLoop() {
  const pts = []; for (let i = 0; i <= 200; i++) { const t = i / 200 * Math.PI * 2; pts.push(V3(Math.sin(t) * 0.9, Math.sin(2 * t) * 0.45, Math.cos(t) * 0.3)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 300, 0.05, 12, true), new THREE.MeshBasicMaterial({ color: '#7ff3ff' }));
}
function aeroMat() { return MAT.glass({ color: '#f4f9ff', roughness: 0.46, ior: 1.04, thickness: 1.2, attenuationColor: new THREE.Color('#cfe2ff'), attenuationDistance: 2.6, specularIntensity: 0.3, envMapIntensity: 0.8 }); }
function hexTile() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.64, 0.2, 6), new THREE.MeshPhysicalMaterial({ color: '#0d0e11', roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35, normalMap: NT.porous(), normalScale: new THREE.Vector2(0.4, 0.4) }));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 6), new THREE.MeshPhysicalMaterial({ color: '#e8e6df', roughness: 0.95 }));
  base.position.y = -0.14; g.add(top, base); return g;
}
function flat(draw, w = 256, h = 256) {
  return () => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return { url: c.toDataURL('image/png'), aspect: h / w }; };
}
const glow2D = (inner, outer) => flat((g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.12, inner); gr.addColorStop(0.4, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const PIECES = {
  atomO: { make: () => sphere(0.5, MAT.O()) },
  atomSi: { make: () => sphere(0.5, MAT.Si()) },
  tetraMini: { make: miniTetra, rot: [0.4, 0.5, 0.1] },
  quartzPoint: { make: () => crystalMesh({ r: 0.22, h: 0.95, tip: 0.42, seed: 11 }, crystalMat()), rot: [0.1, 0.4, -0.5] },
  amethyst: { make: () => crystalMesh({ r: 0.24, h: 0.8, tip: 0.44, seed: 23 }, crystalMat('#a874ee', 0.85, { color: '#f6efff' })), rot: [0.2, 0.9, 0.55] },
  quartzCluster: { make: () => cluster(4, 31) },
  sandGrain: { make: () => new THREE.Mesh(rockGeo(4, { detail: 4, amp: 0.16, scale: [1, 0.78, 0.86] }), MAT.rock('#d8b47a', 0.85)), rot: [0.3, 0.2, 0] },
  meteorite: { make: () => new THREE.Mesh(rockGeo(17, { detail: 5, amp: 0.2, scale: [1, 0.8, 0.9], dents: 0.5 }), new THREE.MeshPhysicalMaterial({ color: '#3a3530', roughness: 0.62, metalness: 0.45 })), rot: [0.2, 0.3, 0] },
  impactRock: { make: () => new THREE.Mesh(rockGeo(29, { detail: 4, amp: 0.24, scale: [1, 0.7, 0.8] }), MAT.rock('#a39c90', 0.95)) },
  stishCrystal: { make: () => crystalMesh({ r: 0.2, h: 0.75, tip: 0.3, sides: 4, seed: 41 }, crystalMat('#ffffff', 3, { roughness: 0.6 })), rot: [0.3, 0.7, 0.4] },
  glassMarble: { make: marble, rot: [0.2, 0.6, 0.3] },
  glassShard: { make: () => new THREE.Mesh(shardGeo(7), MAT.glass({ attenuationColor: new THREE.Color('#7fd8c8'), attenuationDistance: 0.7, thickness: 0.25 })), rot: [0.9, 0.4, 0.2] },
  glassDrop: { make: () => new THREE.Mesh(dropGeo(), MAT.glass({ ior: 1.5, thickness: 0.9, attenuationColor: new THREE.Color('#bfe9ff'), attenuationDistance: 1.4 })), rot: [0, 0, 0.35] },
  mintLeaf: { make: leaf, rot: [-0.7, 0.3, 0.5] },
  silicaBeads: { make: () => beadPile(false, 16, 13), rot: [0.5, 0, 0] },
  pasteSwirl: { make: pasteSwirl, rot: [0.25, 0.4, 0] },
  gelBead: { make: () => sphere(0.5, MAT.glass({ ior: 1.45, thickness: 0.9, attenuationColor: new THREE.Color('#d8ecff'), attenuationDistance: 1.5 })) },
  waterDrop: { make: () => new THREE.Mesh(dropGeo(), MAT.glass({ ior: 1.33, thickness: 0.9, attenuationColor: new THREE.Color('#9fd2ff'), attenuationDistance: 0.9 })), rot: [0, 0, -0.25] },
  beadCluster: { make: () => beadPile(true, 14, 21), rot: [0.5, 0, 0] },
  chipDie: { make: chipDie, rot: [0.75, 0.5, 0] },
  waferShard: { make: waferShard, rot: [0.7, 0.3, 0.1] },
  crystalCan: { make: hc49, rot: [0.2, 0.5, 0.25] },
  fiberLoop: { make: fiberLoop, glow: '#6ff1ff' },
  aeroCube: { make: () => new THREE.Mesh(new RoundedBoxGeometry(1, 0.8, 0.9, 5, 0.06), aeroMat()), rot: [0.45, 0.6, 0] },
  tileChip: { make: () => { const t = buildTileBlock(0.55); return t.mesh; }, rot: [0.55, 0.65, 0] },
  hexTile: { make: hexTile, rot: [0.75, 0.3, 0] },
  ceramicBead: { make: () => sphere(0.5, MAT.ceramic('#f6f5f2')) },
  silicaShard: { make: () => new THREE.Mesh(shardGeo(19, [1, 0.3, 0.7], 12), new THREE.MeshPhysicalMaterial({ color: '#f7f7f5', roughness: 0.55, clearcoat: 0.2 })), rot: [0.8, 0.3, 0] },
  fiberOrb: { flat: glow2D('rgba(120,240,255,1)', 'rgba(40,160,255,.45)') },
  fiberOrbViolet: { flat: glow2D('rgba(190,150,255,1)', 'rgba(120,80,255,.45)') },
  ember: { flat: glow2D('rgba(255,200,120,1)', 'rgba(255,90,20,.55)') },
  smokePuff: { flat: flat((g, w) => { for (let i = 0; i < 9; i++) { const x = w * (0.3 + Math.random() * 0.4), y = w * (0.3 + Math.random() * 0.4), r = w * (0.18 + Math.random() * 0.12); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(225,240,255,.55)'); gr.addColorStop(1, 'rgba(160,200,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); } }) },
  dustStar: { flat: flat((g, w) => { const c = w / 2; const gr = g.createRadialGradient(c, c, 0, c, c, c * 0.5); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); g.fillStyle = 'rgba(255,247,225,.95)'; [0, 1].forEach(k => { g.save(); g.translate(c, c); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(0, -c * 0.95); g.quadraticCurveTo(c * 0.06, 0, 0, c * 0.95); g.quadraticCurveTo(-c * 0.06, 0, 0, -c * 0.95); g.fill(); g.restore(); }); }) },
  radarRing: { flat: flat((g, w) => { const c = w / 2; [0.3, 0.55, 0.8].forEach((r, i) => { g.strokeStyle = `rgba(130,240,255,${0.95 - i * 0.25})`; g.lineWidth = w * 0.035; g.shadowColor = 'rgba(80,220,255,.9)'; g.shadowBlur = 14; g.beginPath(); g.arc(c, c * 1.35, r * c * 1.1, Math.PI * 1.18, Math.PI * 1.82); g.stroke(); }); }, 256, 220) }
};

async function bakePieces(ids, size = 448) {
  const todo = ids.filter(id => !SPRITES[id] && PIECES[id]);
  if (!todo.length) return;
  const cv = document.createElement('canvas');
  const r = makeRenderer(cv, { dprMax: 1, preserve: true }); r.setPixelRatio(1); r.setSize(size, size, false);
  r.transmissionResolutionScale = 1;
  const scene = new THREE.Scene(); scene.environment = studioEnv(r);
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-3, 5, 4); scene.add(key);
  transBackdrop(scene, '#ffffff', '#9aa3b4');
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = size;
  const tg = tmp.getContext('2d', { willReadFrequently: true });
  for (const id of todo) {
    const def = PIECES[id];
    try {
      if (def.flat) { const f = def.flat(); registerSprite(id, f.url, f.aspect); continue; }
      const holder = new THREE.Group(); const obj = normalize(def.make(), 1.6, 1.6); holder.add(obj);
      holder.rotation.set(...(def.rot || [0.3, 0.5, 0])); scene.add(holder);
      const sph = new THREE.Box3().setFromObject(holder).getBoundingSphere(new THREE.Sphere());
      const d = sph.radius / Math.sin(cam.fov * Math.PI / 360) * 1.02;
      cam.position.set(sph.center.x, sph.center.y + d * 0.12, sph.center.z + d); cam.lookAt(sph.center);
      r.render(scene, cam);
      tg.clearRect(0, 0, size, size); tg.drawImage(cv, 0, 0);
      const data = tg.getImageData(0, 0, size, size).data;
      let x0 = size, y0 = size, x1 = 0, y1 = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (data[(y * size + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 <= x0) { scene.remove(holder); continue; }
      const pad = def.glow ? 26 : 3; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(size - 1, x1 + pad); y1 = Math.min(size - 1, y1 + pad);
      const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
      const og = out.getContext('2d');
      if (def.glow) { og.shadowColor = def.glow; og.shadowBlur = 22; og.drawImage(tmp, x0, y0, out.width, out.height, 0, 0, out.width, out.height); og.shadowBlur = 0; }
      og.drawImage(tmp, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
      const url = await new Promise(res => out.toBlob(b => res(b ? URL.createObjectURL(b) : out.toDataURL()), 'image/png'));
      registerSprite(id, url, out.height / out.width);
      scene.remove(holder);
    } catch (err) { console.warn('bake', id, err); }
    await nextFrame();
  }
  r.dispose(); r.forceContextLoss();
}
