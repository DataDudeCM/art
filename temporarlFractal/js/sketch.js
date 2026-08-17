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
  // Field resolution
  cellSize: 8,

  // Population
  rootCount: 5,
  maxGeneration: 7,
  stepsPerFrame: 3,

  // Memory
  depositAmount: 0.015,
  depositRadius: 2,
  memoryDecay: 0.992,
  memorySaturation: 0.8,
  memoryCapacity: 2.5,

  // Walker sensing / motion
  probeDistance: 16,
  probeAngle: 0.45,
  turnStep: 0.55, // default 0.055
  gradientInfluence: 0.18,
  noiseTurn: 0.035,
  jitter: 0.01,
  maxTurn: 0.18,
  driftScale: 0.0025,

  // Branching
  branchMinAge: 20,
  branchChance: 0.0085,
  branchMemoryRange: 3,

  // Reseeding
  reseedMemoryThreshold: 0.25,
  reseedCandidatePool: 30,

  // Rendering
  pathAlphaMin: 10,
  pathAlphaMax: 30,
  nodeMemoryThreshold: 1.1,
  nodeChance: 0.14
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

  initPalette();
  initMemoryField();
  initLayers();

  walkers = [];
  nextWalkerId = 0;

  seedRoots();

  background(paperColor);

  console.log(
    `Temporal Memory Field — seed ${seed} — palette ${currentPalette.name}`
  );
}


function initPalette() {
  currentPalette = randomPalette();

  paletteColors = currentPalette.colors
    .filter(c => c.role !== "paper")
    .map(c => c.hex);

  paperColor =
    getColorByRole(currentPalette, "paper", false) ||
    getLightColor(currentPalette);
}


function initMemoryField() {
  cols = floor(width / SETTINGS.cellSize) + 1;
  rows = floor(height / SETTINGS.cellSize) + 1;
  memoryField = new Float32Array(cols * rows);
}


function initLayers() {
  paperLayer = createGraphics(width, height);
  artLayer = createGraphics(width, height);

  paperLayer.pixelDensity(1);
  artLayer.pixelDensity(1);

  artLayer.colorMode(RGB, 255, 255, 255, 255);

  buildPaperLayer();
  artLayer.clear();
}


// ============================================================
// MAIN LOOP
// ============================================================

function draw() {
  if (!paused) {
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
// WALKER POPULATION
// ============================================================

function seedRoots() {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const startAngle = random(TWO_PI);

  for (let i = 0; i < SETTINGS.rootCount; i++) {
    const angle =
      startAngle +
      map(i, 0, SETTINGS.rootCount, 0, TWO_PI);

    const radius = random(10, 55);

    spawnWalker(
      cx + cos(angle) * radius,
      cy + sin(angle) * radius,
      angle + random(-0.8, 0.8),
      0,
      i % paletteColors.length,
      random() < 0.5 ? -1 : 1,
      -1
    );
  }
}


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

  if (candidates.length === 0) {
    seedRoots();
    return;
  }

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


function stepSystem() {
  for (let step = 0; step < SETTINGS.stepsPerFrame; step++) {
    // New children start participating on the next pass.
    const count = walkers.length;

    for (let i = count - 1; i >= 0; i--) {
      if (walkers[i]) {
        walkers[i].step();
      }
    }

    walkers = walkers.filter(walker => !walker.dead);
  }
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
    this.colorIndex = colorIndex % paletteColors.length;
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
    this.prev.set(this.pos);

    this.angle += this.computeTurn();

    this.pos.x += cos(this.angle) * this.speed;
    this.pos.y += sin(this.angle) * this.speed;

    const wrapped = wrapPosition(this.pos);

    // Never connect the pre-wrap and post-wrap positions.
    if (wrapped) {
      this.prev.set(this.pos);
    }

    const memory = sampleField(this.pos.x, this.pos.y);

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

    this.draw(memory, wrapped);

    this.age++;
    this.energy *= 0.9975;

    this.maybeBranch(memory);

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
      this.pos.x + cos(this.angle - spread) * probe,
      this.pos.y + sin(this.angle - spread) * probe
    );

    const right = sampleField(
      this.pos.x + cos(this.angle + spread) * probe,
      this.pos.y + sin(this.angle + spread) * probe
    );

    let turn = this.turnBias;

    // Prefer less-used territory.
    if (left < right) {
      turn -= SETTINGS.turnStep;
    } else if (right < left) {
      turn += SETTINGS.turnStep;
    }

    // Dense memory produces uncertainty.
    if (ahead > SETTINGS.memorySaturation) {
      turn +=
        random([-1, 1]) *
        SETTINGS.turnStep *
        1.5;
    }

    // Follow contours of accumulated memory.
    const gradient = sampleGradient(this.pos.x, this.pos.y);

    if (gradient.magSq() > 0.00001) {
      const contourAngle =
        atan2(gradient.y, gradient.x) +
        this.orbitDir * HALF_PI;

      turn +=
        angleDifference(contourAngle, this.angle) *
        SETTINGS.gradientInfluence;
    }

    // Organic drift.
    const drift = map(
      noise(
        this.pos.x * SETTINGS.driftScale,
        this.pos.y * SETTINGS.driftScale,
        this.age * 0.01 + this.id * 0.07
      ),
      0,
      1,
      -1,
      1
    );

    turn += drift * SETTINGS.noiseTurn;
    turn += random(-SETTINGS.jitter, SETTINGS.jitter);

    // High-memory territory becomes more turbulent.
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


  maybeBranch(memory) {
    if (
      this.generation >= SETTINGS.maxGeneration ||
      this.age <= SETTINGS.branchMinAge
    ) {
      return;
    }

    const memoryFactor = map(
      constrain(memory, 0, SETTINGS.branchMemoryRange),
      0,
      SETTINGS.branchMemoryRange,
      0.7,
      2.2
    );

    const ageFactor = map(
      this.age,
      SETTINGS.branchMinAge,
      this.lifespan,
      0.8,
      1.35,
      true
    );

    const branchProbability =
      SETTINGS.branchChance *
      memoryFactor *
      ageFactor;

    if (random() < branchProbability) {
      this.branch(memory);
    }
  }


  draw(memory, wrapped) {
    const rgb = hexToRgb(
      paletteColors[this.colorIndex]
    );

    const memoryStrength = constrain(
      memory / SETTINGS.memorySaturation,
      0,
      1
    );

    const strokeAlpha = map(
      memoryStrength,
      0,
      1,
      SETTINGS.pathAlphaMin,
      SETTINGS.pathAlphaMax
    );

    const nodeAlpha =
      map(
        this.generation,
        0,
        SETTINGS.maxGeneration,
        28,
        8
      ) +
      map(
        constrain(memory, 0, SETTINGS.branchMemoryRange),
        0,
        SETTINGS.branchMemoryRange,
        0,
        18
      );

    const strokeWidth =
      map(
        this.generation,
        0,
        SETTINGS.maxGeneration,
        2.25,
        0.55
      ) *
      map(
        constrain(memory, 0, SETTINGS.branchMemoryRange),
        0,
        SETTINGS.branchMemoryRange,
        1.0,
        1.65
      );

    if (!wrapped) {
      artLayer.stroke(
        rgb.r,
        rgb.g,
        rgb.b,
        strokeAlpha
      );

      artLayer.strokeWeight(strokeWidth);

      artLayer.line(
        this.prev.x,
        this.prev.y,
        this.pos.x,
        this.pos.y
      );
    }

    if (
      memory > SETTINGS.nodeMemoryThreshold &&
      random() < SETTINGS.nodeChance
    ) {
      artLayer.noFill();

      artLayer.stroke(
        rgb.r,
        rgb.g,
        rgb.b,
        nodeAlpha * 0.65
      );

      artLayer.strokeWeight(
        max(0.4, strokeWidth * 0.55)
      );

      const nodeSize =
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
        nodeSize,
        nodeSize
      );
    }
  }


  branch(memory) {
    const childAngle =
      this.angle +
      random(-1.35, 1.35) +
      this.orbitDir * random(-0.3, 0.3);

    let childColor = this.colorIndex;

    if (random() >= 0.75) {
      childColor =
        (
          this.colorIndex +
          floor(random(1, paletteColors.length))
        ) %
        paletteColors.length;
    }

    const child = new MemoryWalker(
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
      this.speed * random(0.85, 1.15)
    );

    child.turnBias =
      this.turnBias +
      random(-0.01, 0.01);

    child.energy = this.energy * 0.92;

    walkers.push(child);

    // Branching costs the parent and leaves a stronger memory trace.
    this.energy *= 0.92;

    depositField(
      this.pos.x,
      this.pos.y,
      0.6 + memory * 0.2,
      SETTINGS.depositRadius + 1
    );
  }
}


// ============================================================
// MEMORY FIELD
// ============================================================

function depositField(x, y, amount, radius) {
  const gx = floor(x / SETTINGS.cellSize);
  const gy = floor(y / SETTINGS.cellSize);

  for (let oy = -radius; oy <= radius; oy++) {
    for (let ox = -radius; ox <= radius; ox++) {
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

      const distanceSquared =
        ox * ox +
        oy * oy;

      if (distanceSquared > radius * radius) {
        continue;
      }

      const falloff =
        1 -
        distanceSquared /
          (radius * radius + 0.0001);

      const index = yy * cols + xx;

      // Diminishing returns prevent the field from instantly saturating.
      memoryField[index] +=
        amount *
        falloff *
        (
          1 -
          memoryField[index] /
          SETTINGS.memoryCapacity
        );
    }
  }
}


function sampleField(x, y) {
  const gx = constrain(
    floor(x / SETTINGS.cellSize),
    0,
    cols - 1
  );

  const gy = constrain(
    floor(y / SETTINGS.cellSize),
    0,
    rows - 1
  );

  return memoryField[gy * cols + gx];
}


function sampleGradient(x, y) {
  const d = SETTINGS.cellSize;

  const left = sampleField(x - d, y);
  const right = sampleField(x + d, y);
  const up = sampleField(x, y - d);
  const down = sampleField(x, y + d);

  return createVector(
    right - left,
    down - up
  );
}


function decayMemoryField() {
  for (let i = 0; i < memoryField.length; i++) {
    memoryField[i] *= SETTINGS.memoryDecay;

    if (memoryField[i] < 0.0001) {
      memoryField[i] = 0;
    }
  }
}


// ============================================================
// WRAPPING
// ============================================================

function wrapPosition(position) {
  let wrapped = false;

  if (position.x < 0) {
    position.x += width;
    wrapped = true;
  } else if (position.x >= width) {
    position.x -= width;
    wrapped = true;
  }

  if (position.y < 0) {
    position.y += height;
    wrapped = true;
  } else if (position.y >= height) {
    position.y -= height;
    wrapped = true;
  }

  return wrapped;
}


// ============================================================
// PAPER
// ============================================================

function buildPaperLayer() {
  const base = hexToRgb(paperColor);

  paperLayer.background(paperColor);
  paperLayer.noStroke();

  // Soft tonal stains.
  for (let i = 0; i < 18; i++) {
    const stainAlpha = random(6, 16);

    paperLayer.fill(
      constrain(base.r - random(2, 10), 0, 255),
      constrain(base.g - random(2, 8), 0, 255),
      constrain(base.b - random(2, 6), 0, 255),
      stainAlpha
    );

    paperLayer.ellipse(
      random(width),
      random(height),
      random(80, 260),
      random(60, 220)
    );
  }

  // Grain.
  const grainCount = width * height * 0.015;

  for (let i = 0; i < grainCount; i++) {
    const x = random(width);
    const y = random(height);
    const variation = random(-12, 12);

    paperLayer.stroke(
      constrain(base.r + variation, 0, 255),
      constrain(base.g + variation, 0, 255),
      constrain(base.b + variation, 0, 255),
      random(8, 20)
    );

    paperLayer.point(x, y);
  }

  // Sparse fibers.
  paperLayer.stroke(255, 255, 255, 12);

  for (let i = 0; i < 1500; i++) {
    const x = random(width);
    const y = random(height);
    const angle = random(TWO_PI);
    const length = random(3, 10);

    paperLayer.line(
      x,
      y,
      x + cos(angle) * length,
      y + sin(angle) * length
    );
  }
}


// ============================================================
// DEBUG / HUD
// ============================================================

function drawFieldDebug() {
  background(0);
  noStroke();

  const maxValue = getMaxMemory();

  if (maxValue <= 0) {
    return;
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const value = memoryField[y * cols + x];

      const brightness = map(
        value,
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
}


function getMaxMemory() {
  let maxValue = 0;

  for (let i = 0; i < memoryField.length; i++) {
    if (memoryField[i] > maxValue) {
      maxValue = memoryField[i];
    }
  }

  return maxValue;
}


function drawHUD() {
  const maxMemory = getMaxMemory();

  noStroke();
  fill(20, 100);
  rect(12, 12, 310, 98, 8);

  fill(255, 230);
  textSize(12);
  textAlign(LEFT, TOP);

  text(`seed: ${seed}`, 22, 22);
  text(`palette: ${currentPalette.name}`, 22, 38);
  text(`walkers: ${walkers.length}`, 22, 54);
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

function angleDifference(target, current) {
  let delta = target - current;

  while (delta > PI) {
    delta -= TWO_PI;
  }

  while (delta < -PI) {
    delta += TWO_PI;
  }

  return delta;
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
  if (key === "r" || key === "R") {
    initSketch();
  } else if (key === "s" || key === "S") {
    saveCanvas(
      `temporal-memory-${seed}`,
      "png"
    );
  } else if (key === "m" || key === "M") {
    showField = !showField;
  } else if (key === " ") {
    paused = !paused;
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initSketch();
}
