// common/js/palette-v2.js
//
// Reusable palette system for p5.js art projects.
//
// Goals:
// - named palettes instead of numeric indexes
// - lightweight metadata
// - semantic color roles
// - reusable selection helpers
// - still simple enough for quick sketches

// USAGE:
/*
let palette;

function setup() {
  createCanvas(800, 800);

  palette = getPalette("earthMagenta");

  background(getLightColor(palette));

  fill(getAccentColor(palette));
  circle(400, 400, 250);

  stroke(getDarkColor(palette));
  line(100, 700, 700, 100);
}

or for looser generative work:

palette = randomPaletteByTag("moody");

let c1 = randomColor(palette);
let c2 = getAccentColor(palette);
let ink = getDarkColor(palette);

*/

const PALETTES = {
  vividPrimary: {
    name: "Vivid Primary",
    tags: ["bright", "energetic", "high-contrast"],
    colors: [
      { hex: "#FF5733", role: "warm" },
      { hex: "#33FF57", role: "accent" },
      { hex: "#5733FF", role: "cool" },
      { hex: "#FF3357", role: "accent" }
    ]
  },

  sunAndSea: {
    name: "Sun and Sea",
    tags: ["bright", "balanced", "warm-cool"],
    colors: [
      { hex: "#F0A500", role: "warm" },
      { hex: "#00A4CC", role: "cool" },
      { hex: "#D9BF77", role: "neutral" },
      { hex: "#EB5160", role: "accent" }
    ]
  },

  arcaneBlue: {
    name: "Arcane Blue",
    tags: ["dark", "blue", "moody", "cool"],
    colors: [
      { hex: "#1a1c2c", role: "dark" },
      { hex: "#2e294b", role: "shadow" },
      { hex: "#29366f", role: "mid" },
      { hex: "#3b5dc9", role: "accent" }
    ]
  },

  slateFade: {
    name: "Slate Fade",
    tags: ["cool", "neutral", "subtle"],
    colors: [
      { hex: "#2b2d42", role: "dark" },
      { hex: "#696773", role: "shadow" },
      { hex: "#8d99ae", role: "mid" },
      { hex: "#edf2f4", role: "light" }
    ]
  },

  retroPop: {
    name: "Retro Pop",
    tags: ["playful", "bright", "graphic"],
    colors: [
      { hex: "#fe4a49", role: "accent" },
      { hex: "#2ab7ca", role: "cool" },
      { hex: "#fed766", role: "warm" },
      { hex: "#e6e6ea", role: "light" },
      { hex: "#f4f4f8", role: "paper" }
    ]
  },

  oceanDepths: {
    name: "Ocean Depths",
    tags: ["blue", "monochrome", "calm"],
    colors: [
      { hex: "#011f4b", role: "dark" },
      { hex: "#03396c", role: "shadow" },
      { hex: "#005b96", role: "mid" },
      { hex: "#6497b1", role: "light" },
      { hex: "#b3cde0", role: "highlight" }
    ]
  },

  midnightSteel: {
    name: "Midnight Steel",
    tags: ["dark", "cool", "cinematic"],
    colors: [
      { hex: "#0d1b2a", role: "dark" },
      { hex: "#1b263b", role: "shadow" },
      { hex: "#415a77", role: "mid" },
      { hex: "#778da9", role: "light" },
      { hex: "#e0e1dd", role: "highlight" }
    ]
  },

  industrialSun: {
    name: "Industrial Sun",
    tags: ["industrial", "graphic", "urban"],
    colors: [
      { hex: "#272727", role: "dark" },
      { hex: "#fed766", role: "warm" },
      { hex: "#009fb7", role: "cool" },
      { hex: "#696773", role: "neutral" },
      { hex: "#eff1f3", role: "light" }
    ]
  },

  earthMagenta: {
    name: "Earth + Magenta",
    tags: ["earthy", "warm", "bold", "accent"],
    colors: [
      { hex: "#4f2d2e", role: "dark" },
      { hex: "#8d5749", role: "earth" },
      { hex: "#d98c4f", role: "warm" },
      { hex: "#f6115a", role: "accent" },
      { hex: "#f8f4e3", role: "paper" }
    ]
  },

  neonDusk: {
    name: "Neon Dusk",
    tags: ["dark", "neon", "moody"],
    colors: [
      { hex: "#0c1125", role: "dark" },
      { hex: "#2e294b", role: "shadow" },
      { hex: "#f24c76", role: "accent" },
      { hex: "#d0878a", role: "warm" },
      { hex: "#7c86ae", role: "cool" }
    ]
  },

  charcoalCoral: {
    name: "Charcoal Coral",
    tags: ["warm", "modern", "graphic"],
    colors: [
      { hex: "#2a2b2a", role: "dark" },
      { hex: "#706c61", role: "neutral" },
      { hex: "#e5446d", role: "accent" },
      { hex: "#ff8966", role: "warm" },
      { hex: "#f8f4e3", role: "paper" }
    ]
  },

  dustyNeutral: {
    name: "Dusty Neutral",
    tags: ["neutral", "muted", "quiet"],
    colors: [
      { hex: "#353b3c", role: "dark" },
      { hex: "#846a6a", role: "warm-neutral" },
      { hex: "#a2999e", role: "mid" },
      { hex: "#c6c7c4", role: "light" },
      { hex: "#eef0f2", role: "highlight" }
    ]
  },

  paleIndustrial: {
    name: "Pale Industrial",
    tags: ["neutral", "cool", "minimal"],
    colors: [
      { hex: "#272727", role: "dark" },
      { hex: "#e0e1dd", role: "light" },
      { hex: "#eff1f3", role: "highlight" },
      { hex: "#c6c7c4", role: "neutral" },
      { hex: "#b3cde0", role: "cool" }
    ]
  }
};


// --------------------------------------------------
// Core helpers
// --------------------------------------------------

function getPalette(name) {
  return PALETTES[name] || null;
}

function getPaletteNames() {
  return Object.keys(PALETTES);
}

function randomPalette() {
  const names = getPaletteNames();
  const name = names[Math.floor(Math.random() * names.length)];
  return PALETTES[name];
}

function getColors(paletteOrName) {
  const palette = resolvePalette(paletteOrName);
  return palette ? palette.colors.map(c => c.hex) : [];
}

function randomColor(paletteOrName) {
  const palette = resolvePalette(paletteOrName);

  if (!palette || palette.colors.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * palette.colors.length);
  return palette.colors[index].hex;
}


// --------------------------------------------------
// Semantic helpers
// --------------------------------------------------

function getColorsByRole(paletteOrName, role) {
  const palette = resolvePalette(paletteOrName);

  if (!palette) {
    return [];
  }

  return palette.colors
    .filter(c => c.role === role)
    .map(c => c.hex);
}

function getColorByRole(paletteOrName, role, fallbackToRandom = true) {
  const matches = getColorsByRole(paletteOrName, role);

  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)];
  }

  return fallbackToRandom
    ? randomColor(paletteOrName)
    : null;
}

function getDarkColor(paletteOrName) {
  return (
    getColorByRole(paletteOrName, "dark", false) ||
    getColorByRole(paletteOrName, "shadow", false) ||
    randomColor(paletteOrName)
  );
}

function getLightColor(paletteOrName) {
  return (
    getColorByRole(paletteOrName, "highlight", false) ||
    getColorByRole(paletteOrName, "light", false) ||
    getColorByRole(paletteOrName, "paper", false) ||
    randomColor(paletteOrName)
  );
}

function getAccentColor(paletteOrName) {
  return getColorByRole(paletteOrName, "accent", true);
}


// --------------------------------------------------
// Tag helpers
// --------------------------------------------------

function getPalettesByTag(tag) {
  return Object.entries(PALETTES)
    .filter(([_, palette]) => palette.tags.includes(tag))
    .map(([key, palette]) => ({
      key,
      ...palette
    }));
}

function randomPaletteByTag(tag) {
  const matches = getPalettesByTag(tag);

  if (matches.length === 0) {
    return null;
  }

  return matches[Math.floor(Math.random() * matches.length)];
}


// --------------------------------------------------
// Utility
// --------------------------------------------------

function resolvePalette(paletteOrName) {
  if (typeof paletteOrName === "string") {
    return getPalette(paletteOrName);
  }

  return paletteOrName;
}