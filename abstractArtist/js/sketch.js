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

  intentEngine = new IntentEngine(INTENTS);
  testComposition = new TestComposition(width, height);

  regenerateArtwork();
  noLoop();
}

function draw() {
  background(210);

  image(paperLayer, 0, 0);
  image(washLayer, 0, 0);
  image(textureLayer, 0, 0);
  image(inkLayer, 0, 0);
}

function regenerateArtwork(intentName = null) {
  seed = Math.floor(Math.random() * 999999);

  randomSeed(seed);
  noiseSeed(seed);

  currentIntent = intentEngine.chooseIntent(intentName);
  currentElements = testComposition.create(currentIntent);

  paperRenderer.render(seed);

  washLayer.clear();
  textureLayer.clear();
  inkLayer.clear();

  watercolorRenderer.renderElements(seed, currentElements);

  console.log(
    `abstractArtist v0.2b seed: ${seed} | intent: ${currentIntent.name}`
  );
  console.table(currentElements.map((element) => ({
    type: element.type,
    role: element.composition.role,
    tension: element.dynamics.tension.toFixed(2),
    isolation: element.dynamics.isolation.toFixed(2),
    continuity: element.dynamics.continuity.toFixed(2)
  })));

  redraw();
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    regenerateArtwork();
  }

  if (key === 's' || key === 'S') {
    saveCanvas(
      `abstractArtist-v0.2b-${currentIntent.name}-${seed}`,
      'png'
    );
  }

  if (key === 'm' || key === 'M') {
    const modes = ["procedural", "image", "hybrid"];
    const idx = modes.indexOf(SETTINGS.paper.mode);
    SETTINGS.paper.mode = modes[(idx + 1) % modes.length];
    regenerateArtwork(currentIntent?.name);
  }
}
