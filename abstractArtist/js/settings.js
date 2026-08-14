const SETTINGS = {
  canvas: {
    width: 1200,
    height: 1000,
    pixelDensity: 1
  },

  paper: {
    mode: "hybrid", // "procedural", "image", "hybrid"

    imagePath: "assets/canvas-board.jpg",
    imageTintAlpha: 235,
    imageContrastAlpha: 20,

    proceduralOverlayStrength: 0.45,

    baseColor: [238, 230, 211],

    tonalScale: 0.006,
    tonalStrength: 7,
    tonalStep: 3,

    grainCount: 42000,
    grainAlphaMin: 2,
    grainAlphaMax: 9,
    grainSizeMin: 0.35,
    grainSizeMax: 1.4,

    fiberCount: 900,
    fiberLengthMin: 2,
    fiberLengthMax: 13,
    fiberAlphaMin: 3,
    fiberAlphaMax: 10,
    fiberWeightMin: 0.25,
    fiberWeightMax: 0.75,

    stainCountMin: 4,
    stainCountMax: 8,
    stainRadiusMin: 90,
    stainRadiusMax: 320,
    stainAlphaMin: 2,
    stainAlphaMax: 7,
    stainLayersMin: 10,
    stainLayersMax: 22,
    stainJitter: 20
  }
};
