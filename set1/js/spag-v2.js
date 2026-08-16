//
// SPAG v2
//
// Modernized version of the original spaghetti doodle.
//
// Core idea:
//
//   A moving strand crosses the canvas.
//   Noise bends its trajectory.
//   Each step paints a perpendicular cross-section.
//   Endpoint marks accumulate into strand edges.
//   Occasionally a strand branches.
//
// The goal here is not to replace SPAG,
// but to make its original idea cleaner,
// more painterly, and easier to experiment with.
//

let strands = [];

let spagBrush;

let palette;
let paletteKey;

let seed;

let paused = false;
let showHUD = false;


// --------------------------------------------------
// Artistic settings
// --------------------------------------------------

const SETTINGS = {

  strands: {
    initialCount: 200,

    width: 20,

    /*
     * Prevent runaway exponential growth.
     *
     * The original version allowed the array to grow
     * until 100,000 entries. That can get ugly fast.
     */

    maxCount: 2500
  },


  start: {

    boundary: 12,

    /*
     * Percentage of canvas width/height around the
     * center where strands may enter.
     */

    dispersionPercent: 12,

    speedMin: 0.7,
    speedMax: 1
  },


  movement: {

    noiseScale: 0.075, // default 0.0075

    /*
     * Young strands are relatively controlled.
     * Older / thinner strands become progressively
     * more unstable.
     */

    turnStart: 0.0005, // default 0.005
    turnEnd: 0.05, // default 0.05 bigger number = more curl

    maxSpeed: 8, // default 8

    /*
     * Original SPAG reduced width/life by roughly
     * 0.1% every cycle.
     */

    widthDecay: 0.999,

    minWidth: 1,

    boundary: 12,

    minBranchAge: 50,

    branchAngle: Math.PI / 8,

    maxBranchChance: 0.0005
  },


  branching: {

    /*
     * IMPORTANT:
     *
     * Original:
     *
     * random(100) < 0.01
     *
     * is actually about a 0.01% chance,
     * not a 1% chance.
     *
     * This value intentionally stays near that
     * original behavior.
     */

    chance: 0.00012 // default 0.00012
  },


  render: {

    brushEnabled: true,

    brushEvery: 2,

    /*
    * Make the interior brush a little narrower
    * than the full strand width so the dark edges
    * remain visually important.
    */
    brushThickness: 1,// default 0.5

    brushAlpha: 250,

    fiberWeight: 2,
    fiberAlpha: 250,

    markChance: 0.99, // default 0.94

    /*
    * Edge rendering
    */
    edgeAlpha: 255, // default 255
    edgeWeightScale: 0.25, // default 0.25
    minEdgeWeight: 0.8, // default 0.8

    /*
    * Endpoint dots
    */
    dotAlpha: 255, // default 170
    dotWeightScale: 0.16,
    minDotWeight: 1.1
  }
};


// --------------------------------------------------
// Preload
// --------------------------------------------------

function preload() {

  /*
   * Gouache seems like a good first SPAG brush:
   * more physical than a digital line, but still
   * substantial enough to make the strands readable.
   *
   * Easy experiment later:
   *
   *   Watercolor 1.png
   *   Watercolor 3.png
   *   Acrylic Basic.png
   */

  spagBrush =
    loadImage(
      "../common/brushes/Guache.png"
    );
}


// --------------------------------------------------
// Setup
// --------------------------------------------------

function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );

  /*
   * Important performance choice when stamping
   * lots of image brushes.
   */

  pixelDensity(1);

  colorMode(
    RGB,
    255,
    255,
    255,
    255
  );

  resetArtwork({
    newSeed: true,
    newPalette: true
  });
}


// --------------------------------------------------
// Draw
// --------------------------------------------------

function draw() {

  updateStrands();

  if (showHUD) {
    drawHUD();
  }
}


// --------------------------------------------------
// Strand manager
// --------------------------------------------------

function updateStrands() {

  for (
    let i = strands.length - 1;
    i >= 0;
    i--
  ) {

    const strand =
      strands[i];

    if (!strand.alive) {

      strands.splice(i, 1);

      continue;
    }

    /*
     * Movement may return a child strand.
     */

    const child =
      strand.update();

    strand.render(
      spagBrush,
      SETTINGS.render
    );

    if (
      child &&
      strands.length <
      SETTINGS.strands.maxCount
    ) {

      strands.push(child);
    }
  }

  /*
   * Once every strand has left the canvas,
   * stop wasting draw cycles.
   */

  if (
    strands.length === 0 &&
    !paused
  ) {

    noLoop();

    paused = true;
  }
}


// --------------------------------------------------
// Reset / generation
// --------------------------------------------------

function resetArtwork({
  newSeed = true,
  newPalette = false
} = {}) {

  loop();

  paused = false;

  strands.length = 0;


  // ----------------------------------------------
  // Seed
  // ----------------------------------------------

  if (
    newSeed ||
    seed == null
  ) {

    seed =
      floor(
        Math.random() *
        1000000000
      );
  }

  randomSeed(seed);
  noiseSeed(seed);


  // ----------------------------------------------
  // Palette
  // ----------------------------------------------

  if (
    newPalette ||
    !palette
  ) {

    paletteKey = "earthMagenta";
    palette = getPalette(paletteKey);
  }


  const paperColor =
    getLightColor(
      palette
    );

  const inkColor =
    getDarkColor(
      palette
    );

  background(
    paperColor
  );


  // ----------------------------------------------
  // Usable strand colors
  // ----------------------------------------------

  const allColors =
    getColors(
      palette
    );

  /*
   * Avoid using the paper color as a strand color.
   */

  const strandColors =
    allColors.filter(
      c =>
        c.toLowerCase() !==
        paperColor.toLowerCase()
    );


  // ----------------------------------------------
  // Initial strands
  // ----------------------------------------------

  for (
    let i = 0;
    i <
    SETTINGS.strands.initialCount;
    i++
  ) {

    const start =
      createStartPosition();

    const strandColor =
      random(
        strandColors
      );

    strands.push(

      new SpagStrand({

        position:
          start.position,

        velocity:
          start.velocity,

        width:
          SETTINGS.strands.width *
          random(0.75, 1.15),

        color:
          strandColor,

        inkColor:
          inkColor,

        movement:
          SETTINGS.movement,

        branchChance:
          SETTINGS.branching.chance
      })
    );
  }
}


// --------------------------------------------------
// Entry position
// --------------------------------------------------

function createStartPosition() {

  const side =
    floor(
      random(4)
    );

  const dispersionX =
    width *
    SETTINGS.start.dispersionPercent /
    100;

  const dispersionY =
    height *
    SETTINGS.start.dispersionPercent /
    100;

  const boundary =
    SETTINGS.start.boundary;

  const speed =
    random(
      SETTINGS.start.speedMin,
      SETTINGS.start.speedMax
    );


  // top

  if (side === 0) {

    return {

      position:
        createVector(

          random(
            width * 0.5 - dispersionX,
            width * 0.5 + dispersionX
          ),

          -boundary
        ),

      velocity:
        createVector(
          0,
          speed
        )
    };
  }


  // right

  if (side === 1) {

    return {

      position:
        createVector(

          width + boundary,

          random(
            height * 0.5 - dispersionY,
            height * 0.5 + dispersionY
          )
        ),

      velocity:
        createVector(
          -speed,
          0
        )
    };
  }


  // bottom

  if (side === 2) {

    return {

      position:
        createVector(

          random(
            width * 0.5 - dispersionX,
            width * 0.5 + dispersionX
          ),

          height + boundary
        ),

      velocity:
        createVector(
          0,
          -speed
        )
    };
  }


  // left

  return {

    position:
      createVector(

        -boundary,

        random(
          height * 0.5 - dispersionY,
          height * 0.5 + dispersionY
        )
      ),

    velocity:
      createVector(
        speed,
        0
      )
  };
}


// --------------------------------------------------
// Palette cycling
// --------------------------------------------------

function nextPalette() {
  palette = randomPalette();

  paletteKey =
    getPaletteNames().find(
      name => PALETTES[name] === palette
    );

  resetArtwork({
    newSeed: true,
    newPalette: false
  });
}


// --------------------------------------------------
// HUD
// --------------------------------------------------

function drawHUD() {

  push();

  noStroke();

  fill(
    20,
    190
  );

  rect(
    10,
    10,
    260,
    92,
    5
  );

  fill(240);

  textFont(
    "Courier New"
  );

  textSize(11);

  textAlign(
    LEFT,
    TOP
  );

  text(
    `SPAG v2`,
    20,
    20
  );

  text(
    `seed: ${seed}`,
    20,
    36
  );

  text(
    `palette: ${paletteKey}`,
    20,
    52
  );

  text(
    `strands: ${strands.length}`,
    20,
    68
  );

  text(
    `brush: ${
      SETTINGS.render.brushEnabled
        ? "on"
        : "off"
    }`,
    20,
    84
  );

  pop();
}


// --------------------------------------------------
// Controls
// --------------------------------------------------

function keyReleased() {

  // New composition

  if (
    key === "r" ||
    key === "R"
  ) {

    resetArtwork({
      newSeed: true,
      newPalette: false
    });
  }


  // New palette

  else if (
    key === "p" ||
    key === "P"
  ) {

    nextPalette();
  }


  // Brush toggle

  else if (
    key === "b" ||
    key === "B"
  ) {

    SETTINGS.render.brushEnabled =
      !SETTINGS.render.brushEnabled;

    resetArtwork({
      newSeed: false,
      newPalette: false
    });
  }


  // HUD toggle

  else if (
    key === "h" ||
    key === "H"
  ) {

    showHUD =
      !showHUD;
  }


  // Pause

  else if (
    key === "l" ||
    key === "L"
  ) {

    paused =
      !paused;

    if (paused) {
      noLoop();
    } else {
      loop();
    }
  }


  // Save

  else if (
    key === "s" ||
    key === "S"
  ) {

    saveCanvas(
      `spag-${paletteKey}-${seed}`,
      "png"
    );
  }


  // Delete / Backspace = regenerate

  else if (
    keyCode === DELETE ||
    keyCode === BACKSPACE
  ) {

    resetArtwork({
      newSeed: true,
      newPalette: false
    });
  }
}


// --------------------------------------------------
// Mouse
// --------------------------------------------------

function mousePressed() {

  resetArtwork({
    newSeed: true,
    newPalette: false
  });
}


// --------------------------------------------------
// Resize
// --------------------------------------------------

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  resetArtwork({
    newSeed: false,
    newPalette: false
  });
}