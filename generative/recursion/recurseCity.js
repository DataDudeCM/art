/*
  RECURSIVE CITY - V1
  -------------------
  Top-down generative city built through recursive subdivision.

  R = regenerate
  S = save image

  Chris / cmartcreations
*/

const CANVAS_SIZE = 1200;

const MAX_DEPTH = 10;
const MIN_REGION = 10;

let seedValue;

// --------------------------------------------
// PALETTE
// --------------------------------------------

const PAPER = "#e7e0d2";
const INK = "#262522";

const palette = [
  "#30475e",   // blue gray
  "#6b705c",   // olive
  "#a26769",   // muted red
  "#8c6d51",   // brown
  "#5c677d",   // steel
  "#b08968"    // warm tan
];

const parkColors = [
  "#76866b",
  "#87977a",
  "#68755c"
];


// ==========================================================
// SETUP
// ==========================================================

function setup() {

createCanvas(CANVAS_SIZE, CANVAS_SIZE);

pixelDensity(1);

seedValue = floor(random(1000000));

generateCity();

noLoop();
}


// ==========================================================
// DRAW
// ==========================================================

function draw() {
// Static artwork.
}


// ==========================================================
// GENERATE CITY
// ==========================================================

function generateCity() {

randomSeed(seedValue);
noiseSeed(seedValue);

background(PAPER);

// subtle paper texture
drawPaperTexture();

const margin = 30;

let rootDNA = {
  density: random(0.55, 0.9),
  order: random(0.65, 0.95),
  age: random(0.1, 0.6),
  green: random(0.05, 0.25),
  decay: random(0.05, 0.25),
  paletteIndex: floor(random(palette.length))
};

subdivideRegion(
  margin,
  margin,
  width - margin * 2,
  height - margin * 2,
  MAX_DEPTH,
  rootDNA
);
}


// ==========================================================
// RECURSIVE CITY ENGINE
// ==========================================================

function subdivideRegion(x, y, w, h, depth, dna) {

  // ------------------------------------------------
  // DENSITY CONTROLS BLOCK SCALE
  // ------------------------------------------------

  // Apply environment to the inherited DNA.
  // From this point forward, "dna" means the locally influenced DNA.
  dna = applySpatialInfluence(x, y, w, h, dna);

  let generation = MAX_DEPTH - depth;

  // Outer city stops after roughly 3 generations.
  // Downtown can continue all the way to MAX_DEPTH.
  let targetGeneration = floor(
    lerp(3, MAX_DEPTH, dna.centerFactor)
  );
  // Sparse areas stop subdividing at larger sizes.
  // Dense areas are allowed to become much smaller.
  let localMinRegion = lerp(
    160,   // density = 0 -> large blocks
    10,    // density = 1 -> small blocks
    dna.density
  );


  // Low-density areas also have a greater chance
  // of stopping early.
  let stopChance = lerp(
    0.22,  // sparse
    0.005,  // dense
    dna.density
  );

  let spatialStop =
    generation >= targetGeneration;


  // ------------------------------------------------
  // BASE CASE
  // ------------------------------------------------

  if (
    depth <= 0 ||
    spatialStop ||
    w < 10 ||
    h < 10
  ) {
    renderBlock(x, y, w, h, dna);
    return;
  }

  // --------------------------------
  // DECIDE SPLIT DIRECTION
  // --------------------------------

  let vertical;

  // Strong aspect ratios force a sensible split.
  if (w > h * 1.35) {

    vertical = true;

  } else if (h > w * 1.35) {

    vertical = false;

  } else {

    // ordered neighborhoods are more predictable
    if (random() < dna.order) {

      vertical = random() < 0.5;

    } else {

      vertical = random() < map(
        noise(x * 0.002, y * 0.002),
        0,
        1,
        0.2,
        0.8
      );
    }
  }


  // --------------------------------
  // STREET WIDTH
  // --------------------------------

  // Higher-level roads are wider.

  let roadWidth = lerp(
    2,    // outskirts
    10,   // downtown
    dna.centerFactor
  );

  // --------------------------------
  // SPLIT LOCATION
  // --------------------------------

  let centerBias = map(
    dna.order,
    0,
    1,
    0.22,
    0.08
  );

  let ratio =
    0.5 +
    random(-centerBias, centerBias);


  // ========================================================
  // VERTICAL SPLIT
  // ========================================================

  if (vertical) {

    let available = w - roadWidth;

    if (available < MIN_REGION * 2) {

      renderBlock(x, y, w, h, dna);
      return;
    }

    let w1 = available * ratio;
    let w2 = available - w1;

    if (w1 < MIN_REGION || w2 < MIN_REGION) {

      renderBlock(x, y, w, h, dna);
      return;
    }

    let dna1 = mutateDNA(dna);
    let dna2 = mutateDNA(dna);

    subdivideRegion(
      x,
      y,
      w1,
      h,
      depth - 1,
      dna1
    );

    subdivideRegion(
      x + w1 + roadWidth,
      y,
      w2,
      h,
      depth - 1,
      dna2
    );
  }


  // ========================================================
  // HORIZONTAL SPLIT
  // ========================================================

  else {

    let available = h - roadWidth;

    if (available < MIN_REGION * 2) {

      renderBlock(x, y, w, h, dna);
      return;
    }

    let h1 = available * ratio;
    let h2 = available - h1;

    if (h1 < MIN_REGION || h2 < MIN_REGION) {

      renderBlock(x, y, w, h, dna);
      return;
    }

    let dna1 = mutateDNA(dna);
    let dna2 = mutateDNA(dna);

    subdivideRegion(
      x,
      y,
      w,
      h1,
      depth - 1,
      dna1
    );

    subdivideRegion(
      x,
      y + h1 + roadWidth,
      w,
      h2,
      depth - 1,
      dna2
    );
  }
}


function applySpatialInfluence(x, y, w, h, dna) {

  // Center of this recursive region
  let regionX = x + w / 2;
  let regionY = y + h / 2;


  // Distance from city center
  let d = dist(
    regionX,
    regionY,
    width / 2,
    height / 2
  );


  // Maximum possible distance from center
  let maxD = dist(
    width / 2,
    height / 2,
    0,
    0
  );


  // 1 = downtown
  // 0 = outer edge
  let centerFactor =
    1 -
    constrain(
      d / maxD,
      0,
      1
    );


  // Slight curve makes the downtown influence
  // more concentrated rather than perfectly linear.
  centerFactor =
    pow(centerFactor, 1.25);


  // Copy the inherited DNA so we don't alter
  // the original object unexpectedly.
  let influenced = {
    ...dna
  };


  // Downtown encourages density.
  influenced.density =
    constrain(
      dna.density * 0.25 +
      centerFactor * 0.75,
      0,
      1
    );


  // Downtown also tends toward stronger organization.
  influenced.order =
    constrain(
      dna.order * 0.80 +
      centerFactor * 0.20,
      0,
      1
    );

    influenced.centerFactor = centerFactor;


  return influenced;
}

// ==========================================================
// DISTRICT DNA
// ==========================================================

function mutateDNA(parent) {

  let child = {
    density:
      constrain(
        parent.density + random(-0.12, 0.12),
        0,
        1
      ),

    order:
      constrain(
        parent.order + random(-0.10, 0.10),
        0,
        1
      ),

    age:
      constrain(
        parent.age + random(-0.10, 0.12),
        0,
        1
      ),

    green:
      constrain(
        parent.green + random(-0.08, 0.08),
        0,
        0.7
      ),

    decay:
      constrain(
        parent.decay + random(-0.08, 0.10),
        0,
        1
      ),

    paletteIndex: parent.paletteIndex
  };


  // Occasionally a neighborhood develops
  // its own visual identity.

  if (random() < 0.12) {

    child.paletteIndex =
      floor(random(palette.length));

  }

  return child;
}


// ==========================================================
// BLOCK CONTENT
// ==========================================================

function renderBlock(x, y, w, h, dna) {


  if (w < 10 || h < 10) return;


  // --------------------------------
  // determine land use
  // --------------------------------

  let choice = random();


  // PARK
  if (choice < dna.green) {

    renderPark(x, y, w, h, dna);
    return;
  }


  // ABANDONED / EMPTY SPACE
  if (
    choice <
    dna.green +
    dna.decay * 0.18
  ) {

    renderAbandonedLot(x, y, w, h, dna);
    return;
  }


  // PLAZA
  if (random() < 0.06) {

    renderPlaza(x, y, w, h);
    return;
  }


  // OTHERWISE BUILDINGS
  renderBuildings(x, y, w, h, dna);
  
}


// ==========================================================
// BUILDING BLOCK
// ==========================================================

function renderBuildings(x, y, w, h, dna) {

  let padding = map(
    dna.density,
    0,
    1,
    12,
    4
  );

  let bx = x + padding;
  let by = y + padding;

  let bw = w - padding * 2;
  let bh = h - padding * 2;

  if (bw < 5 || bh < 5) return;


  // Dense districts sometimes contain
  // several structures inside one city block.

  let subdivisions = 1;

  if (dna.density > 0.5 && random() < dna.density) {

    subdivisions =
      floor(random(2, 5));

  }


  // --------------------------------------------------------
  // SINGLE BUILDING
  // --------------------------------------------------------

  if (subdivisions === 1) {

    drawBuilding(
      bx,
      by,
      bw,
      bh,
      dna
    );

    return;
  }


  // --------------------------------------------------------
  // MULTIPLE BUILDINGS
  // --------------------------------------------------------

  let vertical = bw > bh;

  let alley = random(3, 8);


  if (vertical) {

    let pieceWidth =
      (bw - alley * (subdivisions - 1)) /
      subdivisions;

    for (let i = 0; i < subdivisions; i++) {

      let px =
        bx +
        i * (pieceWidth + alley);

      drawBuilding(
        px,
        by,
        pieceWidth,
        bh,
        dna
      );
    }

  } else {

    let pieceHeight =
      (bh - alley * (subdivisions - 1)) /
      subdivisions;

    for (let i = 0; i < subdivisions; i++) {

      let py =
        by +
        i * (pieceHeight + alley);

      drawBuilding(
        bx,
        py,
        bw,
        pieceHeight,
        dna
      );
    }
  }
}


// ==========================================================
// BUILDING FOOTPRINT
// ==========================================================

function drawBuilding(x, y, w, h, dna) {

  if (w < 3 || h < 3) return;

  let c =
    color(
      palette[dna.paletteIndex]
    );

  let alphaValue =
    map(
      dna.age,
      0,
      1,
      170,
      85
    );

  c.setAlpha(alphaValue);


  // building fill

  noStroke();
  fill(c);

  rect(
    x,
    y,
    w,
    h
  );


  // main architectural outline

  drawWobblyRect(
    x,
    y,
    w,
    h,
    dna
  );


  // --------------------------------------------------------
  // ROOFTOP / INTERNAL DETAIL
  // --------------------------------------------------------

  if (w > 25 && h > 25) {

    if (random() < 0.55) {

      let inset =
        random(
          5,
          min(w, h) * 0.22
        );

      stroke(INK);
      strokeWeight(0.7);

      noFill();

      rect(
        x + inset,
        y + inset,
        w - inset * 2,
        h - inset * 2
      );
    }
  }


  // occasional mechanical marks

  if (
    w > 40 &&
    h > 40 &&
    random() < 0.3
  ) {

    let cx =
      random(
        x + w * 0.25,
        x + w * 0.75
      );

    let cy =
      random(
        y + h * 0.25,
        y + h * 0.75
      );

    noFill();
    stroke(INK);
    strokeWeight(0.7);

    circle(
      cx,
      cy,
      random(4, 12)
    );
  }
}


// ==========================================================
// WOBBLY ARCHITECTURAL RECTANGLE
// ==========================================================

function drawWobblyRect(x, y, w, h, dna) {

  let passes =
    floor(
      map(
        dna.age,
        0,
        1,
        1,
        4
      )
    );

  let wobble =
    map(
      dna.decay,
      0,
      1,
      0.2,
      3.5
    );


  noFill();


  for (let p = 0; p < passes; p++) {

    stroke(
      35,
      map(p, 0, passes, 170, 40)
    );

    strokeWeight(
      random(0.5, 1.2)
    );


    let x1 =
      x + random(-wobble, wobble);

    let y1 =
      y + random(-wobble, wobble);

    let x2 =
      x + w +
      random(-wobble, wobble);

    let y2 =
      y + h +
      random(-wobble, wobble);


    beginShape();

    vertex(
      x1,
      y1
    );

    vertex(
      x2,
      y1 +
      random(-wobble, wobble)
    );

    vertex(
      x2 +
      random(-wobble, wobble),
      y2
    );

    vertex(
      x1 +
      random(-wobble, wobble),
      y2
    );

    endShape(CLOSE);
  }
}


// ==========================================================
// PARK
// ==========================================================

function renderPark(x, y, w, h, dna) {

  let pad = 5;

  let c =
    color(
      random(parkColors)
    );

  c.setAlpha(120);

  noStroke();
  fill(c);

  rect(
    x + pad,
    y + pad,
    w - pad * 2,
    h - pad * 2
  );


  // tree / vegetation texture

  let count =
    floor(
      (w * h) / 600
    );

  count =
    constrain(
      count,
      4,
      80
    );

  for (let i = 0; i < count; i++) {

    let px =
      random(
        x + 8,
        x + w - 8
      );

    let py =
      random(
        y + 8,
        y + h - 8
      );

    noStroke();

    fill(
      55,
      random(40, 90)
    );

    circle(
      px,
      py,
      random(2, 7)
    );
  }


  drawWobblyRect(
    x + pad,
    y + pad,
    w - pad * 2,
    h - pad * 2,
    dna
  );
}


// ==========================================================
// PLAZA
// ==========================================================

function renderPlaza(x, y, w, h) {

  let pad = 7;

  noFill();

  stroke(70, 120);
  strokeWeight(0.7);

  rect(
    x + pad,
    y + pad,
    w - pad * 2,
    h - pad * 2
  );


  // simple hatch pattern

  let spacing = 10;

  for (
    let i = -h;
    i < w;
    i += spacing
  ) {

    let x1 =
      constrain(
        x + i,
        x + pad,
        x + w - pad
      );

    let y1 =
      constrain(
        y + pad,
        y + pad,
        y + h - pad
      );

    let x2 =
      constrain(
        x + i + h,
        x + pad,
        x + w - pad
      );

    let y2 =
      constrain(
        y + h - pad,
        y + pad,
        y + h - pad
      );

    line(
      x1,
      y1,
      x2,
      y2
    );
  }
}


// ==========================================================
// ABANDONED LOT
// ==========================================================

function renderAbandonedLot(x, y, w, h, dna) {

  let pad =
    random(5, 12);

  noFill();

  stroke(INK);
  strokeWeight(0.6);

  drawWobblyRect(
    x + pad,
    y + pad,
    w - pad * 2,
    h - pad * 2,
    {
      age: 1,
      decay: 1
    }
  );


  // debris / forgotten marks

  let marks =
    floor(
      random(3, 12)
    );

  for (let i = 0; i < marks; i++) {

    let px =
      random(
        x + pad,
        x + w - pad
      );

    let py =
      random(
        y + pad,
        y + h - pad
      );

    stroke(
      60,
      random(30, 100)
    );

    point(px, py);
  }
}


// ==========================================================
// PAPER TEXTURE
// ==========================================================

function drawPaperTexture() {

  noStroke();

  for (let i = 0; i < 25000; i++) {

    let x =
      random(width);

    let y =
      random(height);

    let alpha =
      random(2, 10);

    fill(
      random() < 0.5
        ? color(255, alpha)
        : color(30, alpha)
    );

    circle(
      x,
      y,
      random(0.5, 1.5)
    );
  }
}


// ==========================================================
// CONTROLS
// ==========================================================

function keyPressed() {

  // regenerate

  if (
    key === "r" ||
    key === "R"
  ) {

    seedValue =
      floor(
        random(1000000)
      );

    generateCity();
  }


  // save

  if (
    key === "s" ||
    key === "S"
  ) {

    let timestamp =
      year() +
      "-" +
      nf(month(), 2) +
      "-" +
      nf(day(), 2) +
      "_" +
      nf(hour(), 2) +
      "-" +
      nf(minute(), 2) +
      "-" +
      nf(second(), 2);

    saveCanvas(
      "RecursiveCity_" +
      timestamp,
      "png"
    );
  }
}