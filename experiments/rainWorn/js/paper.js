// paper.js
//
// The paper is the terrain the rain runs over.
//
// Two scales of relief:
// - tooth:  the fine fibre texture of cold-press paper
// - cockle: the big soft buckles paper makes when it gets wet
//
// Tooth makes water wander and pigment granulate into the
// pits. Cockle decides where the water actually goes.
//
// Board tilt is a plane added on top, so "downhill" means
// paper relief + gravity.


let paperHeight;   // Float32Array, GW * GH
let paperTooth;    // 0..1, fine texture only (used for granulation + shading)

let tiltX = 0;
let tiltY = 0;


// --------------------------------------------------
// Build
// --------------------------------------------------

function buildPaper() {

  paperHeight = new Float32Array(GW * GH);
  paperTooth = new Float32Array(GW * GH);

  const cockleScale = random(0.008, 0.016);

  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {

      const i = y * GW + x;

      noiseDetail(2, 0.5);

      const tooth =
        noise(x * 0.21, y * 0.21, 11) * 0.65 +
        noise(x * 0.7, y * 0.7, 37) * 0.35;

      noiseDetail(3, 0.45);

      const cockle =
        noise(x * cockleScale + 500, y * cockleScale + 500);

      paperTooth[i] = tooth;

      paperHeight[i] =
        tooth * PAPER.toothRelief +
        cockle * PAPER.cockleRelief;
    }
  }

  noiseDetail(4, 0.5);
}


// --------------------------------------------------
// Sampling
// --------------------------------------------------

// Results land in these to avoid allocating per step.
let sampleH = 0;
let sampleGX = 0;
let sampleGY = 0;

// Bilinear height + gradient at a fractional position.
// Caller guarantees 0 <= x < GW - 1 and 0 <= y < GH - 1.
function samplePaper(x, y) {

  const ix = x | 0;
  const iy = y | 0;

  const fx = x - ix;
  const fy = y - iy;

  const i = iy * GW + ix;

  const h00 = paperHeight[i];
  const h10 = paperHeight[i + 1];
  const h01 = paperHeight[i + GW];
  const h11 = paperHeight[i + GW + 1];

  sampleGX = (h10 - h00) * (1 - fy) + (h11 - h01) * fy;
  sampleGY = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;

  sampleH =
    h00 * (1 - fx) * (1 - fy) +
    h10 * fx * (1 - fy) +
    h01 * (1 - fx) * fy +
    h11 * fx * fy;

  // Tilted board: height falls away in the tilt direction.
  sampleH -= x * tiltX + y * tiltY;
  sampleGX -= tiltX;
  sampleGY -= tiltY;
}
