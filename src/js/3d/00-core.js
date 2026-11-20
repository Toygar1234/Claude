/* ───────────── 3D core: renderer, studio environment, textures, materials ───────────── */
const PERLIN = new ImprovedNoise();
const noise3 = (x, y, z) => PERLIN.noise(x, y, z);
function fbm(x, y, z, o = 4) { let a = 0.5, f = 1, s = 0; for (let i = 0; i < o; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return s; }
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const MEMO = new Map();
const memo = (k, f) => { if (!MEMO.has(k)) MEMO.set(k, f()); return MEMO.get(k); };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function makeRenderer(canvas, { dprMax = 2, preserve = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: preserve });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, dprMax));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1.0;
  r.setClearColor(0x000000, 0);
  return r;
}
function studioEnv(renderer, warm = 0) {
  const scene = new THREE.Scene();
  const dome = new THREE.SphereGeometry(30, 48, 24);
  const pos = dome.attributes.position, col = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 30;
    const c = new THREE.Color().setHSL(0.6 - warm * 0.5, 0.06, lerp(0.07, 0.42, smooth(-0.7, 1, y)));
    col.push(c.r, c.g, c.b);
  }
  dome.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  scene.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
  const panel = (w, h, p, k, color = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.copy(p); m.lookAt(0, 0, 0); scene.add(m);
  };
  panel(18, 9, V3(0, 19, 5), 3.4);
  panel(5, 18, V3(-18, 4, 9), 5.0);
  panel(4, 15, V3(18, 2, -1), 2.6, 0xdde8ff);
  panel(14, 5, V3(0, 4, -19), 1.8);
  panel(9, 7, V3(7, -2, 17), 1.25, 0xfff0dc);
  panel(30, 4, V3(0, -16, 0), 0.25);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(scene, 0.035).texture;
  pm.dispose();
  scene.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  return tex;
}
function canvasTex(w, h, draw, { srgb = true, repeat = false, aniso = 8 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
/* height field -> tangent-space normal map */
function normalTex(size, hf, strength = 2, repeat = true) {
  const hgt = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) hgt[y * size + x] = hf(x / size, y / size);
  return canvasTex(size, size, (g) => {
    const img = g.createImageData(size, size), d = img.data;
    const at = (x, y) => hgt[((y + size) % size) * size + ((x + size) % size)];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1), i = (y * size + x) * 4;
      d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, { srgb: false, repeat });
}
/* tileable noise via 4D-ish torus trick (sample on a circle in xz) */
function tileNoise(u, v, f, o = 4, seed = 0) {
  const a = u * Math.PI * 2, b = v * Math.PI * 2, r = f / (Math.PI * 2);
  return fbm(Math.cos(a) * r + seed, Math.sin(a) * r + Math.cos(b) * r * 0.7, Math.sin(b) * r + seed * 0.37, o);
}
const NT = {
  porous: () => memo('n-porous', () => normalTex(256, (u, v) => tileNoise(u, v, 22, 3, 3) + 0.5 * tileNoise(u, v, 60, 2, 9), 3.2)),
  fibers: () => memo('n-fibers', () => normalTex(256, (u, v) => Math.sin((v * 140 + tileNoise(u, v, 6, 2, 4) * 9) * Math.PI) * 0.25 + tileNoise(u, v, 40, 2, 1) * 0.4, 2.2)),
  rock: () => memo('n-rock', () => normalTex(256, (u, v) => tileNoise(u, v, 8, 5, 7) + 0.3 * tileNoise(u, v, 40, 3, 2), 4.5)),
  fine: () => memo('n-fine', () => normalTex(128, (u, v) => tileNoise(u, v, 30, 2, 11), 1.2)),
  ribs: () => memo('n-ribs', () => normalTex(128, (u, v) => Math.abs(Math.sin(u * Math.PI * 24)) * 0.6, 3)),
  brushed: () => memo('n-brushed', () => normalTex(256, (u, v) => tileNoise(u * 0.02, v, 90, 2, 5) * 0.3, 1.5))
};
function softDot(color = '255,255,255', size = 128) {
  return canvasTex(size, size, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, `rgba(${color},1)`); gr.addColorStop(0.25, `rgba(${color},.55)`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  }, { srgb: true, aniso: 1 });
}
function softDotP(color, size) { return memo('dot:' + color + size, () => { const t = softDot(color, size); t.premultiplyAlpha = true; return t; }); }
const MAT = {
  O: () => memo('m-O', () => new THREE.MeshPhysicalMaterial({ color: '#d81f2a', roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.35, sheenColor: new THREE.Color('#ff9a9a'), sheenRoughness: 0.45 })),
  Si: () => memo('m-Si', () => new THREE.MeshPhysicalMaterial({ color: '#2a3a63', roughness: 0.25, metalness: 0.45, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.6, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 520] })),
  glass: (o = {}) => new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.4, ior: 1.52, specularIntensity: 1, envMapIntensity: 1.15, ...o }),
  ceramic: (c = '#f4f2ee') => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.2 }),
  metal: (c = '#c9ced6', r = 0.25) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 1, roughness: r }),
  gold: () => memo('m-gold', () => new THREE.MeshPhysicalMaterial({ color: '#e7b85a', metalness: 1, roughness: 0.22 })),
  rock: (c = '#cdb185', r = 0.92) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, normalMap: NT.rock(), normalScale: new THREE.Vector2(0.9, 0.9) })
};
/* additive glow that keeps canvas alpha untouched (adds light over the DOM behind) */
function glowBlend(mat) {
  mat.transparent = true; mat.depthWrite = false; mat.premultipliedAlpha = true;
  mat.blending = THREE.CustomBlending;
  mat.blendEquation = THREE.AddEquation; mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneFactor;
  mat.blendEquationAlpha = THREE.AddEquation; mat.blendSrcAlpha = THREE.ZeroFactor; mat.blendDstAlpha = THREE.OneFactor;
  return mat;
}
function glowSprite(color, size, k = 1) {
  const m = glowBlend(new THREE.SpriteMaterial({ map: softDotP(color, 128), color: new THREE.Color(k, k, k) }));
  const s = new THREE.Sprite(m); s.scale.setScalar(size); return s;
}
const setGlow = (s, k) => s.material.color.setScalar(Math.max(0, k));
/* backdrop seen only inside refraction (transmission pass), invisible in the final image */
function transBackdrop(scene, top = '#c9ced8', bottom = '#5c6372') {
  const geo = new THREE.SphereGeometry(40, 32, 16), pos = geo.attributes.position, col = [], a = new THREE.Color(top), b = new THREE.Color(bottom), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { c.copy(b).lerp(a, smooth(-0.6, 0.8, pos.getY(i) / 40)); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true, toneMapped: false });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -10;
  m.onBeforeRender = r => { const inRT = r.getRenderTarget() !== null; mat.colorWrite = inRT; mat.depthWrite = inRT; };
  m.setColors = (t, bt) => { a.set(t); b.set(bt); for (let i = 0; i < pos.count; i++) { c.copy(b).lerp(a, smooth(-0.6, 0.8, pos.getY(i) / 40)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } geo.attributes.color.array.set(col); geo.attributes.color.needsUpdate = true; };
  scene.add(m); return m;
}
/* normalize a model: center it, scale to height h (and limit width) */
function normalize(obj, h = 2, maxW = 2.4) {
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj), s = new THREE.Vector3(), c = new THREE.Vector3();
  b.getSize(s); b.getCenter(c);
  const k = Math.min(h / s.y, maxW / Math.max(s.x, s.z));
  const wrap = new THREE.Group();
  obj.position.sub(c); wrap.add(obj); wrap.scale.setScalar(k);
  return wrap;
}
function frameCamera(cam, radius, aspect, margin = 1.12) {
  const vf = cam.fov * Math.PI / 180;
  const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
  const d = radius * margin / Math.sin(Math.min(vf, hf) / 2);
  return d;
}
