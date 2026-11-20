/* ───────────── SiO₂ structures (Å) and the morphing ball-and-stick model ───────────── */
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
function uniqFrac(ops, p) {
  const out = [];
  ops.forEach(op => {
    const q = op(...p).map(v => ((v % 1) + 1) % 1);
    if (!out.some(r => r.every((v, i) => { const d = Math.abs(v - q[i]); return d < 1e-4 || Math.abs(d - 1) < 1e-4; }))) out.push(q);
  });
  return out;
}
/* α-quartz, P3₂21, a = 4.9137 Å, c = 5.4047 Å (Si–O 1.604 / 1.613 Å). Crystal c-axis -> world Y. */
function genQuartz(R = 4.7, Hh = 5.5) {
  const a = 4.9137, c = 5.4047;
  const ops = [(x, y, z) => [x, y, z], (x, y, z) => [-y, x - y, z + 2 / 3], (x, y, z) => [-x + y, -x, z + 1 / 3], (x, y, z) => [y, x, -z], (x, y, z) => [x - y, -y, -z + 1 / 3], (x, y, z) => [-x, -x + y, -z + 2 / 3]];
  const siF = uniqFrac(ops, [0.4697, 0, 2 / 3]), oF = uniqFrac(ops, [0.4135, 0.2669, 0.1191 + 2 / 3]);
  const cart = ([x, y, z]) => [a * (x - 0.5 * y), c * z, a * (Math.sqrt(3) / 2 * y)];
  const SI = [], OO = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) for (let k = -3; k <= 3; k++) {
    siF.forEach(f => SI.push(cart([f[0] + i, f[1] + j, f[2] + k])));
    oF.forEach(f => OO.push(cart([f[0] + i, f[1] + j, f[2] + k])));
  }
  return cutChunk(SI, OO, R, Hh, 1.75);
}
/* stishovite, rutile type P4₂/mnm, a = 4.1772, c = 2.6651, x(O) = 0.3062 */
function genStish(R = 4.7, Hh = 5.5) {
  const a = 4.1772, c = 2.6651, x = 0.3062;
  const siF = [[0, 0, 0], [.5, .5, .5]], oF = [[x, x, 0], [-x, -x, 0], [.5 + x, .5 - x, .5], [.5 - x, .5 + x, .5]];
  const cart = ([fx, fy, fz]) => [a * fx, c * fz, a * fy];
  const SI = [], OO = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) for (let k = -5; k <= 5; k++) {
    siF.forEach(f => SI.push(cart([f[0] + i, f[1] + j, f[2] + k])));
    oF.forEach(f => OO.push(cart([f[0] + i, f[1] + j, f[2] + k])));
  }
  return cutChunk(SI, OO, R * 0.86, Hh * 0.86, 1.9);
}
function cutChunk(SI, OO, R, Hh, maxBond) {
  // center on the Si closest to the origin
  let c0 = SI.reduce((b, p) => (Math.hypot(...p) < Math.hypot(...b) ? p : b), SI[0]);
  const sh = p => [p[0] - c0[0], p[1] - c0[1], p[2] - c0[2]];
  const si = SI.map(sh).filter(p => p[0] * p[0] + p[2] * p[2] < R * R && Math.abs(p[1]) < Hh);
  si.sort((p, q) => Math.hypot(...p) - Math.hypot(...q));
  const oAll = OO.map(sh), o = [], oIdx = new Map(), bonds = [];
  si.forEach((s, i) => {
    oAll.forEach((p, j) => {
      if (Math.abs(p[0] - s[0]) > maxBond || Math.abs(p[1] - s[1]) > maxBond || Math.abs(p[2] - s[2]) > maxBond) return;
      if (dist3(p, s) < maxBond) { if (!oIdx.has(j)) { oIdx.set(j, o.length); o.push(p); } bonds.push([i, oIdx.get(j)]); }
    });
  });
  return { si, o, bonds };
}
/* amorphous silica: same connectivity as quartz, randomised and relaxed (Zachariasen's continuous random network) */
function vitrify(Q) {
  const si = Q.si.map(p => p.slice()), o = Q.o.map(p => p.slice()), r = rng(1932);
  const disp = (p, s) => [fbm(p[0] * .3 + s, p[1] * .3, p[2] * .3, 3), fbm(p[0] * .3, p[1] * .3 + s + 7, p[2] * .3, 3), fbm(p[0] * .3, p[1] * .3, p[2] * .3 + s + 13, 3)];
  [...si, ...o].forEach((p, i) => { const d = disp(p, 4.2); p[0] += d[0] * 2.4 + (r() - .5) * .45; p[1] += d[1] * 2.4 + (r() - .5) * .45; p[2] += d[2] * 2.4 + (r() - .5) * .45; });
  si[0][0] = si[0][1] = si[0][2] = 0;
  const bySi = si.map(() => []); Q.bonds.forEach(([s, k]) => bySi[s].push(k));
  const byO = o.map(() => []); Q.bonds.forEach(([s, k]) => byO[k].push(s));
  const pull = (A, B, L, k, onlyPush) => {
    const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], d = Math.hypot(dx, dy, dz) || 1e-6;
    if (onlyPush && d > L) return;
    const f = (d - L) / d * k * 0.5;
    A[0] += dx * f; A[1] += dy * f; A[2] += dz * f; B[0] -= dx * f; B[1] -= dy * f; B[2] -= dz * f;
  };
  for (let it = 0; it < 90; it++) {
    Q.bonds.forEach(([s, k]) => pull(si[s], o[k], 1.61, 0.55));
    bySi.forEach(list => { for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) pull(o[list[i]], o[list[j]], 2.63, 0.3); });
    byO.forEach(list => { if (list.length === 2) pull(si[list[0]], si[list[1]], 3.05, 0.3, true); });
    const c = si[0].slice(); [...si, ...o].forEach(p => { p[0] -= c[0]; p[1] -= c[1]; p[2] -= c[2]; });
  }
  return { si, o, bonds: Q.bonds };
}
function tetraStruct() {
  const d = 1.61, k = d / Math.sqrt(3);
  const dirs = [[k, k, k], [k, -k, -k], [-k, k, -k], [-k, -k, k]];
  const q = new THREE.Quaternion().setFromUnitVectors(V3(1, 1, 1).normalize(), V3(0, 1, 0));
  return dirs.map(p => { const v = V3(...p).applyQuaternion(q); return [v.x, v.y, v.z]; });
}

class AtomModel {
  constructor() {
    const Q = genQuartz(), G = vitrify(Q), St = genStish();
    this.group = new THREE.Group();
    const nQS = Q.si.length, nQO = Q.o.length;
    // pool: quartz atoms first; stishovite atoms are matched greedily to them, extras appended
    const poolSi = Q.si.length, poolO = Q.o.length;
    const assign = (src, dstPos, used, poolLen) => src.map(p => {
      let best = -1, bd = 1e9;
      for (let i = 0; i < dstPos.length; i++) { if (used.has(i)) continue; const d = dist3(p, dstPos[i]); if (d < bd) { bd = d; best = i; } }
      if (best < 0 || bd > 6) { best = poolLen.n++; } used.add(best); return best;
    });
    const nSi = { n: poolSi }, nO = { n: poolO };
    const stSiMap = assign(St.si, Q.si, new Set(), nSi), stOMap = assign(St.o, Q.o, new Set(), nO);
    this.nSi = nSi.n; this.nO = nO.n;
    // per-view arrays
    const mk = n => ({ pos: Array.from({ length: n }, () => [0, 0, 0]), on: new Float32Array(n) });
    const views = [0, 1, 2, 3].map(() => ({ Si: mk(this.nSi), O: mk(this.nO), bonds: new Set() }));
    // view 1 quartz, view 2 glass
    Q.si.forEach((p, i) => { views[1].Si.pos[i] = p.slice(); views[1].Si.on[i] = 1; views[2].Si.pos[i] = G.si[i].slice(); views[2].Si.on[i] = 1; });
    Q.o.forEach((p, i) => { views[1].O.pos[i] = p.slice(); views[1].O.on[i] = 1; views[2].O.pos[i] = G.o[i].slice(); views[2].O.on[i] = 1; });
    // view 3 stishovite
    St.si.forEach((p, i) => { views[3].Si.pos[stSiMap[i]] = p.slice(); views[3].Si.on[stSiMap[i]] = 1; });
    St.o.forEach((p, i) => { views[3].O.pos[stOMap[i]] = p.slice(); views[3].O.on[stOMap[i]] = 1; });
    // view 0 tetrahedron (central Si + its 4 O), enlarged
    const TS = 2.05, tO = Q.bonds.filter(b => b[0] === 0).map(b => b[1]);
    const td = tetraStruct();
    views[0].Si.pos[0] = [0, 0, 0]; views[0].Si.on[0] = 1;
    // map the 4 O to ideal tetra directions, keeping their order by proximity
    const usedT = new Set();
    tO.forEach(k => { const p = Q.o[k]; let bi = 0, bd = 1e9; td.forEach((t, i) => { if (usedT.has(i)) return; const d = dist3(p, t); if (d < bd) { bd = d; bi = i; } }); usedT.add(bi); views[0].O.pos[k] = td[bi].map(v => v * TS); views[0].O.on[k] = 1; });
    // bonds (union) with per-view presence
    this.bondList = []; const bk = new Map();
    const addB = (s, k, v) => { const key = s + ':' + k; if (!bk.has(key)) { bk.set(key, this.bondList.length); this.bondList.push({ s, k, on: [0, 0, 0, 0] }); } this.bondList[bk.get(key)].on[v] = 1; };
    Q.bonds.forEach(([s, k]) => { addB(s, k, 1); addB(s, k, 2); });
    tO.forEach(k => addB(0, k, 0));
    St.bonds.forEach(([s, k]) => addB(stSiMap[s], stOMap[k], 3));
    // hidden atoms: park them near their nearest visible position, pushed outward
    const park = (arr, which) => {
      for (let i = 0; i < arr.length; i++) {
        const src = [1, 3, 2].map(v => views[v][which]).find(V => V.on[i]);
        const p = src ? src.pos[i] : [0, 0, 0];
        views.forEach(V => { if (!V[which].on[i]) { const L = Math.hypot(...p) || 1; V[which].pos[i] = p.map(c => c * (1 + 7 / L)); } });
      }
    };
    park(views[0].Si.pos, 'Si'); park(views[0].O.pos, 'O');
    this.views = views;
    this.view = 0; this.from = 0; this.t = 1; this.morphStart = 0; this.morphDur = 1.25;
    // meshes
    const sph = new THREE.SphereGeometry(1, 48, 32);
    this.rSi = 0.5; this.rO = 0.38; this.rB = 0.15;
    this.siMesh = new THREE.InstancedMesh(sph, MAT.Si(), this.nSi);
    this.oMesh = new THREE.InstancedMesh(sph, MAT.O(), this.nO);
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 22, 1, true); cyl.translate(0, 0.5, 0);
    this.bSi = new THREE.InstancedMesh(cyl, MAT.Si(), this.bondList.length);
    this.bO = new THREE.InstancedMesh(cyl, MAT.O(), this.bondList.length);
    [this.siMesh, this.oMesh, this.bSi, this.bO].forEach(m => { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; this.group.add(m); });
    // tetra annotation: translucent faces + edges + angle arc
    const tp = tetraStruct().map(p => V3(...p).multiplyScalar(TS));
    const tg = new THREE.BufferGeometry().setFromPoints([tp[0], tp[1], tp[2], tp[0], tp[2], tp[3], tp[0], tp[3], tp[1], tp[1], tp[3], tp[2]]);
    tg.computeVertexNormals();
    this.tetraFaces = new THREE.Mesh(tg, new THREE.MeshPhysicalMaterial({ color: '#8fa3d8', transparent: true, opacity: 0.12, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false }));
    const eg = new THREE.EdgesGeometry(tg);
    this.tetraEdges = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: '#7d8fbf', transparent: true, opacity: 0.55 }));
    const a1 = tp[0].clone().normalize(), a2 = tp[1].clone().normalize(), arcPts = [];
    for (let i = 0; i <= 32; i++) { const v = a1.clone().lerp(a2, i / 32).normalize().multiplyScalar(1.15); arcPts.push(v); }
    this.arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 40, 0.035, 8), new THREE.MeshBasicMaterial({ color: '#E0262F', transparent: true }));
    this.arcMid = arcPts[16].clone().multiplyScalar(1.35);
    this.tp = tp;
    [this.tetraFaces, this.tetraEdges, this.arc].forEach(o => this.group.add(o));
    this.cur = { Si: views[0].Si.pos.map(p => p.slice()), O: views[0].O.pos.map(p => p.slice()), sSi: Float32Array.from(views[0].Si.on), sO: Float32Array.from(views[0].O.on), bon: new Float32Array(this.bondList.length) };
    this.introK = 0; this.hover = { type: null, i: -1 }; this.dirty = true;
    // stagger by distance
    this.delaySi = views[1].Si.pos.map(p => clamp(Math.hypot(...p) / 12, 0, 1) * 0.35);
    this.delayO = views[1].O.pos.map(p => clamp(Math.hypot(...p) / 12, 0, 1) * 0.35);
    this.radius = views.map((V, vi) => { let mx = 0; ['Si', 'O'].forEach(w => V[w].pos.forEach((p, i) => { if (V[w].on[i]) mx = Math.max(mx, Math.hypot(...p)); })); return mx + (vi === 0 ? 0.9 : 0.55); });
    this.atomF = [1.4, 1, 1, 1]; this.bondF = [1.7, 1, 1, 1];
    this.bondsOf = v => this.bondList.filter(b => b.on[v]);
    this.apply(1);
  }
  morph(to) { if (to === this.view && this.t >= 1) return; this.from = this.view; this.view = to; this.t = 0; this.morphStart = performance.now(); this.dirty = true; }
  update(now) {
    let e = 1;
    if (this.t < 1) { this.t = REDUCED.matches ? 1 : clamp((now - this.morphStart) / 1000 / this.morphDur, 0, 1); e = this.t; this.dirty = true; }
    if (this.introK < 1) { this.introStart ||= now; this.introK = REDUCED.matches ? 1 : clamp((now - this.introStart) / 1500, 0, 1); this.dirty = true; }
    if (!this.dirty) return;
    this.apply(e); if (this.t >= 1 && this.introK >= 1) this.dirty = false;
  }
  apply(T) {
    const A = this.views[this.from], B = this.views[this.view], m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const ein = REDUCED.matches ? 1 : this.introK;
    const vf = smooth(0.15, 0.85, T), aF = lerp(this.atomF[this.from], this.atomF[this.view], vf), bF = lerp(this.bondF[this.from], this.bondF[this.view], vf);
    const atom = (which, mesh, r, delay) => {
      const PA = A[which].pos, PB = B[which].pos, cur = this.cur[which], sc = this.cur['s' + which];
      for (let i = 0; i < PA.length; i++) {
        const k = easeInOutCubic(clamp((T - delay[i] * (this.from === this.view ? 0 : 1)) / (1 - 0.35), 0, 1));
        cur[i][0] = lerp(PA[i][0], PB[i][0], k); cur[i][1] = lerp(PA[i][1], PB[i][1], k); cur[i][2] = lerp(PA[i][2], PB[i][2], k);
        const vis = lerp(A[which].on[i], B[which].on[i], k);
        const intro = clamp(ein * 1.6 - delay[i] * 1.8, 0, 1);
        let sz = r * vis * easeOutCubic(intro);
        if (this.hover.type === which && this.hover.i === i) sz *= 1.22;
        sc[i] = vis;
        p.set(...cur[i]); s.setScalar(sz > 0.004 ? sz : 0); m.compose(p, q.identity(), s); mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    const dS = this.delaySi.concat(new Array(this.nSi).fill(0)), dO = this.delayO.concat(new Array(this.nO).fill(0));
    atom('Si', this.siMesh, this.rSi * aF, dS); atom('O', this.oMesh, this.rO * aF, dO);
    const up = V3(0, 1, 0), a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3();
    this.bondList.forEach((bd, i) => {
      const pa = bd.on[this.from], pb = bd.on[this.view];
      const kb = pa === pb ? 1 : (pb ? smooth(0.45, 1, T) : 1 - smooth(0, 0.5, T));
      const vis = (pa === pb ? pb : (pb ? kb : kb)) * clamp(ein * 1.4 - 0.3, 0, 1);
      a.set(...this.cur.Si[bd.s]); b.set(...this.cur.O[bd.k]); mid.addVectors(a, b).multiplyScalar(0.5);
      const rr = this.rB * bF * vis, on = rr > 0.004;
      dir.subVectors(mid, a); let L = dir.length(); q.setFromUnitVectors(up, dir.normalize());
      m.compose(a, q, on ? s.set(rr, L, rr) : s.set(0, 0, 0)); this.bSi.setMatrixAt(i, m);
      dir.subVectors(b, mid); L = dir.length(); q.setFromUnitVectors(up, dir.normalize());
      m.compose(mid, q, on ? s.set(rr, L, rr) : s.set(0, 0, 0)); this.bO.setMatrixAt(i, m);
      this.cur.bon[i] = vis;
    });
    this.bSi.instanceMatrix.needsUpdate = true; this.bO.instanceMatrix.needsUpdate = true;
    const tv = lerp(this.from === 0 ? 1 : 0, this.view === 0 ? 1 : 0, smooth(0.2, 0.8, T)) * clamp(ein * 1.3 - 0.5, 0, 1);
    this.tetraFaces.material.opacity = 0.13 * tv; this.tetraEdges.material.opacity = 0.6 * tv; this.arc.material.opacity = tv;
    this.tetraFaces.visible = this.tetraEdges.visible = this.arc.visible = tv > 0.01;
  }
  /* callout anchors per view, in model space */
  anchors() {
    const v = this.view, C = this.cur;
    const visO = C.O.map((p, i) => [p, i]).filter(([, i]) => C.sO[i] > 0.5);
    const top = (arr) => arr.reduce((b, x) => (x[0][1] > b[0][1] ? x : b), arr[0]);
    if (v === 0) {
      const o = this.tp[0];
      return [
        { id: 'si', p: V3(0, 0, 0), t: 'Si', s: 'silisyum', off: [-1.9, -0.4, 0] },
        { id: 'o', p: o.clone(), t: 'O', s: 'oksijen', off: [0.4, 0.9, 0] },
        { id: 'len', p: this.tp[2].clone().multiplyScalar(0.5), t: '1,61 Å', s: 'Si–O', off: [-1.5, -0.7, 0] },
        { id: 'ang', p: this.arcMid.clone(), t: '109,5°', s: 'O–Si–O', off: [1.4, 0.2, 0] }
      ];
    }
    if (!visO.length) return [];
    if (v === 3) return [{ id: 'six', p: V3(0, 0, 0), t: '6 komşu', s: 'her Si', off: [0, 2.2, 0] }];
    const front = visO.reduce((b, x) => (x[0][2] > b[0][2] ? x : b), visO[0]);
    const t = top(visO);
    return v === 1
      ? [{ id: 'bridge', p: V3(...front[0]), t: 'Köprü oksijen', s: '2 Si arasında', off: [1.2, -1.2, 0] }, { id: 'helix', p: V3(...t[0]), t: 'Sarmal zincir', s: 'c ekseni boyunca', off: [0, 1.1, 0] }]
      : [{ id: 'bridge', p: V3(...front[0]), t: 'Köprü oksijen', s: 'bağlar kopmadı', off: [1.2, -1.2, 0] }, { id: 'rand', p: V3(...t[0]), t: 'Düzensiz ağ', s: 'uzun mesafeli düzen yok', off: [0, 1.1, 0] }];
  }
  neighbours(type, i) { const v = this.view; return this.bondList.filter(b => b.on[v] && (type === 'Si' ? b.s === i : b.k === i)).length; }
}
