let paperLayer;
let washLayer;
let textureLayer;
let inkLayer;

let paperRenderer;
let watercolorRenderer;
let intentEngine;
let testComposition;

let paperTextureImage = null;
let seed;
let currentIntent = null;
let currentElements = [];

function preload() {
  if (SETTINGS.paper.mode === "image" || SETTINGS.paper.mode === "hybrid") {
    paperTextureImage = loadImage(SETTINGS.paper.imagePath);
  }
}

function setup() {
  pixelDensity(SETTINGS.canvas.pixelDensity);

  createCanvas(
    SETTINGS.canvas.width,
    SETTINGS.canvas.height
  );

  paperLayer = createGraphics(width, height);
  washLayer = createGraphics(width, height);
  textureLayer = createGraphics(width, height);
  inkLayer = createGraphics(width, height);

  paperRenderer = new PaperRenderer(
    paperLayer,
    SETTINGS.paper,
    paperTextureImage
  );

  watercolorRenderer = new WatercolorRenderer(
    washLayer,
    SETTINGS.watercolor
  );

  intentEngine = new IntentEngine(INTENTS, SETTINGS.intent);
  testComposition = new TestComposition(width, height, SETTINGS.composition);

  generateNewArtwork();
  noLoop();
}

function draw() {
  background(210);

  image(paperLayer, 0, 0);
  image(washLayer, 0, 0);
  image(textureLayer, 0, 0);
  image(inkLayer, 0, 0);
}

function generateNewArtwork(intentName = null) {
  seed = Math.floor(Math.random() * 999999);
  renderArtwork(seed, intentName);
}

function renderArtwork(seedToUse, intentName = null) {
  seed = seedToUse;

  // Reset the p5 random streams before BOTH intent choice and composition.
  // This keeps a seed reproducible, including when comparing named intents.
  randomSeed(seed);
  noiseSeed(seed);

  currentIntent = intentEngine.chooseIntent(intentName);

  // Re-seed after intent selection so explicit named-intent comparisons use
  // exactly the same compositional random stream for the same seed.
  randomSeed(seed + 101);
  noiseSeed(seed + 101);
  currentElements = testComposition.create(currentIntent);

  paperRenderer.render(seed);

  washLayer.clear();
  textureLayer.clear();
  inkLayer.clear();

  watercolorRenderer.renderElements(seed, currentElements);

  updateArtworkStatus();

  console.log(
    `abstractArtist v0.2d seed: ${seed} | intent: ${currentIntent.name}`
  );
  console.table(currentElements.map((element) => ({
    type: element.type,
    role: element.composition.role,
    cluster: element.composition.cluster,
    tension: element.dynamics.tension.toFixed(2),
    isolation: element.dynamics.isolation.toFixed(2),
    continuity: element.dynamics.continuity.toFixed(2)
  })));
  console.table(currentIntent.compositionBias);

  redraw();
}

function cycleIntent(direction) {
  const nextName = intentEngine.getAdjacentIntentName(
    currentIntent?.name,
    direction
  );

  // Critical test feature: preserve the seed while changing only intent.
  renderArtwork(seed, nextName);
}

function updateArtworkStatus() {
  const intentEl = document.getElementById("intentValue");
  const seedEl = document.getElementById("seedValue");

  if (intentEl) intentEl.textContent = currentIntent?.name || "—";
  if (seedEl) seedEl.textContent = seed ?? "—";
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    // New seed, same intent: useful for judging family resemblance.
    generateNewArtwork(currentIntent?.name);
  }

  if (key === 'n' || key === 'N') {
    // New seed and a newly selected intent.
    generateNewArtwork();
  }

  if (key === '[') {
    cycleIntent(-1);
  }

  if (key === ']') {
    cycleIntent(1);
  }

  if (key === 's' || key === 'S') {
    saveCanvas(
      `abstractArtist-v0.2d-${currentIntent.name}-${seed}`,
      'png'
    );
  }

  if (key === 'm' || key === 'M') {
    const modes = ["procedural", "image", "hybrid"];
    const idx = modes.indexOf(SETTINGS.paper.mode);
    SETTINGS.paper.mode = modes[(idx + 1) % modes.length];
    renderArtwork(seed, currentIntent?.name);
  }
}
