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
  resetSettingsToDefaults();

  deepMerge(
    SETTINGS,
    preset.settings || {}
  );

  if (
    preset.paletteKey &&
    PALETTES[preset.paletteKey]
  ) {
    palette =
      PALETTES[preset.paletteKey];
  }

  generateArtwork();
}