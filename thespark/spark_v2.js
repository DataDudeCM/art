/*
    THE SPARK
    Generative artwork by Chris + ChatGPT

    One ignition moves through a dormant network.
    Nodes amplify, weaken, split, or mutate the energy.

    CONTROLS
    --------------------------------------------------
    mouse click : ignite a spark
    SPACE       : rebuild network
    S           : save image
*/

let nodes = [];
let pulses = [];

let paintLayer;

let NODE_COUNT = 450;
let CONNECTION_RADIUS = 125;

let fadeAmount = 5;

let sparkTimer = 0;
let nextSparkTime = 60;

let MAX_NODES = 850;

let GROWTH_CHANCE = 0.16;
let GROWTH_MIN_DISTANCE = 45;
let GROWTH_MAX_DISTANCE = 120;

function setup() {

  createCanvas(windowWidth, windowHeight);

  colorMode(HSB, 360, 100, 100, 100);
  strokeCap(ROUND);

  // Permanent artwork layer
  paintLayer = createGraphics(width, height);

  paintLayer.colorMode(
    HSB,
    360,
    100,
    100,
    100
  );

  paintLayer.strokeCap(ROUND);

  buildNetwork();

  background(225, 30, 4);
}


// ----------------------------------------------------
// DRAW
// ----------------------------------------------------

function draw() {

  // Clear only the animation screen
  background(225, 30, 4);

  // Redisplay everything painted so far
  image(paintLayer, 0, 0);

  updateNodes();
  updatePulses();


  if (pulses.length === 0) {

    sparkTimer++;

    if (sparkTimer > nextSparkTime) {

      igniteRandomSpark();

      sparkTimer = 0;

      nextSparkTime = random(45, 120);
    }

  } else {

    sparkTimer = 0;

  }
}


// ----------------------------------------------------
// NETWORK
// ----------------------------------------------------

function buildNetwork() {

  nodes = [];
  pulses = [];

  for (let i = 0; i < NODE_COUNT; i++) {

    let x = random(width * 0.07, width * 0.93);
    let y = random(height * 0.07, height * 0.93);

    nodes.push(new SparkNode(x, y));

  }

  // build neighbor relationships
  for (let a of nodes) {

    let candidates = [];

    for (let b of nodes) {

      if (a === b) continue;

      let d = dist(a.x, a.y, b.x, b.y);

      if (d < CONNECTION_RADIUS) {
        candidates.push({
          node: b,
          distance: d
        });
      }
    }

    // closest nodes first
    candidates.sort((p1, p2) => p1.distance - p2.distance);

    // each node gets only a few connections
    let connectionCount = floor(random(2, 5));

    for (
      let i = 0;
      i < min(connectionCount, candidates.length);
      i++
    ) {
      a.neighbors.push(candidates[i].node);
    }
  }

}


// ----------------------------------------------------
// NODE
// ----------------------------------------------------

class SparkNode {

  constructor(x, y) {

    this.x = x;
    this.y = y;

    this.neighbors = [];

    this.activation = 0;

    this.lastActivated = -1000;

    let r = random();

    if (r < 0.05) {
      this.type = "amplifier";
    }
    else if (r < 0.10) {
      this.type = "splitter";
    }
    else if (r < 0.15) {
      this.type = "damper";
    }
    else if (r < 0.20) {
      this.type = "mutator";
    }
    else {
      this.type = "normal";
    }

  }


activate(energy, hue) {

  // Prevent the spark from immediately cycling backward
  if (frameCount - this.lastActivated < 22) {
    return;
  }

  this.lastActivated = frameCount;

  this.activation = constrain(energy, 0, 1);

  let newEnergy = energy;
  let newHue = hue;


  // ---------------------------------------------
  // NODE PERSONALITIES
  // ---------------------------------------------

  if (this.type === "amplifier") {

    newEnergy *= 1.25;

    newHue += random(-12, 12);

  }


  if (this.type === "damper") {

    // Don't kill the spark quite so brutally
    newEnergy *= 0.72;

  }


  if (this.type === "mutator") {

    newHue += random(40, 140);

  }


  newHue = (newHue + 360) % 360;


  // Let extremely weak energy survive longer
  if (newEnergy < 0.035) return;


  let options = this.neighbors.filter(n =>
    frameCount - n.lastActivated > 22
  );


  if (options.length === 0) return;


  shuffle(options, true);


  // ---------------------------------------------
  // BRANCHING
  // ---------------------------------------------

  let branches = 1;


  // Healthy sparks frequently branch
  if (random() < newEnergy * 0.75) {
    branches++;
  }


  // Occasionally create another branch
  if (random() < newEnergy * 0.30) {
    branches++;
  }


  // Splitter nodes go nuts
  if (this.type === "splitter") {

    branches += floor(random(2, 4));

  }


  branches = min(
    branches,
    options.length
  );


  // ---------------------------------------------
  // PROPAGATE
  // ---------------------------------------------

  for (let i = 0; i < branches; i++) {

    let target = options[i];


    // Energy now survives much longer
    let loss = random(0.84, 0.98);


    pulses.push(

      new Pulse(
        this,
        target,
        newEnergy * loss,
        newHue
      )

    );

  }
  // ------------------------------------------------
  // OCCASIONALLY GROW INTO EMPTY SPACE
  // ------------------------------------------------

  if (
    newEnergy > 0.35 &&
    nodes.length < MAX_NODES &&
    random() < GROWTH_CHANCE
  ) {

    growNewNode(
      this,
      newEnergy,
      newHue
    );
  }

}


  update() {

    this.activation *= 0.94;

  }


  display() {

    if (this.activation <= 0.01) return;

    let size = 2 + this.activation * 12;

    let hue;

    switch (this.type) {

      case "amplifier":
        hue = 45;
        break;

      case "splitter":
        hue = 195;
        break;

      case "damper":
        hue = 0;
        break;

      case "mutator":
        hue = 285;
        break;

      default:
        hue = 35;
    }


    noStroke();


    // glow
    fill(
      hue,
      80,
      100,
      this.activation * 12
    );

    circle(
      this.x,
      this.y,
      size * 4
    );


    fill(
      hue,
      35,
      100,
      this.activation * 80
    );

    circle(
      this.x,
      this.y,
      size
    );

  }

}


// ----------------------------------------------------
// ENERGY PULSE
// ----------------------------------------------------

class Pulse {

  constructor(start, target, energy, hue) {

    this.start = start;
    this.target = target;

    this.energy = energy;

    this.hue = hue;
    this.hueDrift = random(-0.6, 0.6);

    this.progress = 0;
    this.previousProgress = 0;

    this.speed = random(0.018, 0.045);

    this.dead = false;

    // Bend the trajectory slightly
    let mx = (start.x + target.x) / 2;
    let my = (start.y + target.y) / 2;

    let angle = atan2(
      target.y - start.y,
      target.x - start.x
    );

    let bend = random(-30, 30);

    this.cx =
      mx +
      cos(angle + HALF_PI) * bend;

    this.cy =
      my +
      sin(angle + HALF_PI) * bend;
  }


  update() {

    this.previousProgress = this.progress;

    this.progress += this.speed;

    this.hue += this.hueDrift;

    this.hue = (this.hue + 360) % 360;


    if (this.progress >= 1) {

      this.progress = 1;

      this.paintArrival();

      this.target.activate(
        this.energy,
        this.hue
      );

      this.dead = true;
    }
  }


  display() {

    let t1 = this.previousProgress;
    let t2 = this.progress;


    let px =
      quadraticPoint(
        this.start.x,
        this.cx,
        this.target.x,
        t1
      );


    let py =
      quadraticPoint(
        this.start.y,
        this.cy,
        this.target.y,
        t1
      );


    let x =
      quadraticPoint(
        this.start.x,
        this.cx,
        this.target.x,
        t2
      );


    let y =
      quadraticPoint(
        this.start.y,
        this.cy,
        this.target.y,
        t2
      );


    // Permanently paint this section
    this.paintStroke(px, py, x, y);


    // -----------------------------------------
    // LIVE ENERGY GLOW
    // -----------------------------------------

    stroke(
      this.hue,
      80,
      100,
      10 * this.energy
    );

    strokeWeight(
      12 * this.energy
    );

    line(px, py, x, y);


    stroke(
      this.hue,
      60,
      100,
      35 * this.energy
    );

    strokeWeight(
      4 * this.energy
    );

    line(px, py, x, y);


    stroke(
      this.hue,
      10,
      100,
      95
    );

    strokeWeight(
      max(0.7, this.energy * 1.4)
    );

    line(px, py, x, y);


    noStroke();

    fill(
      this.hue,
      15,
      100,
      100
    );

    circle(
      x,
      y,
      2 + this.energy * 5
    );
  }


  // ------------------------------------------------
  // BRUSH LANGUAGE
  // ------------------------------------------------

  paintStroke(x1, y1, x2, y2) {

    let brush = this.target.type;


    // -------------------------------------
    // NORMAL
    // fine translucent filament
    // -------------------------------------

    if (brush === "normal") {

      paintLayer.stroke(
        this.hue,
        65,
        90,
        20
      );

      paintLayer.strokeWeight(
        0.6 + this.energy * 1.4
      );

      paintLayer.line(
        x1,
        y1,
        x2,
        y2
      );


      // subtle fuzzy duplicate

      paintLayer.stroke(
        this.hue,
        70,
        90,
        5
      );

      paintLayer.strokeWeight(
        5
      );

      paintLayer.line(
        x1 + random(-1, 1),
        y1 + random(-1, 1),
        x2 + random(-1, 1),
        y2 + random(-1, 1)
      );
    }


    // -------------------------------------
    // AMPLIFIER
    // thicker energetic paint
    // -------------------------------------

    else if (brush === "amplifier") {

      paintLayer.stroke(
        this.hue,
        75,
        100,
        8
      );

      paintLayer.strokeWeight(
        10 + this.energy * 8
      );

      paintLayer.line(
        x1,
        y1,
        x2,
        y2
      );


      paintLayer.stroke(
        this.hue,
        55,
        100,
        30
      );

      paintLayer.strokeWeight(
        2 + this.energy * 3
      );

      paintLayer.line(
        x1,
        y1,
        x2,
        y2
      );
    }


    // -------------------------------------
    // DAMPER
    // broken dry-brush texture
    // -------------------------------------

    else if (brush === "damper") {

      let steps = 4;

      for (let i = 0; i < steps; i++) {

        if (random() < 0.65) {

          let t = random();

          let x = lerp(x1, x2, t);
          let y = lerp(y1, y2, t);

          paintLayer.noStroke();

          paintLayer.fill(
            this.hue,
            40,
            70,
            random(5, 18)
          );

          paintLayer.circle(
            x + random(-3, 3),
            y + random(-3, 3),
            random(1, 4)
          );
        }
      }
    }


    // -------------------------------------
    // SPLITTER
    // several fine parallel filaments
    // -------------------------------------

    else if (brush === "splitter") {

      for (let i = 0; i < 3; i++) {

        let offset = random(-2.5, 2.5);

        paintLayer.stroke(
          this.hue + random(-8, 8),
          70,
          95,
          14
        );

        paintLayer.strokeWeight(
          random(0.4, 1.2)
        );

        paintLayer.line(
          x1 + offset,
          y1 + offset,
          x2 + offset,
          y2 + offset
        );
      }
    }


    // -------------------------------------
    // MUTATOR
    // richer chromatic stroke
    // -------------------------------------

    else if (brush === "mutator") {

      let secondHue =
        (this.hue + random(35, 100)) % 360;


      paintLayer.stroke(
        this.hue,
        80,
        100,
        18
      );

      paintLayer.strokeWeight(
        3
      );

      paintLayer.line(
        x1,
        y1,
        x2,
        y2
      );


      paintLayer.stroke(
        secondHue,
        75,
        100,
        12
      );

      paintLayer.strokeWeight(
        7
      );

      paintLayer.line(
        x1 + random(-2, 2),
        y1 + random(-2, 2),
        x2 + random(-2, 2),
        y2 + random(-2, 2)
      );
    }
  }


  // ------------------------------------------------
  // MARK MADE WHEN A NODE IS REACHED
  // ------------------------------------------------

  paintArrival() {

    let x = this.target.x;
    let y = this.target.y;


    if (this.target.type === "amplifier") {

      paintLayer.noStroke();

      for (let r = 30; r > 2; r -= 5) {

        paintLayer.fill(
          this.hue,
          60,
          100,
          2.5
        );

        paintLayer.circle(
          x,
          y,
          r * this.energy
        );
      }
    }


    else if (this.target.type === "splitter") {

      paintLayer.noStroke();

      for (let i = 0; i < 12; i++) {

        let angle = random(TAU);

        let d = random(3, 15);

        paintLayer.fill(
          this.hue,
          70,
          100,
          random(8, 25)
        );

        paintLayer.circle(
          x + cos(angle) * d,
          y + sin(angle) * d,
          random(0.5, 2.5)
        );
      }
    }


    else if (this.target.type === "mutator") {

      paintLayer.noFill();

      paintLayer.stroke(
        this.hue,
        70,
        100,
        20
      );

      paintLayer.strokeWeight(1);

      paintLayer.circle(
        x,
        y,
        random(8, 25)
      );
    }


    else if (this.target.type === "damper") {

      paintLayer.noStroke();

      paintLayer.fill(
        this.hue,
        20,
        50,
        12
      );

      paintLayer.circle(
        x,
        y,
        random(3, 8)
      );
    }
  }
}


// ----------------------------------------------------
// UPDATE
// ----------------------------------------------------

function updatePulses() {

  for (let i = pulses.length - 1; i >= 0; i--) {

    pulses[i].update();

    pulses[i].display();

    if (pulses[i].dead) {
      pulses.splice(i, 1);
    }

  }

}


function updateNodes() {

  for (let node of nodes) {

    node.update();

    node.display();

  }

}


// ----------------------------------------------------
// SUBTLE DORMANT STRUCTURE
// ----------------------------------------------------

function drawDormantNetwork() {

  strokeWeight(0.5);

  for (let node of nodes) {

    for (let neighbor of node.neighbors) {

      let d = dist(
        node.x,
        node.y,
        neighbor.x,
        neighbor.y
      );

      let alpha = map(
        d,
        0,
        CONNECTION_RADIUS,
        3,
        0
      );

      stroke(
        210,
        20,
        60,
        alpha
      );

      line(
        node.x,
        node.y,
        neighbor.x,
        neighbor.y
      );

    }

  }

}


// ----------------------------------------------------
// IGNITION
// ----------------------------------------------------

function igniteRandomSpark() {

  let node = random(nodes);

  let hue = random([
    32,
    42,
    190,
    205
  ]);

  node.activation = 1;

  node.activate(
    random(0.8, 1),
    hue
  );

}


function igniteAt(x, y) {

  let closest = null;
  let bestDistance = Infinity;

  for (let node of nodes) {

    let d = dist(
      x,
      y,
      node.x,
      node.y
    );

    if (d < bestDistance) {

      bestDistance = d;
      closest = node;

    }

  }


  if (closest) {

    closest.lastActivated = -1000;

    closest.activate(
      1,
      random(20, 210)
    );

  }

}

function growNewNode(source, energy, hue) {

  // Noise gives growth some coherent directional tendency
  let noiseAngle =
    noise(
      source.x * 0.003,
      source.y * 0.003,
      frameCount * 0.002
    ) * TAU * 2;


  let angle =
    noiseAngle +
    random(-0.8, 0.8);


  let distance =
    random(
      GROWTH_MIN_DISTANCE,
      GROWTH_MAX_DISTANCE
    );


  let x =
    source.x +
    cos(angle) * distance;


  let y =
    source.y +
    sin(angle) * distance;


  // Don't grow offscreen
  if (
    x < 20 ||
    x > width - 20 ||
    y < 20 ||
    y > height - 20
  ) {
    return;
  }


  // Avoid putting new nodes directly on top of old ones
  let closestDistance = Infinity;


  for (let node of nodes) {

    let d =
      dist(
        x,
        y,
        node.x,
        node.y
      );

    closestDistance =
      min(
        closestDistance,
        d
      );
  }


  if (closestDistance < 30) {
    return;
  }


  // Create the new node
  let newNode =
    new SparkNode(
      x,
      y
    );


  nodes.push(newNode);


  // Connect the parent to the child
  source.neighbors.push(newNode);

  newNode.neighbors.push(source);


  // Connect to a couple nearby existing nodes
  let nearby =
    nodes
      .filter(n =>
        n !== newNode &&
        n !== source
      )
      .map(n => ({
        node: n,
        distance: dist(
          x,
          y,
          n.x,
          n.y
        )
      }))
      .filter(o =>
        o.distance <
        CONNECTION_RADIUS
      )
      .sort(
        (a, b) =>
          a.distance -
          b.distance
      );


  for (
    let i = 0;
    i < min(2, nearby.length);
    i++
  ) {

    newNode.neighbors.push(
      nearby[i].node
    );
  }


  // Send energy into the newly created territory
  pulses.push(

    new Pulse(
      source,
      newNode,
      energy * 0.85,
      hue
    )

  );
}

// ----------------------------------------------------
// QUADRATIC CURVE HELPER
// ----------------------------------------------------

function quadraticPoint(a, b, c, t) {

  let mt = 1 - t;

  return (
    mt * mt * a +
    2 * mt * t * b +
    t * t * c
  );

}


// ----------------------------------------------------
// INPUT
// ----------------------------------------------------

function mousePressed() {

  igniteAt(
    mouseX,
    mouseY
  );

}


function keyReleased() {

  if (key === " ") {

    background(225, 30, 4);

    buildNetwork();

    igniteRandomSpark();

  }


if (key === "s" || key === "S") {

    console.log("SAVE pressed:", millis());

  let timestamp =
    year() + "-" +
    nf(month(), 2) + "-" +
    nf(day(), 2) + "_" +
    nf(hour(), 2) + "-" +
    nf(minute(), 2) + "-" +
    nf(second(), 2) + "_" +
    millis();

  saveCanvas(
    "TheSpark_" + timestamp,
    "png"
  );
}

  if (key === "c" || key === "C") {

    paintLayer.clear();

  }

  if (key === " ") {

    igniteRandomSpark();

  }

  if (key === "r" || key === "R") {

    paintLayer.clear();

    buildNetwork();

    background(225, 30, 4);

  }

}


// ----------------------------------------------------
// RESIZE
// ----------------------------------------------------

function windowResized() { 

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  buildNetwork();

  background(225, 30, 4);

}