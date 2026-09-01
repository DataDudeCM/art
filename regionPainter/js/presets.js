let presetManifest = null;
let loadedPresets = {};

function loadPresetLibrary() {
  loadJSON(
    "presets/presets.json",

    manifest => {
      presetManifest = manifest;

      for (const filename of manifest.presets || []) {
        loadJSON(
          `presets/${filename}`,

          preset => {
            loadedPresets[preset.presetName] = preset;
          },

          error => {
            console.error(
              `Could not load preset: ${filename}`,
              error
            );
          }
        );
      }
    },

    error => {
      console.error(
        "Could not load preset manifest:",
        error
      );
    }
  );
}

function getChangedSettings(current, defaults) {
  const changed = {};

  for (const key of Object.keys(current)) {
    const currentValue = current[key];
    const defaultValue = defaults[key];

    if (
      currentValue &&
      typeof currentValue === "object" &&
      !Array.isArray(currentValue)
    ) {
      const nested =
        getChangedSettings(
          currentValue,
          defaultValue || {}
        );

      if (Object.keys(nested).length > 0) {
        changed[key] = nested;
      }
    } else if (currentValue !== defaultValue) {
      changed[key] = currentValue;
    }
  }

  return changed;
}


function buildPresetData(name) {
  return {
    presetVersion: 1,

    presetName: name,

    updatedAt:
      new Date().toISOString(),

    paletteKey:
      getPaletteKey(palette),

    paletteName:
      palette?.name || null,

    settings:
      getChangedSettings(
        SETTINGS,
        DEFAULT_SETTINGS
      )
  };
}


function savePresetToFile(name) {
  if (!name) {
    return;
  }

  const preset =
    buildPresetData(name);

  const json =
    JSON.stringify(
      preset,
      null,
      2
    );

  const safeName =
    name
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "");

  const blob =
    new Blob(
      [json],
      {
        type: "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    `${safeName}.json`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  console.log(
    `Preset exported: ${name}`
  );
}


function deepMerge(target, source) {
  for (const key of Object.keys(source || {})) {
    const value = source[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      if (!target[key]) {
        target[key] = {};
      }

      deepMerge(
        target[key],
        value
      );
    } else {
      target[key] = value;
    }
  }

  return target;
}


function applyPreset(preset) {
  currentPreset = preset;

  resetSettingsToDefaults();

  deepMerge(
    SETTINGS,
    preset.settings || {}
  );
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