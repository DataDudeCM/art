let palette;

let boundaryDetectionLayer;
let boundaryLayer;
let paintLayer;
let drawingPreviewLayer;

let boundaryControlPoints = [];
let boundarySmoothedPoints = [];

let gridStructureData = [];

let brushManifest;
let brushImages = [];
let brushNames = [];

let lastGenerationTime = 0;

let currentPreset = null;
let generationSeed = 12345;

let generationRegionColors = new Map();
let generationBoundaryColor = null;

let activeViewport = null;

let artifactManifest = null;
let artifactEntries = [];
let artifactImages = new Map();

let generationRegionArtifacts = new Map();


let perfStats = {
  boundaryMs: 0,
  floodMs: 0,
  paintMs: 0,
  renderMs: 0,
  successfulRegions: 0,
  brushStampMs: 0,
  compositeMs: 0,
  edgeDetectMs: 0,
  bleedMs: 0,
  attempts: 0
};

const SHOW_PERF_STATS = true;

const GRID_SWEEP_PARAMETERS = {
  none: null,

  "boundary.scale": {
    path: ["boundary", "scale"],
    type: "float"
  },

  "boundary.pointCount": {
    path: ["boundary", "pointCount"],
    type: "int"
  },

  "fill.centerWeight": {
    path: ["fill", "centerWeight"],
    type: "int"
  },

  "paint.bleedPixels": {
    path: ["paint", "bleedPixels"],
    type: "float"
  },

  "boundary.thinBrushSize": {
    path: ["boundary", "thinBrushSize"],
    type: "float"
  }
};

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

  loadJSON(
    "../common/artifacts/text/scraps.json",

    data => {
      artifactManifest = data;
      artifactEntries = data.artifacts || [];

      for (const entry of artifactEntries) {
        artifactImages.set(
          entry.file,
          loadImage(
            `../common/artifacts/text/${entry.file}`
          )
        );
      }

      console.log(
        "Artifacts manifest loaded:",
        artifactEntries.length
      );
    },

    error => {
      console.error(
        "Could not load artifact manifest:",
        error
      );
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
    !!SETTINGS.grid?.enabled;

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

function getGridSweepParameterKeys() {
  return Object.keys(GRID_SWEEP_PARAMETERS);
}

function getGridAxisT(index, count) {
  if (count <= 1) {
    return 0;
  }

  return index / (count - 1);
}

function lerpSweepValue(start, end, t, type) {
  const value = lerp(
    Number(start),
    Number(end),
    t
  );

  if (type === "int") {
    return round(value);
  }

  return value;
}

function getNestedSetting(path) {
  let current = SETTINGS;

  for (const key of path) {
    current = current[key];
  }

  return current;
}

function setNestedSetting(path, value) {
  let current = SETTINGS;

  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]];
  }

  current[path[path.length - 1]] = value;
}

function buildCellParameterOverrides(
  row,
  col,
  rows,
  cols
) {
  if (!SETTINGS.gridVariation.enabled) {
    return [];
  }

  const overrides = [];

  const rowKey =
    SETTINGS.gridVariation.rowParameter;

  const colKey =
    SETTINGS.gridVariation.colParameter;

  if (
    rowKey !== "none" &&
    GRID_SWEEP_PARAMETERS[rowKey]
  ) {
    const def =
      GRID_SWEEP_PARAMETERS[rowKey];

    const rowT =
      getGridAxisT(row, rows);

    const value =
      lerpSweepValue(
        SETTINGS.gridVariation.rowStart,
        SETTINGS.gridVariation.rowEnd,
        rowT,
        def.type
      );

    overrides.push({
      path: def.path,
      value
    });
  }

  if (
    colKey !== "none" &&
    GRID_SWEEP_PARAMETERS[colKey]
  ) {
    const def =
      GRID_SWEEP_PARAMETERS[colKey];

    const colT =
      getGridAxisT(col, cols);

    const value =
      lerpSweepValue(
        SETTINGS.gridVariation.colStart,
        SETTINGS.gridVariation.colEnd,
        colT,
        def.type
      );

    overrides.push({
      path: def.path,
      value
    });
  }

  return overrides;
}

function applyCellParameterOverrides(
  overrides
) {
  if (!overrides || overrides.length === 0) {
    return () => {};
  }

  const previous = overrides.map(
    override => ({
      path: override.path,
      value: getNestedSetting(
        override.path
      )
    })
  );

  for (const override of overrides) {
    setNestedSetting(
      override.path,
      override.value
    );
  }

  return function restoreOverrides() {
    for (const prior of previous) {
      setNestedSetting(
        prior.path,
        prior.value
      );
    }
  };
}

function getCellSeed(
  baseSeed,
  row,
  col
) {
  return (
    baseSeed +
    row * 1009 +
    col * 9176
  ) % 1000000000;
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

  perfStats.boundaryMs = 0;
  perfStats.floodMs = 0;
  perfStats.paintMs = 0;
  perfStats.renderMs = 0;
  perfStats.attempts = 0;
  perfStats.successfulRegions = 0;
  perfStats.brushStampMs = 0;
  perfStats.compositeMs = 0;
  perfStats.edgeDetectMs = 0;
  perfStats.bleedMs = 0;

  randomSeed(generationSeed);
  noiseSeed(generationSeed);

  generationRegionColors = new Map();

  boundaryDetectionLayer.clear();
  boundaryLayer.clear();
  paintLayer.clear();

  gridStructureData = [];

  palette = resolveActivePalette();

  generationBoundaryColor =
    getDarkColor(palette);

  updateActivePaletteDisplay();

  SETTINGS.canvas.paperColor =
    getLightColor(palette);

  const grid =
    getActiveGridSettings();

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

      const cellOverrides =
        buildCellParameterOverrides(
          row,
          col,
          grid.rows,
          grid.cols
        );

      const restoreCellOverrides =
        applyCellParameterOverrides(
          cellOverrides
        );

      const cellSeed =
        getCellSeed(
          generationSeed,
          row,
          col
        );

      randomSeed(cellSeed);
      noiseSeed(cellSeed);

      const boundaryStart =
        performance.now();

      generateBoundary();

      perfStats.boundaryMs +=
        performance.now() - boundaryStart;

      gridStructureData.push({
        viewport: activeViewport,
        controlPoints: [
          ...boundaryControlPoints
        ],
        smoothedPoints: [
          ...boundarySmoothedPoints
        ]
      });

      boundaryDetectionLayer.loadPixels();

      for (
        let i = 0;
        i < SETTINGS.fill.attempts;
        i++
      ) {
        testRegion();
      }
    }
  }

  const renderStart =
    performance.now();

  renderArtwork();

  perfStats.renderMs =
    performance.now() - renderStart;

  const totalMs =
    performance.now() - totalStart;

  if (SHOW_PERF_STATS) {
    const measuredMs =
      perfStats.boundaryMs +
      perfStats.floodMs +
      perfStats.paintMs +
      perfStats.renderMs;

    const otherMs =
      totalMs - measuredMs;

    const avgFloodMs =
      perfStats.attempts > 0
        ? perfStats.floodMs /
          perfStats.attempts
        : 0;

    const avgPaintMs =
      perfStats.successfulRegions > 0
        ? perfStats.paintMs /
          perfStats.successfulRegions
        : 0;

    console.table({
      "Boundary": {
        ms: Math.round(
          perfStats.boundaryMs
        )
      },

      "Flood fill": {
        ms: Math.round(
          perfStats.floodMs
        )
      },

      "Paint / region event": {
        ms: Math.round(
          perfStats.paintMs
        )
      },

      "  Brush stamping": {
        ms: Math.round(perfStats.brushStampMs)
      },

      "  Region composite": {
        ms: Math.round(perfStats.compositeMs)
      },

      "  Edge detection": {
        ms: Math.round(perfStats.edgeDetectMs)
      },

      "  Bleed": {
        ms: Math.round(perfStats.bleedMs)
      },

      "Final render": {
        ms: Math.round(
          perfStats.renderMs
        )
      },

      "Other / overhead": {
        ms: Math.round(
          otherMs
        )
      },

      "TOTAL": {
        ms: Math.round(
          totalMs
        )
      }
    });

    console.log(
      `Attempts: ${perfStats.attempts}`
    );

    console.log(
      `Successful regions: ` +
      `${perfStats.successfulRegions}`
    );

    console.log(
      `Average flood attempt: ` +
      `${avgFloodMs.toFixed(2)} ms`
    );

    console.log(
      `Average paint/event: ` +
      `${avgPaintMs.toFixed(2)} ms`
    );

    console.log(
      `Canvas: ${width} x ${height}`
    );

    console.log(
      `Seed: ${generationSeed}`
    );
  }
}

function renderArtwork() {
  let backgroundColor =
    SETTINGS.canvas.paperColor || "#f2eee6";

  if (
    SETTINGS.canvas.backgroundMode === "white"
  ) {
    backgroundColor = "#ffffff";
  } else if (
    SETTINGS.canvas.backgroundMode === "black"
  ) {
    backgroundColor = "#000000";
  }

  background(backgroundColor);

  drawGridCellBackgrounds();

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

  if (
    SETTINGS.view.showStructureLines ||
    SETTINGS.view.showStructurePoints
  ) {
    drawStructureOverlay();
  }

  drawGridCellOutlines();
}

function drawGridCellOutlines() {
  const grid =
    getActiveGridSettings();

  if (
    !grid.enabled ||
    SETTINGS.grid.outlineMode === "none"
  ) {
    return;
  }

  const outlineColor =
    SETTINGS.grid.outlineMode === "white"
      ? "#ffffff"
      : "#000000";

  push();

  noFill();
  stroke(outlineColor);
  strokeWeight(
    SETTINGS.grid.outlineWeight
  );

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
      const viewport =
        getGridViewport(
          row,
          col,
          grid.rows,
          grid.cols,
          grid.gutter,
          grid.outerMargin
        );

      rect(
        viewport.x,
        viewport.y,
        viewport.width,
        viewport.height
      );
    }
  }

  pop();
}

function drawGridCellBackgrounds() {
  const grid =
    getActiveGridSettings();

  if (!grid.enabled) {
    return;
  }

  const cellColor =
    SETTINGS.canvas.paperColor ||
    "#f2eee6";

  push();

  noStroke();
  fill(cellColor);

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
      const viewport =
        getGridViewport(
          row,
          col,
          grid.rows,
          grid.cols,
          grid.gutter,
          grid.outerMargin
        );

      rect(
        viewport.x,
        viewport.y,
        viewport.width,
        viewport.height
      );
    }
  }

  pop();
}

function drawStructureOverlay() {
  if (
    gridStructureData.length === 0
  ) {
    return;
  }

  for (
    const cellData of gridStructureData
  ) {
    const {
      viewport,
      controlPoints
    } = cellData;

    drawingContext.save();

    drawingContext.beginPath();
    drawingContext.rect(
      viewport.x,
      viewport.y,
      viewport.width,
      viewport.height
    );
    drawingContext.clip();

    if (
      SETTINGS.view.showStructureLines &&
      controlPoints.length
    ) {
      noFill();
      stroke(20, 75);
      strokeWeight(1);

      beginShape();

      for (
        const p of controlPoints
      ) {
        vertex(
          p.x,
          p.y
        );
      }

      endShape(CLOSE);
    }

    if (
      SETTINGS.view.showStructurePoints &&
      controlPoints.length
    ) {
      stroke(0,180);
      strokeWeight(1);
      fill(255, 180);

      for (
        const p of controlPoints
      ) {
        circle(
          p.x,
          p.y,
          5
        );
      }
    }

    drawingContext.restore();

    // Explicitly reset p5 style state
    // before processing the next cell.
    stroke(0);
    strokeWeight(1);
    noFill();
  }
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
  perfStats.attempts++;

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

  resolveRegionEvent(
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

      if (SETTINGS.animation.enabled) {
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