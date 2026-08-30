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
    marksPerRegion: 300,
    brushMode: "procedural", // later: "image"
    brushSizeMin: 12,
    brushSizeMax: 40,
    alphaMin: 4,
    alphaMax: 14
  },

  debug: {
    showSeeds: false,
    showDetectedRegion: false
  }
};