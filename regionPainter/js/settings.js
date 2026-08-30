const SETTINGS = {
  canvas: {
    paperColor: null
  },

  boundary: {
    pointCount: 25,
    subdivisions: 8,
    strokeWeight: 3,

    scale: 2,

    cornerSoftness: 0.40,
    softeningPasses: 1,

    visible: true
  },

  fill: {
    attempts: 20,
    minRegionPixels: 500,
    maxRegionFraction: 0.7
  },

  paint: {
    marksPerRegion: 100,

    // Region-size response
    referenceRegionPixels: 25000,
    markAreaExponent: 0.50,
    brushAreaExponent: 0.15,

    minMarkScale: 0.5,
    maxMarkScale: 4.0,

    minBrushScale: 0.65,
    maxBrushScale: 1.5,

    brushMode: "procedural",

    brushSizeMin: 12,
    brushSizeMax: 200,

    alphaMin: 1,
    alphaMax: 5,

    bleedPixels: 40,          // 0 = exact mask
    maskFeatherSteps: 0      // optional later softness
  },

  debug: {
    showSeeds: false,
    showDetectedRegion: false
  }
};