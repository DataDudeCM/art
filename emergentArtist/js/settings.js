const SETTINGS = {
  seed: 120937,
  paletteName: "arcaneBlue",
  population: { circles: 10, lines: 10 },
  personality: {
    scale: [0.15, 1.0],
    opacity: [0.08, 0.5],
    weight: [0.5, 3.0],
    roughness: [0.0, 1.0],
    speed: [0.35, 1.8],
    wander: [0.01, 0.20],
    drawFrequency: [0.002, 0.025],
    curiosity: [0.0, 1.0],
    completeness: [0.35, 1.0],
    repetition: [0.0, 1.0],
    distortion: [0.0, 1.0]
  },
  marks: {
    circleDiameter: [18, 180],
    lineLength: [18, 140]
  },
  debug: {
    showAgents: false,
    agentSize: 6,
    velocityLength: 14
  }
};
