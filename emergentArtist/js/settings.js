const SETTINGS = {
  // Seed used for deterministic/randomized generation.
  seed: 120937,

  // Palette key from common/js/palette.js.
  paletteName: "arcaneBlue",

  // Number of agents of each species created at startup.
  population: {
    circles: 10,
    lines: 10
  },

  // Personality traits.
  // Each agent gets its own randomly chosen value within these ranges.
  personality: {

    // General size tendency of the mark.
    // 0 = smallest size in the mark's allowed range
    // 1 = largest size in the mark's allowed range
    scale: [0.15, 1.0],

    // Stroke transparency.
    // 0 = fully transparent
    // 1 = fully opaque
    opacity: [0.08, 0.75],

    // Stroke thickness in pixels.
    weight: [0.5, 4.0],

    // Small-scale irregularity of the stroke.
    // 0 = clean geometry
    // 1 = strongest allowed wobble/jaggedness
    roughness: [0.0, 1.0],

    // Agent movement speed in pixels per frame.
    speed: [0.35, 1.8],

    // Maximum random steering change per frame, in radians.
    // Higher values create more wandering movement.
    wander: [0.01, 0.20],

    // Probability of leaving a mark on any frame.
    // Example: 0.01 = about a 1% chance per frame.
    drawFrequency: [0.0005, 0.005],

    // Future trait for sensing/reacting to interesting areas.
    // Currently not used.
    curiosity: [0.0, 1.0],

    // Amount of a mark that is drawn.
    // Currently useful for lines.
    // Circles can instead use discrete 90/180/270/360 degree arcs.
    completeness: [0.35, 1.0],

    // Strength of repeated/retraced strokes.
    // 0 = no repetition
    // 1 = maximum repetition allowed by the renderer
    repetition: [0.0, 1.0],

    // Large-scale deformation of the geometry.
    // 0 = regular geometry
    // 1 = strongest allowed deformation
    distortion: [0.0, 1.0]
  },

  // Mark sizes as percentages of the smaller canvas dimension.
  // Example:
  // 0.02 = 2%
  // 0.10 = 10%
  // 0.20 = 20%
  marks: {

    // Circle diameter range.
    // 2% to 18% of min(width, height).
    circleDiameter: [0.02, 0.5],

    // Line length range.
    // 2% to 14% of min(width, height).
    lineLength: [0.02, 0.5],

    // Maximum pixel offset for repeated strokes.
    repetitionOffset: 5 
  },

  debug: {

    // Draw moving agents on top of the artwork.
    showAgents: false,

    // Diameter of the visible debug agent marker, in pixels.
    agentSize: 6,

    // Length of the debug velocity-direction line, in pixels.
    velocityLength: 14
  }
};