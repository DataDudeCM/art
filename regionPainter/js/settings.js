const SETTINGS = {
  canvas: {
    paperColor: null,

    autoRegenerate: true,
    regenerateSeconds: 2
  },

  texture: {
    opacity: 140,
    blendMode: "multiply"
  },

  boundary: {
    pointCount: 30, // more points = more lines and potential intersections
    subdivisions: 8, // 8 number of segments between points
    strokeWeight: 1, // width of line

    scale: 1.2, // 1.2 - where points are plotted relative to the canvas size

    cornerSoftness: 0.20, // .2 - .1 is jaggy, higher number = softer
    softeningPasses: 1, // 1 default

    visible: true, // is the line visible or notss

    // Visible boundary rendering
    brushMode: "image",      // "image" or "line"
    forcedBrush: "Creamy.png",       // null = random boundary brush

    thinBrushSize: 4,       // base thickness at segment start/end
    midSizeMultiplier: 2,    // 2 = 2x thickness in the middle
    peakPosition: 0.6, // 0.5 = centered

    brushSpacing: 2,
    brushAlpha: 255,

    sizeJitter: 0.12,
    rotationJitter: 0.12
    
  },

  fill: {
    attempts: 60,
    minRegionPixels: 500,
    maxRegionFraction: 0.7
  },

  paint: {
    marksPerRegion: 200,

    // Region-size response
    referenceRegionPixels: 25000, 
    markAreaExponent: 0.50, 
    brushAreaExponent: 0.15,

    minMarkScale: 0.5,
    maxMarkScale: 1.25, // default 1

    minBrushScale: 0.65, // default 0.65
    maxBrushScale: 2.5, // default 8

    brushMode: "image",
    brushStrategy: "singlePerRegion", // "singlePerRegion" or "randomPerStamp"
    forcedFillBrush: null, // set to null for random-per-region
    useSameBrushForBleed: true,

    brushSizeMin: 12, // default 12
    brushSizeMax: 250, // default 400

    alphaMin: 3, // default 0.25
    alphaMax: 14, // default 2

    bleedMarks: 100,
    bleedPixels: 5,
    bleedAlphaMin: 1,
    bleedAlphaMax: 6, 
       // 0 = exact mask
    maskFeatherSteps: 0      // optional later softness
  },

  debug: {
    showSeeds: false,
    showDetectedRegion: false
  }
};

const DEFAULT_SETTINGS =
  JSON.parse(JSON.stringify(SETTINGS));


function resetSettingsToDefaults() {
  const defaults =
    JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  for (const key of Object.keys(SETTINGS)) {
    delete SETTINGS[key];
  }

  Object.assign(SETTINGS, defaults);
}