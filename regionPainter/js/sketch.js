let palette;

let boundaryDetectionLayer;
let boundaryLayer;
let paintLayer;
let textureLayer;

let brushManifest;
let brushImages = [];
let brushNames = [];

let lastGenerationTime = 0;

let currentPreset = null;

const UI_STATE = {
  paletteMode: "inherit", // "inherit" | "random" | "fixed"
  fixedPaletteKey: null,
  autoRegenerate: false,
  isGenerating: false
};

function preload() {
  loadPresetLibrary();
  loadJSON(
    "../common/brushes/brushes.json",

    data => {
      brushManifest = data;

      for (const filename of brushManifest.brushes) {
        brushNames.push(filename);
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
  pixelDensity(1);
  const canvas =
    createCanvas(
      getCanvasWidth(),
      windowHeight
    );

  canvas.parent("canvas-container");

  boundaryDetectionLayer =
    createGraphics(width, height);

  boundaryLayer =
    createGraphics(width, height);

  paintLayer =
    createGraphics(width, height);

  textureLayer =
    createGraphics(width, height);

  //requestGenerate();
  
  setupUI();
  
  console.log("Brushes loaded:", brushImages.length);
}

function draw() {
  if (!UI_STATE.autoRegenerate) {
    return;
  }

  const interval =
    SETTINGS.canvas.regenerateSeconds * 1000;

  if (
    !UI_STATE.isGenerating &&
    millis() - lastGenerationTime >= interval
  ) {
    requestGenerate();
  }
}

function getCanvasWidth() {
  return document
    .getElementById("canvas-container")
    .clientWidth;
}

function resolveActivePalette() {

  if (UI_STATE.paletteMode === "random") {
    return randomPalette();
  }

  if (
    UI_STATE.paletteMode === "fixed" &&
    UI_STATE.fixedPaletteKey &&
    PALETTES[UI_STATE.fixedPaletteKey]
  ) {
    return PALETTES[UI_STATE.fixedPaletteKey];
  }

  if (
    currentPreset &&
    currentPreset.paletteKey &&
    PALETTES[currentPreset.paletteKey]
  ) {
    return PALETTES[currentPreset.paletteKey];
  }

  return randomPalette();
}

function generateArtwork() {
  boundaryDetectionLayer.clear();
  boundaryLayer.clear();
  paintLayer.clear();

  palette = resolveActivePalette();
  const paletteDisplay =
    document.getElementById("active-palette");

  if (paletteDisplay) {
    paletteDisplay.textContent =
      `Current: ${palette?.name || "Unknown"}`;
  }

  SETTINGS.canvas.paperColor =
    getLightColor(palette);

  generateBoundary();

  for (
    let i = 0;
    i < SETTINGS.fill.attempts;
    i++
  ) {
    testRegion();
  }

  generateTextureLayer();

  renderArtwork();
}

function renderArtwork() {
  background(SETTINGS.canvas.paperColor);

  image(paintLayer, 0, 0);

  if (SETTINGS.boundary.visible) {
    image(boundaryLayer, 0, 0);
  }

  if (SETTINGS.texture.enabled) {
    push();

    if (SETTINGS.texture.blendMode === "multiply") {
      blendMode(MULTIPLY);
    } else if (SETTINGS.texture.blendMode === "overlay") {
      blendMode(OVERLAY);
    }

    image(textureLayer, 0, 0);

    pop();
  }
}

function testRegion() {
  const x = random(width);
  const y = random(height);

  const region =
    floodFillRegion(
      boundaryDetectionLayer,
      x,
      y
    );

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
  resizeCanvas(
    getCanvasWidth(),
    windowHeight
  );

  renderArtwork();

  boundaryDetectionLayer =
    createGraphics(width, height);

  boundaryLayer =
    createGraphics(width, height);

  paintLayer =
    createGraphics(width, height);

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

function getPaletteKey(paletteObject) {
  return Object.keys(PALETTES).find(
    key => PALETTES[key] === paletteObject
  ) || null;
}

function setGenerationStatus(isGenerating) {
  UI_STATE.isGenerating = isGenerating;

  const statusEl =
    document.getElementById("generation-status");

  if (!statusEl) {
    return;
  }

  statusEl.textContent =
    isGenerating ? "Generating..." : "Ready";

  statusEl.classList.toggle(
    "generating",
    isGenerating
  );

  statusEl.classList.toggle(
    "idle",
    !isGenerating
  );
}


function requestGenerate() {
  if (UI_STATE.isGenerating) {
    return;
  }

  setGenerationStatus(true);

  // Give the browser time to paint "Generating..."
  setTimeout(() => {
    try {
      generateArtwork();
      lastGenerationTime = millis();
    } finally {
      setGenerationStatus(false);
    }
  }, 25);
}

function keyPressed() {
  if (key === "s" || key === "S") {
    const wasAuto =
      UI_STATE.autoRegenerate;

    UI_STATE.autoRegenerate = false;

    saveArtwork();

    UI_STATE.autoRegenerate = wasAuto;
    lastGenerationTime = millis();
  }

  if (key === "p" || key === "P") {
    const presetName =
      prompt("Preset name:");

    if (presetName) {
      savePresetToFile(
        presetName.trim()
      );
    }
  }
}