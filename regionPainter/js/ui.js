function setupUI() {
  setupPresetControl();
  setupPaletteControl();
  setupBoundaryControls();
  setupPresetFileControls();
  setupTextureControls();
  setupCollapsibleSections();
  setupFillControls();

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

function setupBoundaryControls() {
  setupBoundaryBrushMode();
  setupBoundaryBrushSelect();
  setupBoundaryVisibility();

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
}

function setupFillControls() {
  setupFillBrushSelect();

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

  updateFillAlphaFromControls();
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

  for (const brushName of brushNames) {
    const option =
      document.createElement("option");

    option.value = brushName;
    option.textContent =
      brushName.replace(/\.png$/i, "");

    select.appendChild(option);
  }

  select.value =
    SETTINGS.paint.forcedFillBrush || "";

  select.addEventListener("change", event => {
    SETTINGS.paint.forcedFillBrush =
      event.target.value || null;
  });
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

  // Future:
  // syncPaintControls();
  // syncTextureControls();
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