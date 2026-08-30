let palette;
let boundaryLayer;
let paintLayer;

let brushManifest;
let brushImages = [];

let lastGenerationTime = 0;

function preload() {
  loadJSON(
    "../common/brushes/brushes.json",

    data => {
      brushManifest = data;

      for (const filename of brushManifest.brushes) {
        brushImages.push(
          loadImage(`../common/brushes/${filename}`)
        );
      }
    },

    error => {
      console.error("Could not load brush manifest:", error);
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  boundaryLayer = createGraphics(width, height);
  paintLayer = createGraphics(width, height);

  generateArtwork();

  lastGenerationTime = millis();

  console.log("Brushes loaded:", brushImages.length);
}

function draw() {
  background(SETTINGS.canvas.paperColor);

  image(paintLayer, 0, 0);

  if (SETTINGS.boundary.visible) {
    image(boundaryLayer, 0, 0);
  }

  const interval =
    SETTINGS.canvas.regenerateSeconds * 1000;

  if (
    SETTINGS.canvas.autoRegenerate &&
    millis() - lastGenerationTime >= interval
  ) {
    generateArtwork();
    lastGenerationTime = millis();
  }
}

function generateArtwork() {
  boundaryLayer.clear();
  paintLayer.clear();

  palette = randomPalette();
  SETTINGS.canvas.paperColor =
    getLightColor(palette);

  generateBoundary();

  for (let i = 0; i < SETTINGS.fill.attempts; i++) {
    testRegion();
  }
}

function testRegion() {
  const x = random(width);
  const y = random(height);

  const region =
    floodFillRegion(boundaryLayer, x, y);

  if (!region) {
    return;
  }

  const regionColor =
    randomColor(palette);

  paintRegion(
    region,
    paintLayer,
    regionColor
  );
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  boundaryLayer =
    createGraphics(width, height);

  paintLayer =
    createGraphics(width, height);

  generateArtwork();
  lastGenerationTime = millis();
}

function getTimestamp() {
  return (
    nf(year(), 4) +
    nf(month(), 2) +
    nf(day(), 2) + "-" +
    nf(hour(), 2) +
    nf(minute(), 2) +
    nf(second(), 2)
  );
}

function saveArtwork() {
  const timestamp = getTimestamp();

  saveCanvas(
    `regionPainter-${timestamp}`,
    "png"
  );
}

function buildPresetData() {
  return {
    timestamp: getTimestamp(),
    paletteKey: getPaletteKey(palette),
    paletteName: palette?.name || null,
    settings: JSON.parse(JSON.stringify(SETTINGS))
  };
}

function savePresetToFile() {
  const preset = buildPresetData();
  const json = JSON.stringify(preset, null, 2);

  const blob = new Blob([json], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download =
    `regionPainter-preset-${preset.timestamp}.json`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function keyPressed() {
  if (key === "s" || key === "S") {
    saveArtwork();
    savePresetToFile();
  }

  if (key === "p" || key === "P") {
    savePresetToFile();
  }
}