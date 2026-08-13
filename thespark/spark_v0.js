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

let NODE_COUNT = 450;
let CONNECTION_RADIUS = 125;

let fadeAmount = 5;

let sparkTimer = 0;
let nextSparkTime = 60;

function setup() {
  createCanvas(windowWidth, windowHeight);

  colorMode(HSB, 360, 100, 100, 100);

  strokeCap(ROUND);

  buildNetwork();

  background(225, 30, 4);
}


// ----------------------------------------------------
// DRAW
// ----------------------------------------------------

function draw() {

  // translucent background creates persistence
  noStroke();
  fill(225, 30, 4, fadeAmount);
  rect(0, 0, width, height);

  drawDormantNetwork();

  updateNodes();

  updatePulses();

  // automatic ignition after system becomes quiet
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

    this.progress = 0;

    this.speed = random(0.018, 0.045);

    this.dead = false;


    // bend creates a slightly organic path

    let mx = (start.x + target.x) / 2;
    let my = (start.y + target.y) / 2;

    let angle = atan2(
      target.y - start.y,
      target.x - start.x
    );

    let bend = random(-25, 25);

    this.cx =
      mx +
      cos(angle + HALF_PI) * bend;

    this.cy =
      my +
      sin(angle + HALF_PI) * bend;

  }


  update() {

    this.progress += this.speed;


    if (this.progress >= 1) {

      this.target.activate(
        this.energy,
        this.hue
      );

      this.dead = true;

    }

  }


  display() {

    let t = constrain(this.progress, 0, 1);


    let x =
      quadraticPoint(
        this.start.x,
        this.cx,
        this.target.x,
        t
      );


    let y =
      quadraticPoint(
        this.start.y,
        this.cy,
        this.target.y,
        t
      );


    let previousT = max(0, t - 0.18);


    let px =
      quadraticPoint(
        this.start.x,
        this.cx,
        this.target.x,
        previousT
      );


    let py =
      quadraticPoint(
        this.start.y,
        this.cy,
        this.target.y,
        previousT
      );


    // outer glow

    stroke(
      this.hue,
      80,
      100,
      18 * this.energy
    );

    strokeWeight(
      12 * this.energy
    );

    line(px, py, x, y);


    // medium glow

    stroke(
      this.hue,
      70,
      100,
      45 * this.energy
    );

    strokeWeight(
      4 * this.energy
    );

    line(px, py, x, y);


    // bright core

    stroke(
      this.hue,
      20,
      100,
      90
    );

    strokeWeight(
      max(0.7, 1.4 * this.energy)
    );

    line(px, py, x, y);


    // spark head

    noStroke();

    fill(
      this.hue,
      20,
      100,
      100
    );

    circle(
      x,
      y,
      2 + this.energy * 4
    );

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


function keyPressed() {

  if (key === " ") {

    background(225, 30, 4);

    buildNetwork();

    igniteRandomSpark();

  }


  if (key === "s" || key === "S") {

    saveCanvas(
      "TheSpark-" + Date.now(),
      "png"
    );

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