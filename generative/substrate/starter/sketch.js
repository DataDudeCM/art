// Substrate: walkers grow straight lines, branch at right or 45-degree
// angles, and stop when they would run into a line or the canvas edge.
//
// Starter adapted from Chris's art/generative/substrate/js/substrate.js:
// the sliders, colour picker and mouse/key handlers became PARAMS, the
// seed is fixed per run, collisions test "differs from the background",
// and several sweeps run per frame so a render finishes in seconds.
//
// The studio replaces the PARAMS and SEED values between the markers.

const PARAMS = /*PARAMS*/ {
  "numWalkers": 2,
  "spawnChance": 0.02,
  "startAlpha": 20,
  "wobble": 0.01,
  "startAtEdge": false,
  "lookAheadDistance": 5,
  "spawnChanceDecay": 0.85,
  "acuteAngleChance": 0.2,
  "startWidth": 5,
  "widthDecay": 0.8,
  "glowFade": 5,
  "glowLengthRatio": 0.75,
  "startGlowLength": 15,
  "whiskerAngle": 15
} /*END PARAMS*/;

const SEED = /*SEED*/ 1 /*END SEED*/;

// Not for tuning: the original's monochrome colours and the render size.
const LINE_COLOR = "#2c3e50";
const BACKGROUND_COLOR = "#ffffff";
const CANVAS_SIZE = 1000;      // the original's 1080 is wider than the renderer's 1000 px window
const SWEEPS_PER_FRAME = 40;   // walker updates per frame (the original: 1)
const MAX_SWEEPS = 20000;      // safety stop

const sketch = (p) => {
  let walkers = [];
  let sweep = 0;               // replaces frameCount in the wobble noise
  let backgroundColor, lineColor;

  class Walker {
    constructor(x, y, direction, width, spawnChance, branchAngle, glowLength, lastBranchPoint) {
      this.pos = p.createVector(x, y);
      this.dir = direction;
      this.width = width;
      this.spawnChance = spawnChance;
      this.isDone = false;
      this.branchAngle = branchAngle;
      this.glowLength = glowLength;
      this.lastBranchPoint = lastBranchPoint;
      this.noiseSeed = p.random(1000);
    }

    update() {
      if (this.isDone) return;

      if (PARAMS.wobble > 0) {
        let noiseValue = (p.noise(this.noiseSeed + sweep * 0.01) - 0.5) * 2;
        this.dir.rotate(noiseValue * PARAMS.wobble);
      }

      if (this.checkCollision() || this.width < 0.5) {
        this.isDone = true;
        return;
      }

      this.pos.add(this.dir);

      p.strokeWeight(this.width);
      p.stroke(lineColor);
      p.point(this.pos.x, this.pos.y);

      this.drawGradientLine();

      if (p.random(1) < this.spawnChance && this.width > 0.5) {
        this.spawn();
      }
    }

    // Three "whiskers" look ahead; a probe that leaves the canvas or lands
    // on anything not background-coloured counts as a collision.
    checkCollision() {
      const whiskerAngle = p.radians(PARAMS.whiskerAngle);
      let probes = [
        this.dir.copy(),
        this.dir.copy().rotate(whiskerAngle),
        this.dir.copy().rotate(-whiskerAngle),
      ];

      for (let probeDir of probes) {
        let probePos = p5.Vector.add(this.pos, p5.Vector.mult(probeDir, PARAMS.lookAheadDistance));

        if (probePos.x < 0 || probePos.x >= p.width || probePos.y < 0 || probePos.y >= p.height) {
          return true;
        }

        if (differsFromBackground(p.get(probePos.x, probePos.y))) {
          return true;
        }
      }
      return false;
    }

    drawGradientLine() {
      if (PARAMS.startAlpha < 1 || this.glowLength < 1 || this.width < 1) return;

      const rotation = p.HALF_PI * Math.sign(this.branchAngle);
      let perpDir = this.dir.copy().rotate(rotation);

      p.strokeWeight(1);

      for (let i = 0; i < this.glowLength; i++) {
        let progress = i / this.glowLength;
        let alpha = PARAMS.startAlpha * p.pow(1.0 - progress, PARAMS.glowFade);
        if (alpha < 1) continue;

        let pixelPos = p5.Vector.add(this.pos, p5.Vector.mult(perpDir, i));
        p.stroke(p.red(lineColor), p.green(lineColor), p.blue(lineColor), alpha);
        p.point(pixelPos.x, pixelPos.y);
      }
    }

    spawn() {
      const childGlowLength = this.pos.dist(this.lastBranchPoint) * PARAMS.glowLengthRatio;

      let angle;
      if (p.random(1) < PARAMS.acuteAngleChance) {
        angle = (p.random(1) < 0.5) ? p.QUARTER_PI : -p.QUARTER_PI;
      } else {
        angle = (p.random(1) < 0.5) ? p.HALF_PI : -p.HALF_PI;
      }

      let newDir = this.dir.copy().rotate(angle);
      walkers.push(new Walker(
        this.pos.x, this.pos.y, newDir,
        this.width * PARAMS.widthDecay,
        this.spawnChance * PARAMS.spawnChanceDecay,
        angle, childGlowLength, this.pos.copy(),
      ));
      this.lastBranchPoint = this.pos.copy();
    }
  }

  // The original tested brightness < 95 (every channel below 242), which
  // only works on white. This is the same test against any background:
  // every channel more than 13 away from it. Faint glow doesn't count.
  function differsFromBackground(c) {
    return Math.abs(c[0] - p.red(backgroundColor)) > 13
      && Math.abs(c[1] - p.green(backgroundColor)) > 13
      && Math.abs(c[2] - p.blue(backgroundColor)) > 13;
  }

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.pixelDensity(1);
    p.colorMode(p.RGB, 255, 255, 255, 50);
    p.randomSeed(SEED);
    p.noiseSeed(SEED);

    backgroundColor = p.color(BACKGROUND_COLOR);
    lineColor = p.color(LINE_COLOR);
    p.background(backgroundColor);

    for (let i = 0; i < PARAMS.numWalkers; i++) {
      let startX, startY, startDir;

      if (!PARAMS.startAtEdge) {
        startX = p.random(p.width);
        startY = p.random(p.height);
        startDir = p.createVector(p.random(-0.5, 0.5), p.random(-0.5, 0.5));
        startDir.normalize();
        let startPos = p.createVector(startX, startY);
        // An extra walker in the opposite direction.
        let opposite = p.createVector(-startDir.x, -startDir.y);
        walkers.push(new Walker(startX, startY, opposite, PARAMS.startWidth, PARAMS.spawnChance, p.HALF_PI, PARAMS.startGlowLength, startPos.copy()));
        walkers.push(new Walker(startX, startY, startDir, PARAMS.startWidth, PARAMS.spawnChance, p.HALF_PI, PARAMS.startGlowLength, startPos.copy()));
      } else {
        const edge = p.floor(p.random(4));

        if (edge === 0) {          // top
          startX = p.random(p.width); startY = 1;
          startDir = p.createVector(p.random(-0.5, 0.5), 1);
        } else if (edge === 1) {   // right
          startX = p.width - 1; startY = p.random(p.height);
          startDir = p.createVector(-1, p.random(-0.5, 0.5));
        } else if (edge === 2) {   // bottom
          startX = p.random(p.width); startY = p.height - 1;
          startDir = p.createVector(p.random(-0.5, 0.5), -1);
        } else {                   // left
          startX = 1; startY = p.random(p.height);
          startDir = p.createVector(1, p.random(-0.5, 0.5));
        }
        startDir.normalize();
        walkers.push(new Walker(startX, startY, startDir, PARAMS.startWidth, PARAMS.spawnChance, p.HALF_PI, PARAMS.startGlowLength, p.createVector(startX, startY)));
      }
    }
  };

  p.draw = () => {
    for (let s = 0; s < SWEEPS_PER_FRAME; s++) {
      sweep++;
      for (let walker of walkers) {
        walker.update();
      }
      if (walkers.every(w => w.isDone) || sweep >= MAX_SWEEPS) {
        p.noLoop();
        window.studioDone = true;   // tells the studio's renderer it can screenshot
        return;
      }
    }
  };
};

new p5(sketch);
