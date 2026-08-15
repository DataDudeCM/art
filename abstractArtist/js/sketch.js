let paperLayer;
let washLayer;
let textureLayer;
let inkLayer;

let paperRenderer;
let watercolorRenderer;

let paperTextureImage = null;
let seed;

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

function regenerateArtwork() {
  seed = Math.floor(Math.random() * 999999);

  randomSeed(seed);
  noiseSeed(seed);

  paperRenderer.render(seed);

  washLayer.clear();
  textureLayer.clear();
  inkLayer.clear();

  watercolorRenderer.renderTestStudy(seed);

  console.log(`abstractArtist v0.2a seed: ${seed}`);

  redraw();
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    regenerateArtwork();
  }

  if (key === 's' || key === 'S') {
    saveCanvas(
      `abstractArtist-v0.2a-${seed}`,
      'png'
    );
  }

  if (key === 'm' || key === 'M') {
    const modes = ["procedural", "image", "hybrid"];
    const idx = modes.indexOf(SETTINGS.paper.mode);
    SETTINGS.paper.mode = modes[(idx + 1) % modes.length];
    regenerateArtwork();
  }
}
