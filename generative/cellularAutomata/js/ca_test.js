// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com
//
// 1D (elementary) cellular automaton, extended to record a lightWand frame
// sequence: each generation is one frame, its 100 cells are the 100 LEDs.
// See docs/wand-capture.md. Press S to save early.

// ── Settings ──────────────────────────────────────────────────────────────────

const RULE = 90; // any elementary rule, 0-255 (try 30, 90, 110, 184)
const FRAMES = 400; // generations to record = frames on the wand
const FPS = 40; // wand playback speed (400 frames at 40 fps = 10 s)
const START = "center"; // "center" (one live cell) or "random"
const SEED = 42; // used by the random start

const ON = [255, 255, 255];
const OFF = [0, 0, 0];

// ──────────────────────────────────────────────────────────────────────────────

// Array of cells
let cells;
// Starting at generation 0
let generation = 0;
// Cell size: 1000 px / 10 px = 100 cells, one per LED
let w = 10;
let ruleset;
let capture;

function setup() {
  createCanvas(1000, 1000);
  pixelDensity(1);
  noStroke();
  background(OFF);
  randomSeed(SEED);

  ruleset = rulesetFromNumber(RULE);

  //{!5} An array of 0s and 1s
  cells = new Array(floor(width / w));
  for (let i = 0; i < cells.length; i++) {
    cells[i] = START === "random" ? floor(random(2)) : 0;
  }
  if (START === "center") {
    cells[floor(cells.length / 2)] = 1;
  }

  capture = new WandCapture({
    name: `rule${RULE}`,
    fps: FPS,
    frames: FRAMES,
    seed: SEED,
    params: { rule: RULE, start: START, cells: cells.length }
  });
}

function draw() {
  // The display wraps to the top when it reaches the bottom; each row is
  // fully redrawn, so old generations are overwritten.
  const y = (generation % floor(height / w)) * w;

  for (let i = 0; i < cells.length; i++) {
    fill(cells[i] == 1 ? ON : OFF);
    square(i * w, y, w);
  }

  // This generation is one wand frame.
  capture.add(cells.map(c => (c == 1 ? ON : OFF)));

  //{!7} Compute the next generation.
  let nextgen = cells.slice();
  for (let i = 1; i < cells.length - 1; i++) {
    let left = cells[i - 1];
    let me = cells[i];
    let right = cells[i + 1];
    nextgen[i] = rules(left, me, right);
  }
  cells = nextgen;

  //{!1} The next generation
  generation++;

  // Stop once the sequence is recorded (it saves automatically).
  if (capture.isFull) {
    noLoop();
  }
}

function keyPressed() {
  if (key == "s" || key == "S") {
    capture.save();
    noLoop();
  }
}

//{!4} Look up a new state from the ruleset.
function rules(a, b, c) {
  let s = "" + a + b + c;
  let index = parseInt(s, 2);
  return ruleset[7 - index];
}

// Rule number -> ruleset, in the order rules() expects: ruleset[0] is the
// new state for neighbourhood 111, ruleset[7] for 000.
// Rule 90 gives [0, 1, 0, 1, 1, 0, 1, 0].
function rulesetFromNumber(n) {
  let set = [];
  for (let k = 0; k < 8; k++) {
    set.push((n >> (7 - k)) & 1);
  }
  return set;
}
