let palette;

let boundaryDetectionLayer;
let boundaryLayer;
let paintLayer;
let drawingPreviewLayer;

let boundaryControlPoints = [];
let boundarySmoothedPoints = [];

let brushManifest;
let brushImages = [];
let brushNames = [];

let lastGenerationTime = 0;

let currentPreset = null;
let generationSeed = 12345;

let generationRegionColors = new Map();
let generationBoundaryColor = null;

let activeViewport = null;

let perfStats = {
  floodMs: 0,
  paintMs: 0,
  successfulRegions: 0
};

const SHOW_PERF_STATS = false;

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

  drawingPreviewLayer =
    createGraphics(width, height);

  // Set up drawing input only once,
  // after all layers exist.
  setupBoundaryInput(canvas.elt);

  setupUI();

  console.log(
    "Brushes loaded:",
    brushImages.length
  );
}

function draw() {
  if (
    SETTINGS.animation.enabled &&
    animationState
  ) {
    updateAnimation();

    renderArtwork();

    renderAnimationOverlay();

    return;
  }

  if (!UI_STATE.autoRegenerate) {
    return;
  }

  const interval =
    SETTINGS.canvas.regenerateSeconds * 1000;

  if (
    !UI_STATE.isGenerating &&
    millis() - lastGenerationTime >= interval
  ) {
      generationSeed =
        Math.floor(Math.random() * 1000000000);

      syncSeedDisplay();

      requestGenerate();
    }
}

function syncSeedDisplay() {
  const input =
    document.getElementById("generation-seed");

  if (input) {
    input.value = generationSeed;
  }
}

function getCanvasWidth() {
  return document
    .getElementById("canvas-container")
    .clientWidth;
}

function getFullCanvasViewport() {
  return {
    x: 0,
    y: 0,
    width: width,
    height: height
  };
}

function getGridViewport(
  row,
  col,
  rows,
  cols,
  gap = 0,
  margin = 0
) {
  const innerWidth =
    width - margin * 2 - gap * (cols - 1);

  const innerHeight =
    height - margin * 2 - gap * (rows - 1);

  const cellWidth =
    innerWidth / cols;

  const cellHeight =
    innerHeight / rows;

  return {
    x: margin + col * (cellWidth + gap),
    y: margin + row * (cellHeight + gap),
    width: cellWidth,
    height: cellHeight
  };
}

function getActiveGridSettings() {
  const rows =
    constrain(
      int(SETTINGS.grid?.rows || 1),
      1,
      8
    );

  const cols =
    constrain(
      int(SETTINGS.grid?.cols || 1),
      1,
      8
    );

  const gutter =
    max(
      0,
      Number(SETTINGS.grid?.gutter || 0)
    );

  const outerMargin =
    max(
      0,
      Number(SETTINGS.grid?.outerMargin || 0)
    );

  const enabled =
    !!SETTINGS.grid?.enabled &&
    (rows > 1 || cols > 1);

  if (!enabled) {
    return {
      enabled: false,
      rows: 1,
      cols: 1,
      gutter: 0,
      outerMargin: 0
    };
  }

  return {
    enabled: true,
    rows,
    cols,
    gutter,
    outerMargin
  };
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
  const totalStart = performance.now();

  perfStats.floodMs = 0;
  perfStats.paintMs = 0;
  perfStats.successfulRegions = 0;

  randomSeed(generationSeed);
  noiseSeed(generationSeed);

  generationRegionColors = new Map();

  boundaryDetectionLayer.clear();
  boundaryLayer.clear();
  paintLayer.clear();

  palette = resolveActivePalette();

  generationBoundaryColor =
    getDarkColor(palette);

  updateActivePaletteDisplay();

  SETTINGS.canvas.paperColor =
    getLightColor(palette);

  const grid =
    getActiveGridSettings();

  const totalCells =
    grid.rows * grid.cols;

  const attemptsPerCell =
    max(
      1,
      floor(
        SETTINGS.fill.attempts /
        totalCells
      )
    );

  const boundaryStart =
    performance.now();

  for (
    let row = 0;
    row < grid.rows;
    row++
  ) {
    for (
      let col = 0;
      col < grid.cols;
      col++
    ) {
      activeViewport =
        getGridViewport(
          row,
          col,
          grid.rows,
          grid.cols,
          grid.gutter,
          grid.outerMargin
        );

      generateBoundary();

      boundaryDetectionLayer.loadPixels();

      for (
        let i = 0;
        i < attemptsPerCell;
        i++
      ) {
        testRegion();
      }
    }
  }

  const boundaryMs =
    performance.now() - boundaryStart;

  const regionsStart = boundaryStart;

  const regionsMs =
    performance.now() - regionsStart;

  const renderStart = performance.now();

  renderArtwork();

  const renderMs =
    performance.now() - renderStart;

  const totalMs =
    performance.now() - totalStart;

  if (SHOW_PERF_STATS) {
    console.table({
      "Boundary": {
        ms: Math.round(boundaryMs)
      },
      "Flood fill": {
        ms: Math.round(perfStats.floodMs)
      },
      "Painting": {
        ms: Math.round(perfStats.paintMs)
      },
      "Region loop total": {
        ms: Math.round(regionsMs)
      },
      "Final render": {
        ms: Math.round(renderMs)
      },
      "TOTAL": {
        ms: Math.round(totalMs)
      }
    });

    console.log(
      `Successful regions: ${perfStats.successfulRegions} / ${SETTINGS.fill.attempts}`
    );
  }
}

function renderArtwork() {
  const paperColor =
    SETTINGS.canvas.paperColor || "#f2eee6";

  background(paperColor);

  if (SETTINGS.view.showPaint) {
    image(paintLayer, 0, 0);
  }

  if (SETTINGS.boundary.visible) {
    image(boundaryLayer, 0, 0);
  }

  if (
    SETTINGS.view.showStructureLines ||
    SETTINGS.view.showStructurePoints
  ) {
    drawStructureOverlay();
  }

  if (
    uploadedTextureImage &&
    SETTINGS.view.showPaint
  ) {
    drawTextureOverlay();
  }

  if (
    SETTINGS.boundary.source === "drawn" &&
    showDrawingPreview &&
    drawingPreviewLayer
  ) {
    image(
      drawingPreviewLayer,
      0,
      0
    );
  }
}

function drawStructureOverlay() {
  if (!boundaryControlPoints.length) {
    return;
  }

  push();

  if (SETTINGS.view.showStructureLines) {
    noFill();
    stroke(20, 75);
    strokeWeight(1);

    beginShape();

    for (const p of boundaryControlPoints) {
      vertex(p.x, p.y);
    }

    endShape(CLOSE);
  }

  if (SETTINGS.view.showStructurePoints) {
    noStroke();
    fill(20, 110);

    for (const p of boundaryControlPoints) {
      circle(p.x, p.y, 4);
    }
  }

  pop();
}

function drawTextureOverlay() {
  if (!uploadedTextureImage) {
    return;
  }

  push();

  if (SETTINGS.texture.blendMode === "multiply") {
    blendMode(MULTIPLY);
  } else if (
    SETTINGS.texture.blendMode === "overlay"
  ) {
    blendMode(OVERLAY);
  } else if (
    SETTINGS.texture.blendMode === "screen"
  ) {
    blendMode(SCREEN);
  } else {
    blendMode(BLEND);
  }

  tint(
    255,
    SETTINGS.texture.opacity
  );

  const img =
    uploadedTextureImage;

  // Cover canvas without distorting texture.
  const canvasRatio =
    width / height;

  const imageRatio =
    img.width / img.height;

  let drawW;
  let drawH;

  if (imageRatio > canvasRatio) {
    drawH = height;
    drawW =
      height * imageRatio;
  } else {
    drawW = width;
    drawH =
      width / imageRatio;
  }

  drawW *= SETTINGS.texture.scale;
  drawH *= SETTINGS.texture.scale;

  imageMode(CENTER);

  image(
    img,
    width / 2,
    height / 2,
    drawW,
    drawH
  );

  noTint();
  imageMode(CORNER);

  pop();
}

function testRegion() {
  const samplePoint =
    getFillSamplePoint(
      activeViewport
    );

  const x = samplePoint.x;
  const y = samplePoint.y;

  const floodStart =
    performance.now();

  const region =
    floodFillRegion(
      boundaryDetectionLayer,
      x,
      y,
      activeViewport
    );

  perfStats.floodMs +=
    performance.now() - floodStart;

  if (!region) {
    return;
  }

  perfStats.successfulRegions++;

  const regionColor =
    getRegionPaintColor(
      region,
      palette
    );

  const paintStart =
    performance.now();

  paintRegion(
    region,
    paintLayer,
    regionColor
  );

  perfStats.paintMs +=
    performance.now() - paintStart;
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

  drawingPreviewLayer =
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
    `regionPainter-seed${generationSeed}-${timestamp}`,
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

  setTimeout(() => {
    try {
      randomSeed(generationSeed);
      noiseSeed(generationSeed);

      palette = resolveActivePalette();

      generationBoundaryColor =
        getDarkColor(palette);
      updateActivePaletteDisplay();

      SETTINGS.canvas.paperColor =
        getLightColor(palette);

      const grid =
        getActiveGridSettings();

      activeViewport =
        getGridViewport(
          0,
          0,
          grid.rows,
          grid.cols,
          grid.gutter,
          grid.outerMargin
        );

      const canAnimate =
        SETTINGS.animation.enabled &&
        grid.rows === 1 &&
        grid.cols === 1;

      if (canAnimate) {
        startGenerationAnimation();
      } else {
        generateArtwork();
        setGenerationStatus(false);
      }

      lastGenerationTime = millis();

    } catch (error) {
      setGenerationStatus(false);
      throw error;
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

function updateActivePaletteDisplay() {
  const paletteDisplay =
    document.getElementById("active-palette");

  if (paletteDisplay) {
    paletteDisplay.textContent =
      `Current: ${palette?.name || "Unknown"}`;
  }
}