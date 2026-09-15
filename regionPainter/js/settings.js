const SETTINGS = {

  canvas: {
    width: 3000,
    height: 4000,

    paperColor: null,

    backgroundMode: "palette", // "palette" | "white" | "black"

    autoRegenerate: false,
    regenerateSeconds: 2
  },

  texture: {
    opacity: 140,
    blendMode: "multiply",
    scale: 1.0
  },

  view: {
    zoom: 0.25,

    showPaint: true,
    showStructureLines: false,
    showStructurePoints: false
  },

  grid: {
    enabled: false,

    rows: 2,
    cols: 2,

    gutter: 20,
    outerMargin: 20,

    outlineMode: "none", // "none" | "white" | "black"
    outlineWeight: 1
  },

  gridVariation: {
    enabled: false,

    rowParameter: "none",
    rowStart: 0.8,
    rowEnd: 1.4,

    colParameter: "none",
    colStart: 6,
    colEnd: 20
  },

  artifact: {
    enabled: true,
    chance: 0.1, // default should be low 0.03
    minRegionPixels: 2500,

    fitScale: 1.4,

    scaleMin: 0.9,
    scaleMax: 1.8,

    alphaMin: 170,
    alphaMax: 255
  },

  boundary: {
    source: "chaikin", // "chaikin" | "particleChaikin" | "rectangle" | "drawn"
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

  particle: {
    count: 1,
    feedMode: "roundRobin",

    samplingMode: "interval",

    motionMode: "noise", // "noise" | "attractor"

    sampleEvery: 10,

    headingChangeThreshold: 20 * Math.PI / 180,
    maxSampleGap: 30,

    minSpeed: 1.5,
    maxSpeed: 8.0,
    steeringStrength: 0.30,
    noiseStep: 0.015,

    attractorStrength: 0.08,

    wrap: true,
    maxStepsMultiplier: 30
  },

  animation: {
    enabled: false,

    mode: "progressive",

    particleStepsPerFrame: 1,
    particleMinDurationMs: 3000,

    showParticleTrail: true,
    trailAlpha: 80,
    sampleDotSize: 7,

    boundaryRevealPointsPerFrame: 40,

    paintEventsPerFrame: 1,
    pauseAfterBoundaryMs: 150
  },

  fill: {
    attempts: 60,
    minRegionPixels: 500,
    maxRegionFraction: 0.7,

    sampleMode: "uniform", // "uniform" | "centerWeighted"
    centerWeight: 60,

    colorMode: "fixedPerRegion" // "fixedPerRegion" | "randomPerHit"
  },

  paint: {
    marksPerRegion: 200,
    maskExpansionPixels: 2,

    fillStrength: 40,
    opacityVariation: 35,
    bleedStrength: 30,

    // Region-size response
    referenceRegionPixels: 25000,
    markAreaExponent: 0.50,
    brushAreaExponent: 0.15,

    minMarkScale: 0.5,
    maxMarkScale: 1.25,

    minBrushScale: 0.65,
    maxBrushScale: 2.5,

    brushMode: "image",
    brushStrategy: "singlePerRegion",
    forcedFillBrush: null,
    useSameBrushForBleed: true,

    brushSizeMin: 12,
    brushSizeMax: 250,

    alphaMin: 3,
    alphaMax: 14,

    bleedMarks: 100,
    bleedPixels: 5,
    bleedAlphaMin: 1,
    bleedAlphaMax: 6,
    maskFeatherSteps: 0
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