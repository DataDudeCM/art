let seed;

let paperLayer;
let artLayer;

let walkers = [];
let nextWalkerId = 0;

let cols;
let rows;
let memoryField;

let currentPalette;
let paletteColors;
let paperColor;

let showField = false;
let paused = false;

const SETTINGS = {
  cellSize: 8,

  rootCount: 5,
  maxGeneration: 7,

  stepsPerFrame: 3,

  // Memory
  depositAmount: 0.015,
  depositRadius: 2,

  // Higher = history lasts longer even after visible marks fade.
  memoryDecay: 0.992,
  memorySaturation: 0.8,

  // Walker sensing
  probeDistance: 16,
  probeAngle: 0.45,

  turnStep: 0.055,
  gradientInfluence: 0.18,
  noiseTurn: 0.035,
  jitter: 0.01,
  maxTurn: 0.18,

  driftScale: 0.0025,

  // Branching
  branchMinAge: 20,
  branchChance: 0.0085,

  // Visible marks fade while invisible memory remains.
  fadeAlpha: 4,

  // Memory needed before a new cycle can grow from old history.
  reseedMemoryThreshold: 0.25,

  // Number of strongest memory cells considered as potential roots.
  reseedCandidatePool: 30
};


// ============================================================
// SETUP
// ============================================================

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  initSketch();
}


function initSketch() {
  seed = floor(random(1000000));

  randomSeed(seed);
  noiseSeed(seed);

  // ----------------------------------------------------------
  // Shared palette.js
  // ----------------------------------------------------------

  currentPalette = getPalette("evidenceOfEncounter");

  // Don't use the paper color as a walker color.
  paletteColors = currentPalette.colors
    .filter(c => c.role !== "paper")
    .map(c => c.hex);

  paperColor =
    getColorByRole(currentPalette, "paper", false) ||
    getLightColor(currentPalette);

  // ----------------------------------------------------------
  // Memory field
  // ----------------------------------------------------------

  cols = floor(width / SETTINGS.cellSize) + 1;
  rows = floor(height / SETTINGS.cellSize) + 1;

  memoryField = new Float32Array(cols * rows);

  // ----------------------------------------------------------
  // Graphics layers
  // ----------------------------------------------------------

  paperLayer = createGraphics(width, height);
  artLayer = createGraphics(width, height);

  paperLayer.pixelDensity(1);
  artLayer.pixelDensity(1);

  artLayer.colorMode(RGB, 255, 255, 255, 255);

  buildPaperLayer();

  artLayer.clear();

  // ----------------------------------------------------------
  // Walkers
  // ----------------------------------------------------------

  walkers = [];
  nextWalkerId = 0;

  seedRoots();

  background(paperColor);

  console.log(
    `Temporal Memory Field — seed ${seed} — palette ${currentPalette.name}`
  );
}


// ============================================================
// MAIN LOOP
// ============================================================

function draw() {
  if (!paused) {
    //fadeArtLayer();
    stepSystem();
    decayMemoryField();

    if (walkers.length < 2 && frameCount % 20 === 0) {
      seedFromMemory();
    }
  }

  if (showField) {
    drawFieldDebug();
  } else {
    background(paperColor);
    image(paperLayer, 0, 0);
    image(artLayer, 0, 0);
  }

  drawHUD();
}

// ============================================================
// INITIAL ROOTS
// ============================================================

function seedRoots() {
  const cx = width * 0.5;
  const cy = height * 0.5;

  const startAngle = random(TWO_PI);

  for (let i = 0; i < SETTINGS.rootCount; i++) {
    const a =
      startAngle +
      map(i, 0, SETTINGS.rootCount, 0, TWO_PI);

    const r = random(10, 55);

    spawnWalker(
      cx + cos(a) * r,
      cy + sin(a) * r,
      a + random(-0.8, 0.8),
      0,
      i % paletteColors.length,
      random() < 0.5 ? -1 : 1,
      -1
    );
  }
}


// ============================================================
// RESEED FROM MEMORY
// ============================================================

function seedFromMemory() {
  const candidates = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const strength = memoryField[y * cols + x];

      if (strength > SETTINGS.reseedMemoryThreshold) {
        candidates.push({
          x: x * SETTINGS.cellSize,
          y: y * SETTINGS.cellSize,
          strength
        });
      }
    }
  }

  // Nothing meaningful left in memory.
  // Start a genuinely new lineage.
  if (candidates.length === 0) {
    seedRoots();
    return;
  }

  // Strongest memories first.
  candidates.sort((a, b) => b.strength - a.strength);

  const poolSize = min(
    SETTINGS.reseedCandidatePool,
    candidates.length
  );

  const count = min(
    SETTINGS.rootCount,
    candidates.length
  );

  for (let i = 0; i < count; i++) {
    const p = candidates[floor(random(poolSize))];

    spawnWalker(
      p.x,
      p.y,
      random(TWO_PI),
      0,
      floor(random(paletteColors.length)),
      random() < 0.5 ? -1 : 1,
      -1
    );
  }
}


// ============================================================
// SYSTEM
// ============================================================

function stepSystem() {
  for (let step = 0; step < SETTINGS.stepsPerFrame; step++) {
    // Snapshot length so walkers born during this pass begin
    // participating on the next pass rather than recursively
    // exploding immediately.
    const count = walkers.length;

    for (let i = count - 1; i >= 0; i--) {
      if (!walkers[i]) continue;

      walkers[i].step();
    }

    walkers = walkers.filter(w => !w.dead);
  }
}


// ============================================================
// WALKER CREATION
// ============================================================

function spawnWalker(
  x,
  y,
  angle,
  generation,
  colorIndex,
  orbitDir,
  parentId = -1
) {
  walkers.push(
    new MemoryWalker(
      x,
      y,
      angle,
      generation,
      colorIndex,
      orbitDir,
      parentId
    )
  );
}


// ============================================================
// MEMORY WALKER
// ============================================================

class MemoryWalker {

  constructor(
    x,
    y,
    angle,
    generation,
    colorIndex,
    orbitDir,
    parentId = -1
  ) {
    this.id = nextWalkerId++;

    this.parentId = parentId;

    this.pos = createVector(x, y);
    this.prev = this.pos.copy();

    this.angle = angle;

    this.generation = generation;

    this.colorIndex =
      colorIndex % paletteColors.length;

    this.orbitDir = orbitDir;

    this.speed =
      random(0.8, 1.7) *
      map(
        generation,
        0,
        SETTINGS.maxGeneration,
        1.0,
        0.72
      );

    this.turnBias = random(-0.02, 0.02);

    this.age = 0;

    this.energy = 1;

    this.lifespan =
      random(170, 330) *
      map(
        generation,
        0,
        SETTINGS.maxGeneration,
        1.0,
        0.65
      );

    this.dead = false;
  }


  step() {
    // Position before this movement.
    this.prev.set(this.pos);

    // --------------------------------------------------------
    // Turn
    // --------------------------------------------------------

    const turn = this.computeTurn();

    this.angle += turn;

    // --------------------------------------------------------
    // Move
    // --------------------------------------------------------

    this.pos.x += cos(this.angle) * this.speed;
    this.pos.y += sin(this.angle) * this.speed;

    // --------------------------------------------------------
    // WRAP
    //
    // Important:
    // wrapPosition() tells us if teleportation occurred.
    //
    // If so:
    //   1. don't draw this segment
    //   2. reset prev to the new wrapped position
    //
    // This prevents horizontal/vertical lines across canvas.
    // --------------------------------------------------------

    const wrapped = wrapPosition(this.pos);

    if (wrapped) {
      this.prev.set(this.pos);
    }

    // --------------------------------------------------------
    // Memory
    // --------------------------------------------------------

    const mem = sampleField(
      this.pos.x,
      this.pos.y
    );

    depositField(
      this.pos.x,
      this.pos.y,
      SETTINGS.depositAmount *
        map(
          this.generation,
          0,
          SETTINGS.maxGeneration,
          1.0,
          0.65
        ),
      SETTINGS.depositRadius
    );

    // --------------------------------------------------------
    // Draw
    // --------------------------------------------------------

    this.draw(mem, wrapped);

    // --------------------------------------------------------
    // Life
    // --------------------------------------------------------

    this.age++;

    this.energy *= 0.9975;

    // --------------------------------------------------------
    // Branching
    // --------------------------------------------------------

    if (
      this.generation < SETTINGS.maxGeneration &&
      this.age > SETTINGS.branchMinAge
    ) {
      const p =
        SETTINGS.branchChance *

        map(
          constrain(mem, 0, 3),
          0,
          3,
          0.7,
          2.2
        ) *

        map(
          this.age,
          SETTINGS.branchMinAge,
          this.lifespan,
          0.8,
          1.35,
          true
        );

      if (random() < p) {
        this.branch(mem);
      }
    }

    // --------------------------------------------------------
    // Death
    // --------------------------------------------------------

    if (
      this.age > this.lifespan ||
      this.energy < 0.08
    ) {
      this.dead = true;
    }
  }


  computeTurn() {
    const probe = SETTINGS.probeDistance;
    const spread = SETTINGS.probeAngle;

    const ahead = sampleField(
      this.pos.x + cos(this.angle) * probe,
      this.pos.y + sin(this.angle) * probe
    );

    const left = sampleField(
      this.pos.x +
        cos(this.angle - spread) * probe,

      this.pos.y +
        sin(this.angle - spread) * probe
    );

    const right = sampleField(
      this.pos.x +
        cos(this.angle + spread) * probe,

      this.pos.y +
        sin(this.angle + spread) * probe
    );

    let turn = this.turnBias;

    // --------------------------------------------------------
    // Prefer less-used territory
    // --------------------------------------------------------

    if (left < right) {
      turn -= SETTINGS.turnStep;
    }
    else if (right < left) {
      turn += SETTINGS.turnStep;
    }

    // --------------------------------------------------------
    // Dense historical area:
    // introduce uncertainty
    // --------------------------------------------------------

    if (ahead > SETTINGS.memorySaturation) {
      turn +=
        random([-1, 1]) *
        SETTINGS.turnStep *
        1.5;
    }

    // --------------------------------------------------------
    // Follow contours of historical memory
    // --------------------------------------------------------

    const gradient = sampleGradient(
      this.pos.x,
      this.pos.y
    );

    if (gradient.magSq() > 0.00001) {
      const contourAngle =
        atan2(gradient.y, gradient.x) +
        this.orbitDir * HALF_PI;

      turn +=
        angleDifference(
          contourAngle,
          this.angle
        ) *
        SETTINGS.gradientInfluence;
    }

    // --------------------------------------------------------
    // Organic drift
    // --------------------------------------------------------

    const drift = map(
      noise(
        this.pos.x * SETTINGS.driftScale,
        this.pos.y * SETTINGS.driftScale,
        this.age * 0.01 +
          this.id * 0.07
      ),
      0,
      1,
      -1,
      1
    );

    turn +=
      drift *
      SETTINGS.noiseTurn;

    turn += random(
      -SETTINGS.jitter,
      SETTINGS.jitter
    );

    const memoryFactor = map(
      constrain(ahead, 0, SETTINGS.memorySaturation),
      0,
      SETTINGS.memorySaturation,
      0.4,
      1.5
    );

    turn *= memoryFactor;

    return constrain(
      turn,
      -SETTINGS.maxTurn,
      SETTINGS.maxTurn
    );
  }


  draw(mem, wrapped) {
    const rgb = hexToRgb(
      paletteColors[this.colorIndex]
    );

    const memoryStrength = constrain(
      mem / SETTINGS.memorySaturation,
      0,
      1
    );

    const strokeAlpha = map(
      memoryStrength,
      0,
      1,
      1, // minimum alpha 
      10 // maximum alpha 
    );

    const alpha =
      map(
        this.generation,
        0,
        SETTINGS.maxGeneration,
        28,
        8
      ) +

      map(
        constrain(mem, 0, 3),
        0,
        3,
        0,
        18
      );

    const sw =
      map(
        this.generation,
        0,
        SETTINGS.maxGeneration,
        2.25,
        0.55
      ) *

      map(
        constrain(mem, 0, 3),
        0,
        3,
        1.0,
        1.65
      );

    // --------------------------------------------------------
    // Never draw a segment produced by wrapping.
    // --------------------------------------------------------

    if (!wrapped) {
      artLayer.stroke(
        rgb.r,
        rgb.g,
        rgb.b,
        strokeAlpha
      );

      artLayer.strokeWeight(sw);

      artLayer.line(
        this.prev.x,
        this.prev.y,
        this.pos.x,
        this.pos.y
      );
    }

    // --------------------------------------------------------
    // Evidence nodes
    // --------------------------------------------------------

    if (
      mem > 1.1 &&
      random() < 0.14
    ) {
      artLayer.noFill();

      artLayer.stroke(
        rgb.r,
        rgb.g,
        rgb.b,
        alpha * 0.65
      );

      artLayer.strokeWeight(
        max(0.4, sw * 0.55)
      );

      const s =
        random(4, 18) *
        map(
          this.generation,
          0,
          SETTINGS.maxGeneration,
          1.0,
          0.7
        );

      artLayer.ellipse(
        this.pos.x,
        this.pos.y,
        s,
        s
      );
    }
  }


  branch(mem) {
    const childAngle =
      this.angle +
      random(-1.35, 1.35) +
      this.orbitDir *
        random(-0.3, 0.3);

    let childColor = this.colorIndex;

    if (random() >= 0.75) {
      childColor =
        (
          this.colorIndex +
          floor(
            random(
              1,
              paletteColors.length
            )
          )
        ) %
        paletteColors.length;
    }

    const child =
      new MemoryWalker(
        this.pos.x,
        this.pos.y,
        childAngle,
        this.generation + 1,
        childColor,
        random() < 0.5 ? -1 : 1,
        this.id
      );

    child.speed = max(
      0.45,
      this.speed *
        random(0.85, 1.15)
    );

    child.turnBias =
      this.turnBias +
      random(-0.01, 0.01);

    child.energy =
      this.energy * 0.92;

    walkers.push(child);

    // Branching costs the parent.
    this.energy *= 0.92;

    // Branch moments strongly affect memory.
    depositField(
      this.pos.x,
      this.pos.y,
      0.6 + mem * 0.2,
      SETTINGS.depositRadius + 1
    );
  }
}


// ============================================================
// MEMORY FIELD
// ============================================================

function depositField(
  x,
  y,
  amount,
  radius
) {
  const gx = floor(
    x / SETTINGS.cellSize
  );

  const gy = floor(
    y / SETTINGS.cellSize
  );

  for (
    let oy = -radius;
    oy <= radius;
    oy++
  ) {
    for (
      let ox = -radius;
      ox <= radius;
      ox++
    ) {
      const xx = gx + ox;
      const yy = gy + oy;

      if (
        xx < 0 ||
        yy < 0 ||
        xx >= cols ||
        yy >= rows
      ) {
        continue;
      }

      const d2 =
        ox * ox +
        oy * oy;

      if (
        d2 >
        radius * radius
      ) {
        continue;
      }

      const falloff =
        1 -
        d2 /
          (
            radius * radius +
            0.0001
          );

      const index =
        yy * cols + xx;

      memoryField[index] +=
        amount *
        falloff *
        (1 - memoryField[index] / 2.5);
    }
  }
}


function sampleField(x, y) {
  const gx = constrain(
    floor(
      x / SETTINGS.cellSize
    ),
    0,
    cols - 1
  );

  const gy = constrain(
    floor(
      y / SETTINGS.cellSize
    ),
    0,
    rows - 1
  );

  return memoryField[
    gy * cols + gx
  ];
}


function sampleGradient(x, y) {
  const d = SETTINGS.cellSize;

  const left =
    sampleField(x - d, y);

  const right =
    sampleField(x + d, y);

  const up =
    sampleField(x, y - d);

  const down =
    sampleField(x, y + d);

  return createVector(
    right - left,
    down - up
  );
}


function decayMemoryField() {
  for (
    let i = 0;
    i < memoryField.length;
    i++
  ) {
    memoryField[i] *=
      SETTINGS.memoryDecay;

    if (
      memoryField[i] <
      0.0001
    ) {
      memoryField[i] = 0;
    }
  }
}


// ============================================================
// EDGE WRAPPING
// ============================================================

function wrapPosition(v) {
  let wrapped = false;

  if (v.x < 0) {
    v.x += width;
    wrapped = true;
  }
  else if (v.x >= width) {
    v.x -= width;
    wrapped = true;
  }

  if (v.y < 0) {
    v.y += height;
    wrapped = true;
  }
  else if (v.y >= height) {
    v.y -= height;
    wrapped = true;
  }

  return wrapped;
}


// ============================================================
// VISIBLE ART FADE
// ============================================================

function fadeArtLayer() {
  const p = hexToRgb(paperColor);

  artLayer.noStroke();

  artLayer.fill(
    p.r,
    p.g,
    p.b,
    SETTINGS.fadeAlpha
  );

  artLayer.rect(
    0,
    0,
    width,
    height
  );
}


// ============================================================
// PAPER
// ============================================================

function buildPaperLayer() {
  const p = hexToRgb(paperColor);

  paperLayer.background(
    paperColor
  );

  paperLayer.noStroke();

  // ----------------------------------------------------------
  // Soft tonal stains
  // ----------------------------------------------------------

  for (let i = 0; i < 18; i++) {
    const alpha =
      random(6, 16);

    paperLayer.fill(
      constrain(
        p.r - random(2, 10),
        0,
        255
      ),

      constrain(
        p.g - random(2, 8),
        0,
        255
      ),

      constrain(
        p.b - random(2, 6),
        0,
        255
      ),

      alpha
    );

    paperLayer.ellipse(
      random(width),
      random(height),
      random(80, 260),
      random(60, 220)
    );
  }

  // ----------------------------------------------------------
  // Grain
  // ----------------------------------------------------------

  const grainCount =
    width *
    height *
    0.015;

  for (
    let i = 0;
    i < grainCount;
    i++
  ) {
    const x = random(width);
    const y = random(height);

    const v =
      random(-12, 12);

    paperLayer.stroke(
      constrain(
        p.r + v,
        0,
        255
      ),

      constrain(
        p.g + v,
        0,
        255
      ),

      constrain(
        p.b + v,
        0,
        255
      ),

      random(8, 20)
    );

    paperLayer.point(x, y);
  }

  // ----------------------------------------------------------
  // Fibers
  // ----------------------------------------------------------

  paperLayer.stroke(
    255,
    255,
    255,
    12
  );

  for (let i = 0; i < 1500; i++) {
    const x = random(width);
    const y = random(height);

    const a = random(TWO_PI);
    const len = random(3, 10);

    paperLayer.line(
      x,
      y,
      x + cos(a) * len,
      y + sin(a) * len
    );
  }
}


// ============================================================
// MEMORY DEBUG VIEW
// ============================================================

function drawFieldDebug() {
  background(0);
  noStroke();

  let maxValue = 0;

  // Find current maximum memory strength
  for (let i = 0; i < memoryField.length; i++) {
    if (memoryField[i] > maxValue) {
      maxValue = memoryField[i];
    }
  }

  // Avoid divide-by-zero
  if (maxValue <= 0) return;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const v = memoryField[y * cols + x];

      const brightness = map(
        v,
        0,
        maxValue,
        0,
        255
      );

      fill(brightness);

      rect(
        x * SETTINGS.cellSize,
        y * SETTINGS.cellSize,
        SETTINGS.cellSize,
        SETTINGS.cellSize
      );
    }
  }

  fill(255);
  textSize(12);
  text(
    `max memory: ${maxValue.toFixed(2)}`,
    20,
    height - 25
  );
}

// ============================================================
// HUD
// ============================================================

function drawHUD() {

  let maxMemory = 0;

  for (let i = 0; i < memoryField.length; i++) {
    if (memoryField[i] > maxMemory) {
      maxMemory = memoryField[i];
    }
  }
  noStroke();

  fill(20, 100);

  rect(
    12,
    12,
    310,
    98,
    8
  );

  fill(255, 230);

  textSize(12);
  textAlign(LEFT, TOP);

  text(
    `seed: ${seed}`,
    22,
    22
  );

  text(
    `palette: ${currentPalette.name}`,
    22,
    38
  );

  text(
    `walkers: ${walkers.length}`,
    22,
    54
  );

  text(
    "[R] regenerate   [S] save   [M] memory   [SPACE] pause",
    22,
    70
  );

  text(
    `max memory: ${maxMemory.toFixed(2)}`,
    22,
    86
  );

}


// ============================================================
// UTILITIES
// ============================================================

function angleDifference(
  target,
  current
) {
  let a =
    target - current;

  while (a > PI) {
    a -= TWO_PI;
  }

  while (a < -PI) {
    a += TWO_PI;
  }

  return a;
}


function hexToRgb(hex) {
  const c = color(hex);

  return {
    r: red(c),
    g: green(c),
    b: blue(c)
  };
}


// ============================================================
// CONTROLS
// ============================================================

function keyPressed() {
  if (
    key === "r" ||
    key === "R"
  ) {
    initSketch();
  }

  else if (
    key === "s" ||
    key === "S"
  ) {
    saveCanvas(
      `temporal-memory-${seed}`,
      "png"
    );
  }

  else if (
    key === "m" ||
    key === "M"
  ) {
    showField =
      !showField;
  }

  else if (key === " ") {
    paused =
      !paused;
  }
}


// ============================================================
// RESIZE
// ============================================================

function windowResized() {
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  initSketch();
}