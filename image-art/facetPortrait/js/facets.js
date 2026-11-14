// Turns the key points into facets: triangulate, keep the triangles
// inside the head, then merge neighbours into bigger planes.

// Small seeded random generator, so a seed always gives the same facets.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Delaunay triangulation (Bowyer-Watson). Returns [[a, b, c], ...].
export function triangulate(points) {
  const n = points.length;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const size = Math.max(maxX - minX, maxY - minY) * 20;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // Three far-away points whose triangle contains everything.
  const all = points.concat([
    { x: cx - size, y: cy - size },
    { x: cx + size, y: cy - size },
    { x: cx, y: cy + size }
  ]);

  let tris = [[n, n + 1, n + 2]];

  for (let i = 0; i < n; i++) {
    const bad = [];
    const keep = [];
    for (const t of tris) {
      (inCircumcircle(all, t, all[i]) ? bad : keep).push(t);
    }

    // The hole left by the bad triangles: edges used only once.
    const count = new Map();
    for (const t of bad) {
      for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) {
        const key = edgeKey(a, b);
        const e = count.get(key);
        if (e) e.n++; else count.set(key, { a, b, n: 1 });
      }
    }

    tris = keep;
    for (const e of count.values()) {
      if (e.n === 1) tris.push([e.a, e.b, i]);
    }
  }

  return tris.filter(t => t[0] < n && t[1] < n && t[2] < n);
}

function inCircumcircle(pts, t, p) {
  const a = pts[t[0]], b = pts[t[1]], c = pts[t[2]];
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-9) return false;
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const ux = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
  const uy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
  const r2 = (a.x - ux) ** 2 + (a.y - uy) ** 2;
  return (p.x - ux) ** 2 + (p.y - uy) ** 2 < r2;
}

function edgeKey(a, b) {
  return a < b ? a + "_" + b : b + "_" + a;
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > y) !== (b.y > y) &&
        x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

// The edge of a group of triangles, as one loop of point indices.
// Returns null if the group doesn't make a single clean shape.
function outlineOf(tris) {
  const count = new Map();
  for (const t of tris) {
    for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) {
      const key = edgeKey(a, b);
      const e = count.get(key);
      if (e) e.n++; else count.set(key, { a, b, n: 1 });
    }
  }

  const next = new Map();
  let edges = 0;
  for (const e of count.values()) {
    if (e.n !== 1) continue;
    edges++;
    for (const [from, to] of [[e.a, e.b], [e.b, e.a]]) {
      if (!next.has(from)) next.set(from, []);
      next.get(from).push(to);
    }
  }
  for (const list of next.values()) {
    if (list.length !== 2) return null;   // shape pinches at a point
  }

  const start = next.keys().next().value;
  const loop = [start];
  let prev = start;
  let cur = next.get(start)[0];
  while (cur !== start) {
    loop.push(cur);
    const [p, q] = next.get(cur);
    const step = p === prev ? q : p;
    prev = cur;
    cur = step;
    if (loop.length > edges) return null;
  }
  return loop.length === edges ? loop : null;
}

// True if the loop has no dents deeper than `tolerance` degrees.
function isConvex(loop, points, tolerance) {
  const limit = -Math.sin(tolerance * Math.PI / 180);
  let area = 0;
  for (let i = 0; i < loop.length; i++) {
    const a = points[loop[i]], b = points[loop[(i + 1) % loop.length]];
    area += a.x * b.y - b.x * a.y;
  }
  const dir = area >= 0 ? 1 : -1;
  for (let i = 0; i < loop.length; i++) {
    const a = points[loop[i]];
    const b = points[loop[(i + 1) % loop.length]];
    const c = points[loop[(i + 2) % loop.length]];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const l2 = Math.hypot(c.x - b.x, c.y - b.y) || 1;
    const cross = ((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)) / (l1 * l2);
    if (cross * dir < limit) return false;
  }
  return true;
}

// Builds the facets.
//   points    [{x, y}]
//   outline   indices into points, the head's silhouette
//   features  { name: [point index] }, shapes that stay whole
//   target    how many facets to aim for
//   seed      which merge order to use
// Returns [{ loop: [point index], tris: [[a, b, c]], feature: name or null }].
// Planes only merge while they stay nearly convex, so the count
// can stop above the target.
export function buildFacets(points, outline, features, target, seed, dent = 12) {
  const rng = makeRng(seed);
  const hull = outline.map(i => points[i]);

  const tris = triangulate(points).filter(t => {
    const x = (points[t[0]].x + points[t[1]].x + points[t[2]].x) / 3;
    const y = (points[t[0]].y + points[t[1]].y + points[t[2]].y) / 3;
    return pointInPolygon(x, y, hull);
  });

  // Every triangle starts as its own region.
  const regionOf = tris.map((_, i) => i);
  const regions = new Map(tris.map((t, i) => [i, [i]]));
  const featureOf = new Map();   // region id -> feature name

  // A triangle whose corners all belong to one feature is that
  // feature's. Join them up and lock them.
  for (const [name, ids] of Object.entries(features)) {
    const own = [];
    tris.forEach((t, ti) => {
      if (t.every(v => ids.includes(v))) own.push(ti);
    });
    if (!own.length) continue;
    if (outlineOf(own.map(i => tris[i]))) {
      for (const ti of own) {
        regions.delete(ti);
        regionOf[ti] = own[0];
      }
      regions.set(own[0], own);
      featureOf.set(own[0], name);
    } else {
      for (const ti of own) featureOf.set(ti, name);
    }
  }

  // Which triangles sit on each side of each edge.
  const sides = new Map();
  tris.forEach((t, ti) => {
    for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) {
      const key = edgeKey(a, b);
      if (!sides.has(key)) sides.set(key, []);
      sides.get(key).push(ti);
    }
  });

  while (regions.size > target) {
    // Every pair of neighbouring regions that could merge.
    const seen = new Set();
    const options = [];
    for (const pair of sides.values()) {
      if (pair.length !== 2) continue;
      const ra = regionOf[pair[0]];
      const rb = regionOf[pair[1]];
      if (ra === rb) continue;
      if (featureOf.has(ra) || featureOf.has(rb)) continue;
      const key = edgeKey(ra, rb);
      if (seen.has(key)) continue;
      seen.add(key);

      const merged = regions.get(ra).concat(regions.get(rb));
      const loop = outlineOf(merged.map(i => tris[i]));
      if (!loop || !isConvex(loop, points, dent)) continue;

      // Favour merging small regions, so sizes stay mixed but not wild.
      options.push({ ra, rb, weight: 1 / (merged.length * merged.length) });
    }
    if (!options.length) break;

    let pick = rng() * options.reduce((s, o) => s + o.weight, 0);
    let chosen = options[options.length - 1];
    for (const o of options) {
      pick -= o.weight;
      if (pick <= 0) { chosen = o; break; }
    }

    const moved = regions.get(chosen.rb);
    for (const ti of moved) regionOf[ti] = chosen.ra;
    regions.set(chosen.ra, regions.get(chosen.ra).concat(moved));
    regions.delete(chosen.rb);
  }

  return [...regions.entries()].map(([id, list]) => {
    const group = list.map(i => tris[i]);
    return {
      loop: outlineOf(group),
      tris: group,
      feature: featureOf.get(id) || null
    };
  });
}
