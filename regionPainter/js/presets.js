const PRESET_STORAGE_KEY = "regionPainter.presets";

function getAllPresets() {
  const raw = localStorage.getItem(PRESET_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Could not parse presets:", err);
    return {};
  }
}


function savePreset(name) {
  if (!name) {
    return;
  }

  const presets = getAllPresets();
  const existing = presets[name];

  presets[name] = {
    presetName: name,
    createdAt:
      existing?.createdAt ||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

    paletteKey:
      getPaletteKey(palette),

    paletteName:
      palette?.name || null,

    settings:
      JSON.parse(
        JSON.stringify(SETTINGS)
      )
  };

  localStorage.setItem(
    PRESET_STORAGE_KEY,
    JSON.stringify(presets)
  );

  console.log(`Preset saved: ${name}`);
}


function loadPreset(name) {
  const presets = getAllPresets();
  const preset = presets[name];

  if (!preset) {
    console.warn(`Preset not found: ${name}`);
    return false;
  }

  Object.assign(
    SETTINGS,
    JSON.parse(
      JSON.stringify(preset.settings)
    )
  );

  if (
    preset.paletteKey &&
    PALETTES[preset.paletteKey]
  ) {
    palette =
      PALETTES[preset.paletteKey];
  }

  generateArtwork();

  console.log(`Preset loaded: ${name}`);

  return true;
}


function deletePreset(name) {
  const presets = getAllPresets();

  if (!presets[name]) {
    return false;
  }

  delete presets[name];

  localStorage.setItem(
    PRESET_STORAGE_KEY,
    JSON.stringify(presets)
  );

  console.log(`Preset deleted: ${name}`);

  return true;
}


function listPresets() {
  return Object.keys(
    getAllPresets()
  ).sort();
}