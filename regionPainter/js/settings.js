const SETTINGS = {
  canvas: {
    paperColor: null
  },

  boundary: {
    pointCount: 25,
    subdivisions: 8,
    strokeWeight: 1,

    scale: 4,

    cornerSoftness: 0.40,
    softeningPasses: 1,

    visible: false
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
    maxMarkScale: 1.0,

    minBrushScale: 0.65,
    maxBrushScale: 8,

    brushMode: "procedural",

    brushSizeMin: 12,
    brushSizeMax: 400,

    alphaMin: 0.25,
    alphaMax: 2.5,

    bleedMarks: 100,
    bleedPixels: 5,
    bleedAlphaMin: 0.5,
    bleedAlphaMax: 2, 
       // 0 = exact mask
    maskFeatherSteps: 0      // optional later softness
  },

  debug: {
    showSeeds: false,
    showDetectedRegion: false
  }
};