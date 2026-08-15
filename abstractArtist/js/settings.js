const SETTINGS = {
  canvas: {
    width: 1200,
    height: 1200,
    pixelDensity: 1
  },

  paper: {
    mode: "hybrid", // "procedural", "image", "hybrid"

    imagePath: "assets/canvas-board.jpg",
    imageTintAlpha: 255,
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
    stainAlphaMin: 1,
    stainAlphaMax: 3,
    stainLayersMin: 10,
    stainLayersMax: 22,
    stainJitter: 20
  },

  intent: {
    composition: {
      negativeSpaceMin: 0.18,
      negativeSpaceMax: 0.52,
      spreadMin: 0.72,
      spreadMax: 1.34,
      scaleContrastMin: 0.72,
      scaleContrastMax: 1.32,
      secondaryCountMin: 2,
      secondaryCountMax: 5
    }
  },

  composition: {
    palette: {
      red: [176, 82, 72],
      blue: [65, 95, 145],
      yellow: [201, 154, 56],
      green: [83, 116, 75],
      ochre: [170, 116, 62],
      violet: [111, 83, 124]
    }
  },


  ink: {
    color: [42, 39, 35],
    passes: 2,
    jitter: 1.5, //increase to make the ink more irregular, decrease to make it more uniform
    alphaMin: 150,
    alphaMax: 255,
    weightMin: 0.7,
    weightMax: 4, //1.6 is default, increase to make the ink more pronounced, decrease to make it more subtle
    breakChance: 0.05,

    arcPasses: 4,
    arcJitter: 1.5,
    arcAlphaMin: 25,
    arcAlphaMax: 150,
    arcWeightMin: 0.65,
    arcWeightMax: 2.4,
    arcBreakChance: 0.06
  },

  watercolor: {
    testCircle: {
      x: 600,
      y: 600,
      radius: 190,
      color: [176, 82, 72]
    },

    layers: 34, //increase to make more painterly, decrease to make more graphic
    points: 90,

    positionJitter: 6, //increase to make the watercolor more irregular, decrease to make it more uniform
    radiusJitter: 0.06,
    edgeJitter: 14, //increase to make the edges more irregular, decrease to make them smoother
    noiseScale: 1.2,

    alphaMin: 3,
    alphaMax: 9, //reduce this and granulationAlphaMax to make the watercolor more transparent

    granulationCount: 2000, // increase to add more texture
    granulationThreshold: 0.52,
    granulationDarken: 18,
    granulationAlphaMin: 4,
    granulationAlphaMax: 1,
    granulationSizeMin: 0.4,
    granulationSizeMax: 1.8,

    poolingRings: 2,
    poolingThreshold: 0.57,
    poolingDarken: 28,
    poolingStrokeWeight: 0.7,
    poolingAlphaMin: 8,
    poolingAlphaMax: 18 // reduce this and granulationAlphaMax to make the watercolor more transparent
  }
};