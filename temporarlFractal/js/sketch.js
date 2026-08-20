let seed;
let canvas;
let paperLayer;
let artLayer;
let viewLayer;

let walkers = [];
let nextWalkerId = 0;

let cols;
let rows;
let memoryField;

let currentPalette;
let paletteColors;
let paperColor;

let paused = false;

const PANEL_WIDTH = 320;
const PANEL_GAP = 16;

const DEFAULT_SETTINGS = Object.freeze({
  cellSize: 8,

  rootCount: 5,
  maxGeneration: 7,
  stepsPerFrame: 3,

  depositAmount: 0.015,
  depositRadius: 2,
  memoryDecay: 0.992,
  memorySaturation: 0.8,
  memoryCapacity: 2.5,

  probeDistance: 16,
  probeAngle: 0.45,
  turnStep: 0.055, // default 0.055
  gradientInfluence: 0.18,
  noiseTurn: 0.035,
  jitter: 0.01,
  maxTurn: 0.18,
  driftScale: 0.25,
  memoryTurbulence: 1.5,

  branchMinAge: 20,
  branchChance: 0.0085,
  branchMemoryRange: 3,

  reseedMemoryThreshold: 0.25,
  reseedCandidatePool: 30,

  pathAlphaMin: 10,
  pathAlphaMax: 30,
  nodeMemoryThreshold: 1.1,
  nodeChance: 0.14,
  walkerDotSize: 2.4
});

let SETTINGS = { ...DEFAULT_SETTINGS };

const UI_STATE = {
  showArtwork: true,
  showMemoryField: false,
  showWalkers: false,
  showHUD: true,
  includeHUDInSave: false
};

const ui = {
  panel: null,
  sliders: {},
  valueSpans: {},
  checkboxes: {}
};

function setup() {
  applyBasePageStyles();

  canvas = createCanvas(getCanvasWidth(), windowHeight);
  canvas.position(0, 0);
  canvas.style("display", "block");

  pixelDensity(1);

  createControlPanel();
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
}

function applyBasePageStyles() {
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "#d2ccbf";
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
  viewLayer = createGraphics(width, height);

  paperLayer.pixelDensity(1);
  artLayer.pixelDensity(1);
  viewLayer.pixelDensity(1);

  artLayer.colorMode(RGB, 255, 255, 255, 255);
  viewLayer.colorMode(RGB, 255, 255, 255, 255);

  buildPaperLayer();
  artLayer.clear();
  viewLayer.clear();
}

function draw() {
  if (!paused) {
    stepSystem();
    decayMemoryField();

    if (walkers.length < 2 && frameCount % 20 === 0) {
      seedFromMemory();
    }
  }

  renderSceneToLayer(viewLayer, {
    showArtwork: UI_STATE.showArtwork,
    showMemoryField: UI_STATE.showMemoryField,
    showWalkers: UI_STATE.showWalkers,
    showHUD: UI_STATE.showHUD
  });

  background(paperColor);
  image(viewLayer, 0, 0);
}

function renderSceneToLayer(layer, options) {
  layer.push();

  if (options.showArtwork) {
    layer.background(paperColor);
    layer.image(paperLayer, 0, 0);
    layer.image(artLayer, 0, 0);
  } else if (options.showMemoryField) {
    layer.background(0);
  } else {
    layer.background(paperColor);
  }

  if (options.showMemoryField) {
    drawFieldDebugToLayer(layer, options.showArtwork ? 85 : 255);
  }

  if (options.showWalkers) {
    drawWalkersToLayer(layer);
  }

  if (options.showHUD) {
    drawHUDToLayer(layer);
  }

  layer.pop();
}

function drawFieldDebugToLayer(layer, alphaValue = 255) {
  layer.noStroke();

  const maxValue = getMaxMemory();
  if (maxValue <= 0) return;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const value = memoryField[y * cols + x];
      const brightness = map(value, 0, maxValue, 0, 255);
      layer.fill(brightness, alphaValue);
      layer.rect(
        x * SETTINGS.cellSize,
        y * SETTINGS.cellSize,
        SETTINGS.cellSize,
        SETTINGS.cellSize
      );
    }
  }
}

function drawWalkersToLayer(layer) {
  layer.noStroke();

  for (const walker of walkers) {
    const c = color(paletteColors[walker.colorIndex]);
    layer.fill(red(c), green(c), blue(c), 180);
    layer.circle(walker.pos.x, walker.pos.y, SETTINGS.walkerDotSize);
  }
}

function drawHUDToLayer(layer) {
  const maxMemory = getMaxMemory();

  layer.noStroke();
  layer.fill(20, 100);
  layer.rect(12, 12, 310, 98, 8);

  layer.fill(255, 230);
  layer.textSize(12);
  layer.textAlign(LEFT, TOP);
  layer.text(`seed: ${seed}`, 22, 22);
  layer.text(`palette: ${currentPalette.name}`, 22, 38);
  layer.text(`walkers: ${walkers.length}`, 22, 54);
  layer.text("[R] regenerate   [S] save   [M] memory   [SPACE] pause", 22, 70);
  layer.text(`max memory: ${maxMemory.toFixed(2)}`, 22, 86);
}

function seedRoots() {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const startAngle = random(TWO_PI);

  for (let i = 0; i < SETTINGS.rootCount; i++) {
    const angle =
      startAngle + map(i, 0, SETTINGS.rootCount, 0, TWO_PI);
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

  const poolSize = min(SETTINGS.reseedCandidatePool, candidates.length);
  const count = min(SETTINGS.rootCount, candidates.length);

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
    const count = walkers.length;

    for (let i = count - 1; i >= 0; i--) {
      if (walkers[i]) {
        walkers[i].step();
      }
    }

    walkers = walkers.filter(walker => !walker.dead);
  }
}

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
      map(generation, 0, SETTINGS.maxGeneration, 1.0, 0.72);

    this.turnBias = random(-0.02, 0.02);
    this.age = 0;
    this.energy = 1;

    this.lifespan =
      random(170, 330) *
      map(generation, 0, SETTINGS.maxGeneration, 1.0, 0.65);

    this.dead = false;
  }

  step() {
    this.prev.set(this.pos);

    this.angle += this.computeTurn();

    this.pos.x += cos(this.angle) * this.speed;
    this.pos.y += sin(this.angle) * this.speed;

    const wrapped = wrapPosition(this.pos);

    if (wrapped) {
      this.prev.set(this.pos);
    }

    const memory = sampleField(this.pos.x, this.pos.y);

    depositField(
      this.pos.x,
      this.pos.y,
      SETTINGS.depositAmount *
        map(this.generation, 0, SETTINGS.maxGeneration, 1.0, 0.65),
      SETTINGS.depositRadius
    );

    this.draw(memory, wrapped);

    this.age++;
    this.energy *= 0.9975;

    this.maybeBranch(memory);

    if (this.age > this.lifespan || this.energy < 0.08) {
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

    if (left < right) {
      turn -= SETTINGS.turnStep;
    } else if (right < left) {
      turn += SETTINGS.turnStep;
    }

    if (ahead > SETTINGS.memorySaturation) {
      turn += random([-1, 1]) * SETTINGS.turnStep * 1.5;
    }

    const gradient = sampleGradient(this.pos.x, this.pos.y);

    if (gradient.magSq() > 0.00001) {
      const contourAngle =
        atan2(gradient.y, gradient.x) +
        this.orbitDir * HALF_PI;

      turn +=
        angleDifference(contourAngle, this.angle) *
        SETTINGS.gradientInfluence;
    }

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

    const memoryFactor = map(
      constrain(ahead, 0, SETTINGS.memorySaturation),
      0,
      SETTINGS.memorySaturation,
      0.4,
      SETTINGS.memoryTurbulence
    );

    turn *= memoryFactor;

    return constrain(turn, -SETTINGS.maxTurn, SETTINGS.maxTurn);
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
      SETTINGS.branchChance * memoryFactor * ageFactor;

    if (random() < branchProbability) {
      this.branch(memory);
    }
  }

  draw(memory, wrapped) {
    const rgb = hexToRgb(paletteColors[this.colorIndex]);

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
      map(this.generation, 0, SETTINGS.maxGeneration, 28, 8) +
      map(
        constrain(memory, 0, SETTINGS.branchMemoryRange),
        0,
        SETTINGS.branchMemoryRange,
        0,
        18
      );

    const strokeWidth =
      map(this.generation, 0, SETTINGS.maxGeneration, 2.25, 0.55) *
      map(
        constrain(memory, 0, SETTINGS.branchMemoryRange),
        0,
        SETTINGS.branchMemoryRange,
        1.0,
        1.65
      );

    if (!wrapped) {
      artLayer.stroke(rgb.r, rgb.g, rgb.b, strokeAlpha);
      artLayer.strokeWeight(strokeWidth);
      artLayer.line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
    }

    if (
      memory > SETTINGS.nodeMemoryThreshold &&
      random() < SETTINGS.nodeChance
    ) {
      artLayer.noFill();
      artLayer.stroke(rgb.r, rgb.g, rgb.b, nodeAlpha * 0.65);
      artLayer.strokeWeight(max(0.4, strokeWidth * 0.55));

      const nodeSize =
        random(4, 18) *
        map(this.generation, 0, SETTINGS.maxGeneration, 1.0, 0.7);

      artLayer.ellipse(this.pos.x, this.pos.y, nodeSize, nodeSize);
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

    child.speed = max(0.45, this.speed * random(0.85, 1.15));
    child.turnBias = this.turnBias + random(-0.01, 0.01);
    child.energy = this.energy * 0.92;

    walkers.push(child);

    this.energy *= 0.92;

    depositField(
      this.pos.x,
      this.pos.y,
      0.6 + memory * 0.2,
      SETTINGS.depositRadius + 1
    );
  }
}

function depositField(x, y, amount, radius) {
  const gx = floor(x / SETTINGS.cellSize);
  const gy = floor(y / SETTINGS.cellSize);

  for (let oy = -radius; oy <= radius; oy++) {
    for (let ox = -radius; ox <= radius; ox++) {
      const xx = gx + ox;
      const yy = gy + oy;

      if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) {
        continue;
      }

      const distanceSquared = ox * ox + oy * oy;

      if (distanceSquared > radius * radius) {
        continue;
      }

      const falloff =
        1 - distanceSquared / (radius * radius + 0.0001);

      const index = yy * cols + xx;

      memoryField[index] +=
        amount *
        falloff *
        (1 - memoryField[index] / SETTINGS.memoryCapacity);
    }
  }
}

function sampleField(x, y) {
  const gx = constrain(floor(x / SETTINGS.cellSize), 0, cols - 1);
  const gy = constrain(floor(y / SETTINGS.cellSize), 0, rows - 1);

  return memoryField[gy * cols + gx];
}

function sampleGradient(x, y) {
  const d = SETTINGS.cellSize;

  const left = sampleField(x - d, y);
  const right = sampleField(x + d, y);
  const up = sampleField(x, y - d);
  const down = sampleField(x, y + d);

  return createVector(right - left, down - up);
}

function decayMemoryField() {
  for (let i = 0; i < memoryField.length; i++) {
    memoryField[i] *= SETTINGS.memoryDecay;

    if (memoryField[i] < 0.0001) {
      memoryField[i] = 0;
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

function buildPaperLayer() {
  const base = hexToRgb(paperColor);

  paperLayer.background(paperColor);
  paperLayer.noStroke();

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

function createControlPanel() {
  ui.panel = document.createElement("div");
  ui.panel.id = "temporal-ui-panel";

  Object.assign(ui.panel.style, {
    position: "fixed",
    top: "0",
    right: "0",
    width: `${PANEL_WIDTH}px`,
    height: "100vh",
    boxSizing: "border-box",
    overflowY: "auto",
    padding: "16px 16px 40px 16px",
    background: "rgba(235, 229, 216, 0.97)",
    borderLeft: "1px solid rgba(120, 105, 85, 0.22)",
    boxShadow: "0 0 20px rgba(0,0,0,0.08)",
    color: "#3f3a33",
    fontFamily: "system-ui, sans-serif",
    fontSize: "13px",
    lineHeight: "1.35",
    zIndex: "10"
  });

  document.body.appendChild(ui.panel);

  addPanelTitle("Temporal Fractal");
  addPanelNote("Live controls for display, saving, and behavior.");

  addSectionHeader("Display");
  addCheckbox("showArtwork", "Artwork", UI_STATE.showArtwork, value => {
    UI_STATE.showArtwork = value;
  });
  addCheckbox("showMemoryField", "Memory field", UI_STATE.showMemoryField, value => {
    UI_STATE.showMemoryField = value;
  });
  addCheckbox("showWalkers", "Walkers", UI_STATE.showWalkers, value => {
    UI_STATE.showWalkers = value;
  });
  addCheckbox("showHUD", "HUD", UI_STATE.showHUD, value => {
    UI_STATE.showHUD = value;
  });

  addSectionHeader("Save");
  addCheckbox("includeHUDInSave", "Include HUD in save", UI_STATE.includeHUDInSave, value => {
    UI_STATE.includeHUDInSave = value;
  });
  addButtonRow([
    { label: "Save PNG", onClick: saveRenderedImage }
  ]);

  addSectionHeader("Actions");
  addButtonRow([
    { label: "New Seed", onClick: initSketch },
    { label: "Reset Params", onClick: resetParameters }
  ]);
  addButtonRow([
    { label: () => paused ? "Resume" : "Pause", onClick: togglePause, dynamic: true }
  ]);

  addSectionHeader("Memory");
  addSlider("depositAmount", "Deposit", 0.001, 0.05, 0.001);
  addSlider("memoryDecay", "Decay", 0.97, 0.9995, 0.0005);
  addSlider("memoryCapacity", "Capacity", 0.5, 5.0, 0.05);
  addSlider("memorySaturation", "Saturation", 0.2, 2.0, 0.01);

  addSectionHeader("Movement");
  addSlider("memoryTurbulence", "Memory turbulence", 0.6, 3.0, 0.05);
  addSlider("gradientInfluence", "Gradient influence", 0.0, 0.6, 0.01);
  addSlider("noiseTurn", "Noise turn", 0.0, 0.1, 0.001);
  addSlider("jitter", "Jitter", 0.0, 0.05, 0.001);

  addSectionHeader("Branching");
  addSlider("branchChance", "Branch chance", 0.0, 0.03, 0.0005);
  addSlider("maxGeneration", "Max generation", 1, 12, 1, true);

  addSectionHeader("Simulation");
  addSlider("stepsPerFrame", "Steps / frame", 1, 10, 1, true);
  addSlider("rootCount", "Root count", 1, 12, 1, true);

  addPanelNote("Tips: Artwork + Memory field together gives you an overlay. Turn Artwork off to inspect the field alone.");
}

function addPanelTitle(textContent) {
  const el = document.createElement("div");
  el.textContent = textContent;
  Object.assign(el.style, {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "6px"
  });
  ui.panel.appendChild(el);
}

function addPanelNote(textContent) {
  const el = document.createElement("div");
  el.textContent = textContent;
  Object.assign(el.style, {
    fontSize: "12px",
    opacity: "0.82",
    marginBottom: "14px"
  });
  ui.panel.appendChild(el);
}

function addSectionHeader(textContent) {
  const el = document.createElement("div");
  el.textContent = textContent;
  Object.assign(el.style, {
    marginTop: "16px",
    marginBottom: "8px",
    paddingTop: "8px",
    borderTop: "1px solid rgba(120, 105, 85, 0.18)",
    fontWeight: "700",
    letterSpacing: "0.02em"
  });
  ui.panel.appendChild(el);
}

function addCheckbox(key, label, initialValue, onChange) {
  const wrap = document.createElement("label");
  Object.assign(wrap.style, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    cursor: "pointer"
  });

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = initialValue;
  input.addEventListener("change", () => onChange(input.checked));

  const text = document.createElement("span");
  text.textContent = label;

  wrap.appendChild(input);
  wrap.appendChild(text);
  ui.panel.appendChild(wrap);

  ui.checkboxes[key] = input;
}

function addButtonRow(buttonDefs) {
  const row = document.createElement("div");
  Object.assign(row.style, {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
    flexWrap: "wrap"
  });

  buttonDefs.forEach(def => {
    const btn = document.createElement("button");
    btn.textContent = typeof def.label === "function" ? def.label() : def.label;

    Object.assign(btn.style, {
      padding: "7px 10px",
      borderRadius: "8px",
      border: "1px solid rgba(120, 105, 85, 0.25)",
      background: "#f7f2e8",
      color: "#3f3a33",
      cursor: "pointer"
    });

    btn.addEventListener("click", () => {
      def.onClick();
      if (def.dynamic && typeof def.label === "function") {
        btn.textContent = def.label();
      }
    });

    row.appendChild(btn);
  });

  ui.panel.appendChild(row);
}

function addSlider(key, label, minValue, maxValue, stepValue, integer = false) {
  const wrap = document.createElement("div");
  wrap.style.marginBottom = "12px";

  const topRow = document.createElement("div");
  Object.assign(topRow.style, {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "4px"
  });

  const labelEl = document.createElement("span");
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.style.fontVariantNumeric = "tabular-nums";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = minValue;
  slider.max = maxValue;
  slider.step = stepValue;
  slider.value = SETTINGS[key];
  slider.style.width = "100%";

  const updateFromSlider = () => {
    SETTINGS[key] = integer ? parseInt(slider.value) : parseFloat(slider.value);
    valueEl.textContent = formatSliderValue(SETTINGS[key], stepValue);
  };

  slider.addEventListener("input", updateFromSlider);
  updateFromSlider();

  topRow.appendChild(labelEl);
  topRow.appendChild(valueEl);

  wrap.appendChild(topRow);
  wrap.appendChild(slider);
  ui.panel.appendChild(wrap);

  ui.sliders[key] = slider;
  ui.valueSpans[key] = valueEl;
}

function formatSliderValue(value, stepValue) {
  const decimals = Math.max(0, (stepValue.toString().split(".")[1] || "").length);
  return Number(value).toFixed(decimals);
}

function syncUIFromSettings() {
  Object.keys(ui.sliders).forEach(key => {
    const slider = ui.sliders[key];
    slider.value = SETTINGS[key];

    const stepValue = parseFloat(slider.step);
    ui.valueSpans[key].textContent = formatSliderValue(
      SETTINGS[key],
      stepValue
    );
  });
}

function resetParameters() {
  SETTINGS = { ...DEFAULT_SETTINGS };
  syncUIFromSettings();
}

function togglePause() {
  paused = !paused;
}

function saveRenderedImage() {
  const exportLayer = createGraphics(width, height);
  exportLayer.pixelDensity(1);
  exportLayer.colorMode(RGB, 255, 255, 255, 255);

  renderSceneToLayer(exportLayer, {
    showArtwork: UI_STATE.showArtwork,
    showMemoryField: UI_STATE.showMemoryField,
    showWalkers: UI_STATE.showWalkers,
    showHUD: UI_STATE.includeHUDInSave
  });

  save(exportLayer, `temporal-fractal-${seed}.png`);
}

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

function getCanvasWidth() {
  return max(420, windowWidth - PANEL_WIDTH - PANEL_GAP);
}

function keyPressed() {
  if (key === "r" || key === "R") {
    initSketch();
  } else if (key === "s" || key === "S") {
    saveRenderedImage();
  } else if (key === "m" || key === "M") {
    UI_STATE.showMemoryField = !UI_STATE.showMemoryField;
    ui.checkboxes.showMemoryField.checked = UI_STATE.showMemoryField;
  } else if (key === "h" || key === "H") {
    UI_STATE.showHUD = !UI_STATE.showHUD;
    ui.checkboxes.showHUD.checked = UI_STATE.showHUD;
  } else if (key === "w" || key === "W") {
    UI_STATE.showWalkers = !UI_STATE.showWalkers;
    ui.checkboxes.showWalkers.checked = UI_STATE.showWalkers;
  } else if (key === "a" || key === "A") {
    UI_STATE.showArtwork = !UI_STATE.showArtwork;
    ui.checkboxes.showArtwork.checked = UI_STATE.showArtwork;
  } else if (key === " ") {
    paused = !paused;
  }
}

function windowResized() {
  resizeCanvas(getCanvasWidth(), windowHeight);
  initSketch();
}
