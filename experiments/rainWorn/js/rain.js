// rain.js
//
// Act two: rain.
//
// Each raindrop is a droplet from hydraulic erosion, except
// the terrain is the paper and what erodes is the paint.
//
// A drop runs downhill over the tooth, cockle and tilt.
// - Moving fast with spare capacity, it lifts pigment.
// - Slowing down or overloaded, it sets pigment back down,
//   preferring the pits in the paper (granulation).
// - When it runs out of water it dries as a ring, leaving a
//   hard tide-line edge, like a watercolour backrun.
// - If it runs off the page, its pigment goes with it.
//
// Every cell a drop crosses gets wetter. Wet paper gives up
// pigment more easily, so channels deepen into streaks.


let dropsFallen = 0;

const sediment = new Float32Array(16);


// --------------------------------------------------
// Rainfall
// --------------------------------------------------

function rainStep(count) {

  for (let n = 0; n < count; n++) {

    const [x, y] = rainPosition();

    const water = random() < RAIN.bigDropChance
      ? random(2, 3.5)
      : random(0.7, 1.2);

    runDrop(x, y, water);

    dropsFallen++;
  }
}


// Rain falls in passing showers rather than evenly.
function rainPosition() {

  const t = frameCount * 0.004;

  for (let tries = 0; tries < 6; tries++) {

    const x = random(1, GW - 2);
    const y = random(1, GH - 2);

    const shower = noise(x * 0.006 + t, y * 0.006, 900 + t * 0.5);

    if (random() < shower * shower * 1.8) {
      return [x, y];
    }
  }

  return [random(1, GW - 2), random(1, GH - 2)];
}


function dryOut() {
  for (let i = 0; i < wetness.length; i++) {
    wetness[i] *= RAIN.dryRate;
  }
}


// --------------------------------------------------
// One drop
// --------------------------------------------------

function runDrop(x, y, water) {

  const K = pigments.length;
  const D = DROP;

  sediment.fill(0);

  let dx = 0;
  let dy = 0;
  let speed = 1;

  const startWater = water;

  for (let step = 0; step < D.maxSteps; step++) {

    samplePaper(x, y);

    const h = sampleH;

    // Inertia vs. following the slope.
    dx = dx * D.inertia - sampleGX * (1 - D.inertia);
    dy = dy * D.inertia - sampleGY * (1 - D.inertia);

    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 1e-6) {
      const a = random(TWO_PI);
      dx = Math.cos(a);
      dy = Math.sin(a);
    } else {
      dx /= len;
      dy /= len;
    }

    const nx = x + dx;
    const ny = y + dy;

    // Off the page: the pigment leaves with it.
    if (nx < 0 || nx >= GW - 1 || ny < 0 || ny >= GH - 1) {
      return;
    }

    samplePaper(nx, ny);

    const dh = sampleH - h;

    const carried = sumSediment(K);

    const capacity =
      Math.max(-dh, D.minSlope) * speed * water * D.capacity;

    if (dh > 0 || carried > capacity) {

      // Pooling uphill, or overloaded: set pigment down.
      const frac = dh > 0
        ? Math.min(0.5, dh * D.uphillDeposit)
        : (carried - capacity) / carried * D.deposit;

      depositAt(x, y, frac, K);

    } else {

      // Spare capacity: lift pigment from under the drop.
      const i = (y | 0) * GW + (x | 0);
      const wetBoost = D.dryLift + wetness[i];

      const lift = Math.min(
        D.maxLift,
        (capacity - carried) * D.erode * wetBoost
      );

      liftAt(x, y, lift, K);
    }

    wetCell(x, y, water);

    speed = Math.sqrt(Math.max(0.01, speed * speed - dh * D.gravity));
    speed = Math.min(speed, D.maxSpeed);

    water *= 1 - D.evaporate;

    x = nx;
    y = ny;

    if (water < 0.04) {
      break;
    }
  }

  tideRing(x, y, 1.5 + startWater * random(1.5, 4), K);
}


// --------------------------------------------------
// Pigment transfer
// --------------------------------------------------

function sumSediment(K) {
  let s = 0;
  for (let k = 0; k < K; k++) {
    s += sediment[k];
  }
  return s;
}


// Take a fraction of each pigment from the four cells
// under (x, y), weighted bilinearly.
function liftAt(x, y, lift, K) {

  const ix = x | 0;
  const iy = y | 0;
  const fx = x - ix;
  const fy = y - iy;

  const i = iy * GW + ix;

  const cells = [i, i + 1, i + GW, i + GW + 1];
  const weights = [
    (1 - fx) * (1 - fy),
    fx * (1 - fy),
    (1 - fx) * fy,
    fx * fy
  ];

  for (let k = 0; k < K; k++) {

    const d = pigments[k].density;
    const rate = lift * pigments[k].lift;

    for (let c = 0; c < 4; c++) {
      const take = d[cells[c]] * rate * weights[c];
      d[cells[c]] -= take;
      sediment[k] += take;
    }
  }
}


// Put down a fraction of what the drop carries, favouring
// the low pits of the paper tooth.
function depositAt(x, y, frac, K) {

  const ix = x | 0;
  const iy = y | 0;
  const fx = x - ix;
  const fy = y - iy;

  const i = iy * GW + ix;

  const cells = [i, i + 1, i + GW, i + GW + 1];
  const bilinear = [
    (1 - fx) * (1 - fy),
    fx * (1 - fy),
    (1 - fx) * fy,
    fx * fy
  ];

  const weights = [0, 0, 0, 0];
  let total = 0;

  for (let c = 0; c < 4; c++) {

    // Pits in the tooth catch more; cells already thick with
    // paint catch less, so pigment spreads instead of clotting.
    let load = 0;
    for (let k = 0; k < K; k++) {
      load += pigments[k].density[cells[c]];
    }

    weights[c] =
      bilinear[c] *
      (DROP.granulation + (1 - paperTooth[cells[c]])) /
      (1 + load * DROP.crowding);

    total += weights[c];
  }

  if (total <= 0) {
    return;
  }

  for (let k = 0; k < K; k++) {

    const amt = sediment[k] * frac;

    if (amt <= 0) {
      continue;
    }

    sediment[k] -= amt;

    const d = pigments[k].density;

    for (let c = 0; c < 4; c++) {
      d[cells[c]] += amt * weights[c] / total;
    }
  }
}


// A drying drop pushes its pigment out to its edge.
function tideRing(x, y, r, K) {

  const points = 12;

  for (let p = 0; p < points; p++) {

    const a = (p / points) * TWO_PI + random(-0.2, 0.2);
    const rr = r * random(0.75, 1.25);

    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;

    if (px < 0 || px >= GW - 1 || py < 0 || py >= GH - 1) {
      continue;
    }

    // Spread the remainder evenly over the points left.
    depositAt(px, py, 1 / (points - p), K);
  }
}


function wetCell(x, y, water) {
  const i = (y | 0) * GW + (x | 0);
  wetness[i] = Math.min(1, wetness[i] + DROP.wetting * water);
}
