// pigment.js
//
// Each palette colour becomes a pigment layer: a density
// value per grid cell. Nothing is stored as RGB.
//
// Rendering is glazing, not alpha blending. Each pigment
// absorbs light by channel, so overlapping washes darken and
// mix the way transparent watercolour does:
//
//   colour = paper * exp(-sum(density_k * absorb_k))
//
// absorb_k is chosen so that density 1 on bare paper gives
// exactly the palette colour.


const DEFAULT_PAPER = "#f1ebde";

let paperHex;
let paperRGB;

let pigments = [];          // { hex, role, lum, absorb[3], lift, strength, density }
let pigmentSnapshot = [];   // densities before the rain, for the B key

let wetness;                // Float32Array, 0..1, how wet each cell is
let dryWetness;             // all zeros, used for the "before" view

let toothShade;             // per-cell paper shading


// --------------------------------------------------
// Palette -> pigments
// --------------------------------------------------

function setupPigments(palette) {

  const colors = palette.colors;

  // The lightest paper-ish colour becomes the paper.
  // Light colours can't show in a subtractive glaze anyway.
  const paper = colors.find(c =>
    ["paper", "highlight", "light"].includes(c.role) &&
    luminance(c.hex) > 0.82
  );

  paperHex = paper ? paper.hex : DEFAULT_PAPER;
  paperRGB = hexToRGB(paperHex);

  pigments = colors
    .filter(c => c !== paper && luminance(c.hex) < 0.85)
    .slice(0, 9)
    .map(c => {

      const rgb = hexToRGB(c.hex);

      const absorb = rgb.map((v, ch) =>
        -Math.log(constrain(v / paperRGB[ch], 0.035, 1))
      );

      const lum = luminance(c.hex);

      return {
        hex: c.hex,
        role: c.role,
        lum,
        absorb,

        // Some pigments stain and barely lift; others wash
        // off easily. Watercolourists know which is which.
        lift: random(0.3, 1),

        // Dark pigments are used more thinly.
        strength: map(lum, 0.05, 0.6, 0.5, 1, true),

        density: new Float32Array(GW * GH)
      };
    });

  wetness = new Float32Array(GW * GH);
  dryWetness = new Float32Array(GW * GH);

  toothShade = new Float32Array(GW * GH);

  for (let i = 0; i < toothShade.length; i++) {
    toothShade[i] = 0.93 + 0.07 * paperTooth[i];
  }
}


function snapshotPigments() {
  pigmentSnapshot = pigments.map(p => p.density.slice());
}


function darkestPigmentIndex() {

  let best = 0;

  for (let k = 1; k < pigments.length; k++) {
    if (pigments[k].lum < pigments[best].lum) {
      best = k;
    }
  }

  return best;
}


function pigmentIndexByRole(role) {
  return pigments.findIndex(p => p.role === role);
}


// --------------------------------------------------
// Render
// --------------------------------------------------

function renderPigments(img, densities, wet) {

  img.loadPixels();

  const px = img.pixels;
  const K = pigments.length;

  const pr = paperRGB[0];
  const pg = paperRGB[1];
  const pb = paperRGB[2];

  for (let i = 0, j = 0; i < GW * GH; i++, j += 4) {

    let ar = 0;
    let ag = 0;
    let ab = 0;

    for (let k = 0; k < K; k++) {

      const d = densities[k][i];

      if (d > 0.0005) {
        const a = pigments[k].absorb;
        ar += d * a[0];
        ag += d * a[1];
        ab += d * a[2];
      }
    }

    // Wet paint reads deeper and a little darker.
    const w = wet[i];
    const deepen = 1 + RENDER.wetDeepen * w;
    const shade = toothShade[i] * (1 - RENDER.wetDarken * w);

    px[j] = pr * Math.exp(-ar * deepen) * shade;
    px[j + 1] = pg * Math.exp(-ag * deepen) * shade;
    px[j + 2] = pb * Math.exp(-ab * deepen) * shade;
    px[j + 3] = 255;
  }

  img.updatePixels();
}


// --------------------------------------------------
// Colour utility
// --------------------------------------------------

function hexToRGB(hex) {
  const c = color(hex);
  return [red(c), green(c), blue(c)];
}

function luminance(hex) {
  const [r, g, b] = hexToRGB(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
