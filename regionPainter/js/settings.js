const SETTINGS = {
  canvas: {
    paperColor: null,

    autoRegenerate: true,
    regenerateSeconds: 2
  },

  boundary: {
    pointCount: 30, // more points = more lines and potential intersections
    subdivisions: 8, // 8 number of segments between points
    strokeWeight: 1, // width of line

    scale: 1.2, // 1.2 - where points are plotted relative to the canvas size

    cornerSoftness: 0.20, // .2 - .1 is jaggy, higher number = softer
    softeningPasses: 1, // 1 default

    visible: true // is the line visible or notss
  },

  fill: {
    attempts: 40,
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
    maxMarkScale: 2.0, // default 1

    minBrushScale: 0.65, 
    maxBrushScale: 8, // default 8

    brushMode: "image",

    brushSizeMin: 12, // default 12
    brushSizeMax: 400, // default 400

    alphaMin: 0.25, // default 0.25
    alphaMax: 2, // default 2

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