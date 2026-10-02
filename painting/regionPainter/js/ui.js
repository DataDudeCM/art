function setupUI() {
  setupPresetControl();
  setupPaletteControl();
  setupBoundaryControls();
  setupPresetFileControls();
  setupTextureControls();
  setupCollapsibleSections();
  setupFillControls();
  setupSeedControls();
  setupViewControls();
  setupAnimationControls();
  setupGridControls();
  setupGridVariationControls();
  setupCanvasControls();

  document
    .getElementById("generate-button")
    .addEventListener("click", () => {
      requestGenerate();
    });

  const autoCheckbox =
    document.getElementById("auto-regenerate");

  autoCheckbox.checked =
    UI_STATE.autoRegenerate;

  autoCheckbox.addEventListener("change", event => {
    UI_STATE.autoRegenerate =
      event.target.checked;

    lastGenerationTime = millis();
  });
}

function setupGridControls() {
  const enabled =
    document.getElementById(
      "grid-enabled"
    );

  enabled.checked =
    SETTINGS.grid.enabled;

  enabled.addEventListener(
    "change",
    event => {
      SETTINGS.grid.enabled =
        event.target.checked;
    }
  );

  setupRangeControl(
    "grid-rows",
    "grid-rows-value",
    () => SETTINGS.grid.rows,
    value => {
      SETTINGS.grid.rows =
        constrain(
          int(value),
          1,
          8
        );
    }
  );

  setupRangeControl(
    "grid-cols",
    "grid-cols-value",
    () => SETTINGS.grid.cols,
    value => {
      SETTINGS.grid.cols =
        constrain(
          int(value),
          1,
          8
        );
    }
  );

  setupRangeControl(
    "grid-gutter",
    "grid-gutter-value",
    () => SETTINGS.grid.gutter,
    value => {
      SETTINGS.grid.gutter =
        max(
          0,
          Number(value)
        );
    }
  );

  setupRangeControl(
    "grid-outer-margin",
    "grid-outer-margin-value",
    () => SETTINGS.grid.outerMargin,
    value => {
      SETTINGS.grid.outerMargin =
        max(
          0,
          Number(value)
        );
    }
  );

  const backgroundMode =
    document.getElementById(
      "canvas-background-mode"
    );

  backgroundMode.value =
    SETTINGS.canvas.backgroundMode;

  backgroundMode.addEventListener(
    "change",
    event => {
      SETTINGS.canvas.backgroundMode =
        event.target.value;

      renderArtwork();
    }
  );

  const outlineMode =
    document.getElementById(
      "grid-outline-mode"
    );

  outlineMode.value =
    SETTINGS.grid.outlineMode;

  outlineMode.addEventListener(
    "change",
    event => {
      SETTINGS.grid.outlineMode =
        event.target.value;

      renderArtwork();
    }
  );
}

function setupGridVariationControls() {
  const enabled =
    document.getElementById(
      "grid-variation-enabled"
    );

  enabled.checked =
    SETTINGS.gridVariation.enabled;

  enabled.addEventListener(
    "change",
    event => {
      SETTINGS.gridVariation.enabled =
        event.target.checked;
    }
  );

  const rowSelect =
    document.getElementById(
      "grid-row-parameter"
    );

  const colSelect =
    document.getElementById(
      "grid-col-parameter"
    );

  for (const key of getGridSweepParameterKeys()) {
    const rowOption =
      document.createElement("option");
    rowOption.value = key;
    rowOption.textContent = key;
    rowSelect.appendChild(rowOption);

    const colOption =
      document.createElement("option");
    colOption.value = key;
    colOption.textContent = key;
    colSelect.appendChild(colOption);
  }

  rowSelect.value =
    SETTINGS.gridVariation.rowParameter;

  colSelect.value =
    SETTINGS.gridVariation.colParameter;

  rowSelect.addEventListener(
    "change",
    event => {
      SETTINGS.gridVariation.rowParameter =
        event.target.value;
    }
  );

  colSelect.addEventListener(
    "change",
    event => {
      SETTINGS.gridVariation.colParameter =
        event.target.value;
    }
  );

  setupVariationRangeControl(
    "grid-row-start",
    "grid-row-start-value",
    () => SETTINGS.gridVariation.rowStart,
    value => {
      SETTINGS.gridVariation.rowStart =
        Number(value);
    }
  );

  setupVariationRangeControl(
    "grid-row-end",
    "grid-row-end-value",
    () => SETTINGS.gridVariation.rowEnd,
    value => {
      SETTINGS.gridVariation.rowEnd =
        Number(value);
    }
  );

  setupVariationRangeControl(
    "grid-col-start",
    "grid-col-start-value",
    () => SETTINGS.gridVariation.colStart,
    value => {
      SETTINGS.gridVariation.colStart =
        Number(value);
    }
  );

  setupVariationRangeControl(
    "grid-col-end",
    "grid-col-end-value",
    () => SETTINGS.gridVariation.colEnd,
    value => {
      SETTINGS.gridVariation.colEnd =
        Number(value);
    }
  );
}

function setupVariationRangeControl(
  inputId,
  valueId,
  getter,
  setter
) {
  const input =
    document.getElementById(inputId);

  const valueEl =
    document.getElementById(valueId);

  function sync() {
    input.value = getter();
    valueEl.textContent = getter();
  }

  sync();

  input.addEventListener(
    "input",
    event => {
      setter(event.target.value);
      sync();
    }
  );
}

function setupPresetControl() {
  const select =
    document.getElementById("preset-select");

  select.innerHTML = "";

  const defaultOption =
    document.createElement("option");

  defaultOption.value = "";
  defaultOption.textContent = "Default Settings";

  select.appendChild(defaultOption);

  for (const [name] of Object.entries(loadedPresets)) {
    const option =
      document.createElement("option");

    option.value = name;
    option.textContent = name;

    select.appendChild(option);
  }

  select.addEventListener("change", event => {
    const name = event.target.value;

    if (!name) {
      currentPreset = null;
      resetSettingsToDefaults();
      syncAllControls();
      return;
    }

    const preset = loadedPresets[name];

    if (preset) {
      applyPreset(preset);
      syncAllControls();
    }
  });
}

function setupPresetFileControls() {
  const saveButton =
    document.getElementById("save-preset-button");

  const loadButton =
    document.getElementById("load-preset-button");

  const fileInput =
    document.getElementById("preset-file-input");

  saveButton.addEventListener("click", () => {
    const name = prompt("Preset name:");

    if (name?.trim()) {
      savePresetToFile(name.trim());
    }
  });

  loadButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", event => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    loadPresetFromFile(file);

    // Allow the same file to be loaded again later.
    event.target.value = "";
  });
}

function setupTextureControls() {
  const chooseButton =
    document.getElementById(
      "texture-file-button"
    );

  const fileInput =
    document.getElementById(
      "texture-file-input"
    );

  const blendMode =
    document.getElementById(
      "texture-blend-mode"
    );

  const textureScope =
    document.getElementById(
      "texture-scope"
    );

  chooseButton.addEventListener(
    "click",
    () => {
      fileInput.click();
    }
  );

  fileInput.addEventListener(
    "change",
    event => {
      const file =
        event.target.files?.[0];

      if (file) {
        loadTextureFile(file);
      }

      // Allows choosing the same file again.
      event.target.value = "";
    }
  );

  blendMode.value =
    SETTINGS.texture.blendMode;
  
    blendMode.addEventListener(
    "change",
    event => {
      SETTINGS.texture.blendMode =
        event.target.value;

      renderArtwork();
    }
  );

  textureScope.value =
    SETTINGS.texture.scope;

  textureScope.addEventListener(
    "change",
    event => {
      SETTINGS.texture.scope =
        event.target.value;

      renderArtwork();
    }
  );

  setupRangeControl(
    "texture-opacity",
    "texture-opacity-value",
    () => SETTINGS.texture.opacity,
    value => {
      SETTINGS.texture.opacity =
        Number(value);

      renderArtwork();
    }
  );

  setupRangeControl(
    "texture-scale",
    "texture-scale-value",
    () => SETTINGS.texture.scale,
    value => {
      SETTINGS.texture.scale =
        Number(value);

      renderArtwork();
    }
  );

  updateTextureFileDisplay();
}

function setupPaletteControl() {
  const select =
    document.getElementById("palette-select");

  select.innerHTML = "";

  addPaletteOption(
    select,
    "inherit",
    "Use Preset / Default"
  );

  addPaletteOption(
    select,
    "random",
    "Random"
  );

  for (const [key, paletteInfo] of Object.entries(PALETTES)) {
    addPaletteOption(
      select,
      key,
      paletteInfo.name
    );
  }

  select.value = "inherit";

  select.addEventListener("change", event => {
    const value = event.target.value;

    if (value === "inherit") {
      UI_STATE.paletteMode = "inherit";
      UI_STATE.fixedPaletteKey = null;
    } else if (value === "random") {
      UI_STATE.paletteMode = "random";
      UI_STATE.fixedPaletteKey = null;
    } else {
      UI_STATE.paletteMode = "fixed";
      UI_STATE.fixedPaletteKey = value;
    }
  });
}

function setupCanvasControls() {
  const widthInput =
    document.getElementById(
      "canvas-width"
    );

  const heightInput =
    document.getElementById(
      "canvas-height"
    );

  const applyButton =
    document.getElementById(
      "canvas-apply-button"
    );

  const windowButton =
    document.getElementById(
      "canvas-window-button"
    );

  const zoomOut =
    document.getElementById(
      "zoom-out-button"
    );

  const zoomIn =
    document.getElementById(
      "zoom-in-button"
    );

  const zoomFit =
    document.getElementById(
      "zoom-fit-button"
    );

  const zoom100 =
    document.getElementById(
      "zoom-100-button"
    );

  const sizeNote =
    document.getElementById(
      "canvas-size-note"
    );

  function syncSize() {
    widthInput.value =
      SETTINGS.canvas.width;

    heightInput.value =
      SETTINGS.canvas.height;

    sizeNote.textContent =
      `${width} × ${height} actual pixels`;
  }

  applyButton.addEventListener(
    "click",
    () => {
      applyCanvasSize(
        Number(widthInput.value),
        Number(heightInput.value)
      );

      syncSize();
    }
  );

  windowButton.addEventListener(
    "click",
    () => {
      const size =
        getDefaultCanvasSize();

      widthInput.value =
        size.width;

      heightInput.value =
        size.height;

      applyCanvasSize(
        size.width,
        size.height
      );

      setCanvasZoom(1);

      syncSize();
    }
  );

  zoomOut.addEventListener(
    "click",
    () => {
      setCanvasZoom(
        SETTINGS.view.zoom / 1.25
      );
    }
  );

  zoomIn.addEventListener(
    "click",
    () => {
      setCanvasZoom(
        SETTINGS.view.zoom * 1.25
      );
    }
  );

  zoomFit.addEventListener(
    "click",
    () => {
      fitCanvasToWindow();
    }
  );

  zoom100.addEventListener(
    "click",
    () => {
      setCanvasZoom(1);
    }
  );

  syncSize();
  updateZoomDisplay();
}

function setupBoundaryControls() {
  setupBoundarySource();
  setupBoundaryBrushMode();
  setupBoundaryBrushSelect();
  setupBoundaryVisibility();
  setupDrawnBoundaryControls();
  setupParticleFeedMode();
  setupParticleSamplingMode();
  setupParticleMotionMode();
  setupPrimitiveBoundaryControls();

  setupRangeControl(
    "boundary-brush-size",
    "boundary-brush-size-value",
    () => SETTINGS.boundary.thinBrushSize,
    value => {
      SETTINGS.boundary.thinBrushSize =
        Number(value);
    }
  );

  setupRangeControl(
    "boundary-multiplier",
    "boundary-multiplier-value",
    () => SETTINGS.boundary.midSizeMultiplier,
    value => {
      SETTINGS.boundary.midSizeMultiplier =
        Number(value);
    }
  );

  setupRangeControl(
    "boundary-alpha",
    "boundary-alpha-value",
    () => SETTINGS.boundary.brushAlpha,
    value => {
      SETTINGS.boundary.brushAlpha =
        Number(value);
    }
  );

  setupRangeControl(
    "boundary-scale",
    "boundary-scale-value",
    () => SETTINGS.boundary.scale,
    value => {
      SETTINGS.boundary.scale =
        Number(value);
    }
  );

  setupRangeControl(
    "boundary-point-count",
    "boundary-point-count-value",
    () => SETTINGS.boundary.pointCount,
    value => {
      SETTINGS.boundary.pointCount =
        Number(value);
    }
  );

  setupRangeControl(
    "boundary-subdivisions",
    "boundary-subdivisions-value",
    () => SETTINGS.boundary.subdivisions,
    value => {
      SETTINGS.boundary.subdivisions =
        Number(value);
    }
  );

  setupRangeControl(
    "boundary-peak-position",
    "boundary-peak-position-value",
    () => SETTINGS.boundary.peakPosition,
    value => {
      SETTINGS.boundary.peakPosition =
        Number(value);
    }
  );
  setupRangeControl(
    "boundary-size-jitter",
    "boundary-size-jitter-value",
    () =>
      Math.round(
        SETTINGS.boundary.sizeJitter * 200
      ),
    value => {
      SETTINGS.boundary.sizeJitter =
        Number(value) / 200;
    }
  );
  setupRangeControl(
    "particle-count",
    "particle-count-value",
    () => SETTINGS.particle.count,
    value => {
      SETTINGS.particle.count =
        Number(value);
    }
  );
  setupRangeControl(
    "particle-heading-threshold",
    "particle-heading-threshold-value",
    () =>
      degrees(
        SETTINGS.particle.headingChangeThreshold
      ),
    value => {
      SETTINGS.particle.headingChangeThreshold =
        radians(Number(value));
    }
  );
  setupRangeControl(
    "particle-attractor-strength",
    "particle-attractor-strength-value",
    () =>
      SETTINGS.particle.attractorStrength,
    value => {
      SETTINGS.particle.attractorStrength =
        Number(value);
    }
  );
  setupRangeControl(
    "particle-max-speed",
    "particle-max-speed-value",
    () => SETTINGS.particle.maxSpeed,
    value => {
      SETTINGS.particle.maxSpeed =
        Number(value);
    }
  );
}

function setupPrimitiveBoundaryControls() {
  const enabled =
    document.getElementById(
      "boundary-primitives-enabled"
    );

  enabled.checked =
    SETTINGS.boundary.primitivesEnabled;

  enabled.addEventListener(
    "change",
    event => {
      SETTINGS.boundary.primitivesEnabled =
        event.target.checked;

      updatePrimitiveBoundaryControls();
    }
  );

  setupRangeControl(
    "boundary-primitive-chance",
    "boundary-primitive-chance-value",

    () =>
      Math.round(
        SETTINGS.boundary.primitiveChance *
        100
      ),

    value => {
      SETTINGS.boundary.primitiveChance =
        Number(value) / 100;
    }
  );

  updatePrimitiveBoundaryControls();
}


function updatePrimitiveBoundaryControls() {
  const control =
    document.getElementById(
      "boundary-primitive-chance-control"
    );

  if (!control) {
    return;
  }

  control.style.display =
    SETTINGS.boundary.primitivesEnabled
      ? ""
      : "none";
}

function setupParticleMotionMode() {
  const select =
    document.getElementById(
      "particle-motion-mode"
    );

  select.value =
    SETTINGS.particle.motionMode;

  select.addEventListener(
    "change",
    event => {
      SETTINGS.particle.motionMode =
        event.target.value;

      updateParticleBoundaryControls();
    }
  );
}

function setupParticleFeedMode() {
  const select =
    document.getElementById(
      "particle-feed-mode"
    );

  select.value =
    SETTINGS.particle.feedMode;

  select.addEventListener(
    "change",
    event => {
      SETTINGS.particle.feedMode =
        event.target.value;
    }
  );
}

function setupParticleSamplingMode() {
  const select =
    document.getElementById(
      "particle-sampling-mode"
    );

  select.value =
    SETTINGS.particle.samplingMode;

  select.addEventListener(
    "change",
    event => {
      SETTINGS.particle.samplingMode =
        event.target.value;

      updateParticleBoundaryControls();
    }
  );
}

function updateParticleBoundaryControls() {
  const isParticle =
    SETTINGS.boundary.source ===
    "particleChaikin";

  const countControl =
    document.getElementById(
      "particle-count-control"
    );

  const feedModeControl =
    document.getElementById(
      "particle-feed-mode-control"
    );

  const samplingModeControl =
    document.getElementById(
      "particle-sampling-mode-control"
    );

  const headingThresholdControl =
    document.getElementById(
      "particle-heading-threshold-control"
    );

  const motionModeControl =
    document.getElementById(
      "particle-motion-mode-control"
    );

  const attractorStrengthControl =
    document.getElementById(
      "particle-attractor-strength-control"
    );

  if (countControl) {
    countControl.style.display =
      isParticle ? "" : "none";
  }

  if (feedModeControl) {
    feedModeControl.style.display =
      isParticle ? "" : "none";
  }

  if (samplingModeControl) {
    samplingModeControl.style.display =
      isParticle ? "" : "none";
  }

  if (motionModeControl) {
    motionModeControl.style.display =
      isParticle ? "" : "none";
  }

  if (headingThresholdControl) {
    headingThresholdControl.style.display =
      isParticle &&
      SETTINGS.particle.samplingMode ===
        "headingChange"
        ? ""
        : "none";
  }

  if (attractorStrengthControl) {
    attractorStrengthControl.style.display =
      isParticle &&
      SETTINGS.particle.motionMode ===
        "attractor"
        ? ""
        : "none";
  }
}

function setupDrawnBoundaryControls() {
  const clearButton =
    document.getElementById(
      "clear-drawing-button"
    );

  const completeButton =
    document.getElementById(
      "complete-drawing-button"
    );

  const status =
    document.getElementById(
      "drawing-status"
    );

  clearButton.addEventListener(
    "click",
    () => {
      drawnBoundaryStrokes = [];
      showDrawingPreview = true;

      if (drawingPreviewLayer) {
        drawingPreviewLayer.clear();
      }

      boundaryDetectionLayer.clear();
      boundaryLayer.clear();
      paintLayer.clear();

      status.textContent =
        "Draw on the canvas";

      renderArtwork();
    }
  );

  completeButton.addEventListener(
    "click",
    () => {
      if (drawnBoundaryStrokes.length === 0) {
        status.textContent =
          "Nothing drawn yet";

        return;
      }

      status.textContent =
        `${drawnBoundaryStrokes.length} stroke(s) captured`;

      showDrawingPreview = false;

      if (drawingPreviewLayer) {
        drawingPreviewLayer.clear();
      }

      requestGenerate();
    }
  );
}

function updateDrawnBoundaryControls() {
  const controls =
    document.getElementById(
      "drawn-boundary-controls"
    );

  if (!controls) {
    return;
  }

  controls.style.display =
    SETTINGS.boundary.source === "drawn"
      ? ""
      : "none";
}

function setupBoundarySource() {
  const select =
    document.getElementById(
      "boundary-source"
    );

  select.value =
    SETTINGS.boundary.source;

  updateDrawnBoundaryControls();
  updateParticleBoundaryControls();
  updateBoundaryTouchAction();
  
  select.addEventListener(
    "change",
    event => {
      SETTINGS.boundary.source =
        event.target.value;

      updateDrawnBoundaryControls();
      updateParticleBoundaryControls();
      updateBoundaryTouchAction();

      if (SETTINGS.boundary.source === "drawn") {
        enterDrawnBoundaryMode();
      }
    }
  );
}



function setupFillControls() {
  setupFillBrushSelect();
  setupFillSamplingControls();
  setupFillColorMode();

  setupRangeControl(
    "fill-strength",
    "fill-strength-value",
    () => SETTINGS.paint.fillStrength,
    value => {
      SETTINGS.paint.fillStrength =
        Number(value);

      updateFillAlphaFromControls();
    }
  );

  setupRangeControl(
    "fill-opacity-variation",
    "fill-opacity-variation-value",
    () => SETTINGS.paint.opacityVariation,
    value => {
      SETTINGS.paint.opacityVariation =
        Number(value);

      updateFillAlphaFromControls();
    }
  );

  setupRangeControl(
    "fill-marks-per-region",
    "fill-marks-per-region-value",
    () => SETTINGS.paint.marksPerRegion,
    value => {
      SETTINGS.paint.marksPerRegion =
        Number(value);
    }
  );

  setupRangeControl(
    "fill-brush-size-min",
    "fill-brush-size-min-value",
    () => SETTINGS.paint.brushSizeMin,
    value => {
      SETTINGS.paint.brushSizeMin =
        Number(value);

      enforceFillBrushSizeOrder("min");
      syncRangeControl(
        "fill-brush-size-max",
        "fill-brush-size-max-value",
        SETTINGS.paint.brushSizeMax
      );
    }
  );

  setupRangeControl(
    "fill-brush-size-max",
    "fill-brush-size-max-value",
    () => SETTINGS.paint.brushSizeMax,
    value => {
      SETTINGS.paint.brushSizeMax =
        Number(value);

      enforceFillBrushSizeOrder("max");
      syncRangeControl(
        "fill-brush-size-min",
        "fill-brush-size-min-value",
        SETTINGS.paint.brushSizeMin
      );
    }
  );

  setupRangeControl(
    "fill-attempts",
    "fill-attempts-value",
    () => SETTINGS.fill.attempts,
    value => {
      SETTINGS.fill.attempts =
        Number(value);
    }
  );

  setupRangeControl(
    "fill-bleed-amount",
    "fill-bleed-amount-value",
    () => SETTINGS.paint.bleedPixels,
    value => {
      SETTINGS.paint.bleedPixels =
        Number(value);
    }
  );

  setupRangeControl(
    "fill-bleed-strength",
    "fill-bleed-strength-value",
    () => SETTINGS.paint.bleedStrength,
    value => {
      SETTINGS.paint.bleedStrength =
        Number(value);

      updateBleedAlphaFromControls();
    }
  );

  setupRangeControl(
    "fill-edge-expansion",
    "fill-edge-expansion-value",
    () => SETTINGS.paint.maskExpansionPixels,
    value => {
      SETTINGS.paint.maskExpansionPixels =
        Number(value);
    }
  );

  updateFillAlphaFromControls();
  updateBleedAlphaFromControls();
}

function setupFillColorMode() {
  const select =
    document.getElementById("fill-color-mode");

  if (!select) {
    return;
  }

  select.value =
    SETTINGS.fill.colorMode;

  select.addEventListener("change", event => {
    SETTINGS.fill.colorMode =
      event.target.value;
  });
}

function setupFillSamplingControls() {
  const modeSelect =
    document.getElementById("fill-sample-mode");

  const weightControl =
    document.getElementById("fill-center-weight-control");

  if (!modeSelect || !weightControl) {
    return;
  }

  modeSelect.value =
    SETTINGS.fill.sampleMode;

  modeSelect.addEventListener("change", event => {
    SETTINGS.fill.sampleMode =
      event.target.value;

    updateFillSamplingControls();
  });

  setupRangeControl(
    "fill-center-weight",
    "fill-center-weight-value",
    () => SETTINGS.fill.centerWeight,
    value => {
      SETTINGS.fill.centerWeight =
        Number(value);
    }
  );

  updateFillSamplingControls();
}

function updateFillSamplingControls() {
  const weightControl =
    document.getElementById("fill-center-weight-control");

  if (!weightControl) {
    return;
  }

  weightControl.style.display =
    SETTINGS.fill.sampleMode === "centerWeighted"
      ? ""
      : "none";
}

function setupViewControls() {
  const showPaint =
    document.getElementById("view-show-paint");

  const showLines =
    document.getElementById("view-show-structure-lines");

  const showPoints =
    document.getElementById("view-show-structure-points");

  showPaint.checked =
    SETTINGS.view.showPaint;

  showLines.checked =
    SETTINGS.view.showStructureLines;

  showPoints.checked =
    SETTINGS.view.showStructurePoints;

  showPaint.addEventListener("change", event => {
    SETTINGS.view.showPaint =
      event.target.checked;

    renderArtwork();
  });

  showLines.addEventListener("change", event => {
    SETTINGS.view.showStructureLines =
      event.target.checked;

    renderArtwork();
  });

  showPoints.addEventListener("change", event => {
    SETTINGS.view.showStructurePoints =
      event.target.checked;

    renderArtwork();
  });
}

function setupFillBrushSelect() {
  const select =
    document.getElementById("fill-brush-select");

  select.innerHTML = "";

  const randomOption =
    document.createElement("option");

  randomOption.value = "";
  randomOption.textContent = "Random";

  select.appendChild(randomOption);

  const proceduralOption =
    document.createElement("option");

  proceduralOption.value = "__procedural__";
  proceduralOption.textContent = "Procedural";

  select.appendChild(proceduralOption);

  for (const brushName of brushNames) {
    const option =
      document.createElement("option");

    option.value = brushName;
    option.textContent =
      brushName.replace(/\.png$/i, "");

    select.appendChild(option);
  }

  if (SETTINGS.paint.brushMode === "procedural") {
    select.value = "__procedural__";
  } else {
    select.value =
      SETTINGS.paint.forcedFillBrush || "";
  }

  select.addEventListener("change", event => {
    const value = event.target.value;

    if (value === "__procedural__") {
      SETTINGS.paint.brushMode =
        "procedural";

      SETTINGS.paint.forcedFillBrush =
        null;
    } else {
      SETTINGS.paint.brushMode =
        "image";

      SETTINGS.paint.forcedFillBrush =
        value || null;
    }
  });
}
function setupSeedControls() {
  const input =
    document.getElementById("generation-seed");

  const newButton =
    document.getElementById("new-seed-button");

  input.value = generationSeed;

  input.addEventListener("change", () => {
    const value =
      Math.floor(Number(input.value));

    generationSeed = constrain(
      Number.isFinite(value) ? value : 0,
      0,
      999999999
    );

    input.value = generationSeed;
  });

  newButton.addEventListener("click", () => {
    generationSeed =
      Math.floor(
        Math.random() * 1000000000
      );

    input.value = generationSeed;

    requestGenerate();
  });
}

function updateBleedAlphaFromControls() {
  const strength =
    SETTINGS.paint.bleedStrength;

  const maxAlpha = map(
    strength,
    0,
    100,
    0,
    20
  );

  SETTINGS.paint.bleedAlphaMax =
    Math.round(maxAlpha);

  SETTINGS.paint.bleedAlphaMin =
    Math.round(maxAlpha * 0.2);
}

function updateFillAlphaFromControls() {
  const center = map(
    SETTINGS.paint.fillStrength,
    0,
    100,
    1,
    20
  );

  const spread = map(
    SETTINGS.paint.opacityVariation,
    0,
    100,
    0,
    15
  );

  SETTINGS.paint.alphaMin = constrain(
    Math.round(center - spread),
    1,
    255
  );

  SETTINGS.paint.alphaMax = constrain(
    Math.round(center + spread),
    SETTINGS.paint.alphaMin,
    255
  );
}

function deriveFillControlsFromAlpha() {
  const center =
    (SETTINGS.paint.alphaMin +
      SETTINGS.paint.alphaMax) / 2;

  const spread =
    (SETTINGS.paint.alphaMax -
      SETTINGS.paint.alphaMin) / 2;

  SETTINGS.paint.fillStrength = constrain(
    Math.round(map(center, 1, 20, 0, 100)),
    0,
    100
  );

  SETTINGS.paint.opacityVariation = constrain(
    Math.round(map(spread, 0, 15, 0, 100)),
    0,
    100
  );
}

function enforceFillBrushSizeOrder(changed) {
  if (
    SETTINGS.paint.brushSizeMin >
    SETTINGS.paint.brushSizeMax
  ) {
    if (changed === "min") {
      SETTINGS.paint.brushSizeMax =
        SETTINGS.paint.brushSizeMin;
    } else {
      SETTINGS.paint.brushSizeMin =
        SETTINGS.paint.brushSizeMax;
    }
  }
}

function setupBoundaryBrushMode() {
  const select =
    document.getElementById(
      "boundary-brush-mode"
    );

  select.value =
    SETTINGS.boundary.brushMode;

  select.addEventListener(
    "change",
    event => {
      SETTINGS.boundary.brushMode =
        event.target.value;

      updateBoundaryBrushEnabledState();
    }
  );
}

function setupBoundaryBrushSelect() {
  const select =
    document.getElementById(
      "boundary-brush-select"
    );

  select.innerHTML = "";

  const randomOption =
    document.createElement("option");

  randomOption.value = "";
  randomOption.textContent = "Random";

  select.appendChild(randomOption);

  for (const brushName of brushNames) {
    const option =
      document.createElement("option");

    option.value = brushName;

    option.textContent =
      brushName.replace(/\.png$/i, "");

    select.appendChild(option);
  }

  select.value =
    SETTINGS.boundary.forcedBrush || "";

  select.addEventListener(
    "change",
    event => {
      SETTINGS.boundary.forcedBrush =
        event.target.value || null;
    }
  );

  updateBoundaryBrushEnabledState();
}

function setupBoundaryVisibility() {
  const checkbox =
    document.getElementById("boundary-visible");

  checkbox.checked =
    SETTINGS.boundary.visible;

  checkbox.addEventListener(
    "change",
    event => {
      SETTINGS.boundary.visible =
        event.target.checked;

      renderArtwork();
    }
  );
}

function setupCollapsibleSections() {
  const sections =
    document.querySelectorAll(
      ".collapsible-group"
    );

  for (const section of sections) {
    const button =
      section.querySelector(
        ".section-toggle"
      );

    const content =
      section.querySelector(
        ".section-content"
      );

    if (!button || !content) {
      continue;
    }

    button.addEventListener(
      "click",
      () => {
        const collapsed =
          section.classList.toggle(
            "collapsed"
          );

        button.setAttribute(
          "aria-expanded",
          String(!collapsed)
        );
      }
    );
  }
}

function updateBoundaryBrushEnabledState() {
  const brushSelect =
    document.getElementById(
      "boundary-brush-select"
    );

  brushSelect.disabled =
    SETTINGS.boundary.brushMode !== "image";
}

function setupRangeControl(
  inputId,
  valueId,
  getter,
  setter
) {
  const input =
    document.getElementById(inputId);

  const valueDisplay =
    document.getElementById(valueId);

  function sync() {
    const value = getter();

    input.value = value;
    valueDisplay.textContent = value;
  }

  input.addEventListener(
    "input",
    event => {
      setter(event.target.value);

      valueDisplay.textContent =
        event.target.value;
    }
  );

  sync();
}

function loadPresetFromFile(file) {
  const reader = new FileReader();

  reader.onload = event => {
    try {
      const preset =
        JSON.parse(event.target.result);

      if (!preset || !preset.settings) {
        throw new Error("Invalid regionPainter preset.");
      }

      applyPreset(preset);

      syncAllControls();

      UI_STATE.paletteMode = "inherit";
      UI_STATE.fixedPaletteKey = null;

      const paletteSelect =
        document.getElementById("palette-select");

      if (paletteSelect) {
        paletteSelect.value = "inherit";
      }

      requestGenerate();

      console.log(
        `Preset loaded: ${preset.presetName || file.name}`
      );
    } catch (error) {
      console.error(
        "Could not load preset:",
        error
      );

      alert("That file is not a valid regionPainter preset.");
    }
  };

  reader.readAsText(file);
}

function syncAllControls() {
  syncBoundaryControls();
  syncFillControls();
  syncTextureControls();
  syncViewControls();
  syncAnimationControls();
  syncGridControls();
  syncGridVariationControls();

  const boundarySource =
    document.getElementById("boundary-source");

  if (boundarySource) {
    boundarySource.value =
      SETTINGS.boundary.source;
  }

  updateDrawnBoundaryControls();

  // Future:
  // syncPaintControls();
  // syncTextureControls();
}

function syncGridVariationControls() {
  document.getElementById(
    "grid-variation-enabled"
  ).checked =
    SETTINGS.gridVariation.enabled;

  document.getElementById(
    "grid-row-parameter"
  ).value =
    SETTINGS.gridVariation.rowParameter;

  document.getElementById(
    "grid-col-parameter"
  ).value =
    SETTINGS.gridVariation.colParameter;

  document.getElementById(
    "grid-row-start"
  ).value =
    SETTINGS.gridVariation.rowStart;

  document.getElementById(
    "grid-row-start-value"
  ).textContent =
    SETTINGS.gridVariation.rowStart;

  document.getElementById(
    "grid-row-end"
  ).value =
    SETTINGS.gridVariation.rowEnd;

  document.getElementById(
    "grid-row-end-value"
  ).textContent =
    SETTINGS.gridVariation.rowEnd;

  document.getElementById(
    "grid-col-start"
  ).value =
    SETTINGS.gridVariation.colStart;

  document.getElementById(
    "grid-col-start-value"
  ).textContent =
    SETTINGS.gridVariation.colStart;

  document.getElementById(
    "grid-col-end"
  ).value =
    SETTINGS.gridVariation.colEnd;

  document.getElementById(
    "grid-col-end-value"
  ).textContent =
    SETTINGS.gridVariation.colEnd;
}

function syncGridControls() {
  document.getElementById(
    "grid-enabled"
  ).checked =
    SETTINGS.grid.enabled;
    
  document.getElementById(
    "canvas-background-mode"
  ).value =
    SETTINGS.canvas.backgroundMode;

  document.getElementById(
    "grid-outline-mode"
  ).value =
    SETTINGS.grid.outlineMode;

  syncRangeControl(
    "grid-rows",
    "grid-rows-value",
    SETTINGS.grid.rows
  );

  syncRangeControl(
    "grid-cols",
    "grid-cols-value",
    SETTINGS.grid.cols
  );

  syncRangeControl(
    "grid-gutter",
    "grid-gutter-value",
    SETTINGS.grid.gutter
  );

  syncRangeControl(
    "grid-outer-margin",
    "grid-outer-margin-value",
    SETTINGS.grid.outerMargin
  );
}

function syncBoundaryControls() {
  syncRangeControl(
    "boundary-brush-size",
    "boundary-brush-size-value",
    SETTINGS.boundary.thinBrushSize
  );

  syncRangeControl(
    "boundary-multiplier",
    "boundary-multiplier-value",
    SETTINGS.boundary.midSizeMultiplier
  );

  syncRangeControl(
    "boundary-alpha",
    "boundary-alpha-value",
    SETTINGS.boundary.brushAlpha
  );

  syncRangeControl(
    "boundary-scale",
    "boundary-scale-value",
    SETTINGS.boundary.scale
  );

  syncRangeControl(
    "boundary-point-count",
    "boundary-point-count-value",
    SETTINGS.boundary.pointCount
  );

  syncRangeControl(
    "boundary-subdivisions",
    "boundary-subdivisions-value",
    SETTINGS.boundary.subdivisions
  );
  syncRangeControl(
    "boundary-peak-position",
    "boundary-peak-position-value",
    SETTINGS.boundary.peakPosition
  );

  syncRangeControl(
    "boundary-size-jitter",
    "boundary-size-jitter-value",
    Math.round(
      SETTINGS.boundary.sizeJitter * 200
    )
  );

  document.getElementById(
    "boundary-visible"
  ).checked =
    SETTINGS.boundary.visible;

  document.getElementById(
    "boundary-brush-mode"
  ).value =
    SETTINGS.boundary.brushMode;

  document.getElementById(
    "boundary-brush-select"
  ).value =
    SETTINGS.boundary.forcedBrush || "";

  document.getElementById(
    "boundary-primitives-enabled"
  ).checked =
    SETTINGS.boundary.primitivesEnabled;

  syncRangeControl(
    "boundary-primitive-chance",
    "boundary-primitive-chance-value",
    Math.round(
      SETTINGS.boundary.primitiveChance *
      100
    )
  );

  updatePrimitiveBoundaryControls();

  updateBoundaryBrushEnabledState();
}

function syncTextureControls() {
  document.getElementById(
    "texture-blend-mode"
  ).value =
    SETTINGS.texture.blendMode;

  syncRangeControl(
    "texture-opacity",
    "texture-opacity-value",
    SETTINGS.texture.opacity
  );

  syncRangeControl(
    "texture-scale",
    "texture-scale-value",
    SETTINGS.texture.scale
  );
}

function syncRangeControl(
  inputId,
  valueId,
  value
) {
  document.getElementById(
    inputId
  ).value = value;

  document.getElementById(
    valueId
  ).textContent = value;
}

function syncFillControls() {
  deriveFillControlsFromAlpha();
  
  document.getElementById(
    "fill-color-mode"
  ).value =
    SETTINGS.fill.colorMode;

  document.getElementById(
    "fill-sample-mode"
  ).value =
    SETTINGS.fill.sampleMode;

  syncRangeControl(
    "fill-center-weight",
    "fill-center-weight-value",
    SETTINGS.fill.centerWeight
  );

  updateFillSamplingControls();

  document.getElementById(
    "fill-brush-select"
  ).value =
    SETTINGS.paint.forcedFillBrush || "";

  syncRangeControl(
    "fill-strength",
    "fill-strength-value",
    SETTINGS.paint.fillStrength
  );

  syncRangeControl(
    "fill-opacity-variation",
    "fill-opacity-variation-value",
    SETTINGS.paint.opacityVariation
  );

  syncRangeControl(
    "fill-marks-per-region",
    "fill-marks-per-region-value",
    SETTINGS.paint.marksPerRegion
  );

  syncRangeControl(
    "fill-brush-size-min",
    "fill-brush-size-min-value",
    SETTINGS.paint.brushSizeMin
  );

  syncRangeControl(
    "fill-brush-size-max",
    "fill-brush-size-max-value",
    SETTINGS.paint.brushSizeMax
  );
  syncRangeControl(
    "fill-attempts",
    "fill-attempts-value",
    SETTINGS.fill.attempts
  );

  syncRangeControl(
    "fill-bleed-amount",
    "fill-bleed-amount-value",
    SETTINGS.paint.bleedPixels
  );

  syncRangeControl(
    "fill-bleed-strength",
    "fill-bleed-strength-value",
    SETTINGS.paint.bleedStrength
  );
}

function syncViewControls() {
  document.getElementById(
    "view-show-paint"
  ).checked =
    SETTINGS.view.showPaint;

  document.getElementById(
    "view-show-structure-lines"
  ).checked =
    SETTINGS.view.showStructureLines;

  document.getElementById(
    "view-show-structure-points"
  ).checked =
    SETTINGS.view.showStructurePoints;
}

function addPaletteOption(select, value, label) {
  const option =
    document.createElement("option");

  option.value = value;
  option.textContent = label;

  select.appendChild(option);
}

function scheduleGenerate() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      generateArtwork();
      lastGenerationTime = millis();
    }, 0);
  });
}

function enterDrawnBoundaryMode() {
  drawnBoundaryStrokes = [];
  showDrawingPreview = true;

  boundaryDetectionLayer.clear();
  boundaryLayer.clear();
  paintLayer.clear();

  if (drawingPreviewLayer) {
    drawingPreviewLayer.clear();
  }

  const status =
    document.getElementById(
      "drawing-status"
    );

  if (status) {
    status.textContent =
      "Draw on the canvas";
  }

  drawBoundaryPreview();
}

function setupAnimationControls() {
  const checkbox =
    document.getElementById("animation-enabled");

  if (!checkbox) {
    return;
  }

  checkbox.checked =
    SETTINGS.animation.enabled;

  checkbox.addEventListener("change", event => {
    SETTINGS.animation.enabled =
      event.target.checked;
  });
}

function syncAnimationControls() {
  const checkbox =
    document.getElementById("animation-enabled");

  if (checkbox) {
    checkbox.checked =
      SETTINGS.animation.enabled;
  }
}