const ART_WIDTH = 1100;
const ART_HEIGHT = 800;

const AGENT_COUNT = 50;

let SHOW_AGENTS = true;


let agents = [];

let markLayer;

let seed;


// --------------------------------------------------
// SETUP
// --------------------------------------------------

function setup() {

  createCanvas(
    ART_WIDTH,
    ART_HEIGHT
  );


  pixelDensity(1);


  markLayer = createGraphics(
    ART_WIDTH,
    ART_HEIGHT
  );


  initializeMarkSystem();


  seed =
    floor(
      Math.random() * 1000000
    );


  generate(seed);
}


// --------------------------------------------------
// DRAW
// --------------------------------------------------

function draw() {

  // Paper stays fixed.
  background(paperColor);


  for (const agent of agents) {
    agent.update();

    if (SHOW_AGENTS) {
      agent.show();
    }
  }


  detectEncounters(agents);


  image(
    markLayer,
    0,
    0
  );
}


// --------------------------------------------------
// GENERATION
// --------------------------------------------------

function generate(newSeed) {

  seed = newSeed;


  randomSeed(seed);
  noiseSeed(seed);


  encounterHistory.clear();


  markLayer.clear();


  agents = [];


  for (
    let i = 0;
    i < AGENT_COUNT;
    i++
  ) {

    agents.push(
      new Agent(i)
    );
  }


  drawPaperVariation();


  updateStatus();


  console.log(
    `Evidence of Encounter seed: ${seed}`
  );
}


// --------------------------------------------------
// PAPER
//
// Just enough variation to stop the surface from
// looking like a flat browser background.
//
// This is NOT supposed to become the interesting
// part of v0.1.
// --------------------------------------------------

function drawPaperVariation() {

  markLayer.push();


  for (let i = 0; i < 5000; i++) {

    const x =
      random(width);

    const y =
      random(height);


    const c =
      color(80, 65, 45);

    c.setAlpha(
      random(1, 5)
    );


    markLayer.stroke(c);

    markLayer.strokeWeight(
      random(0.3, 0.9)
    );

    markLayer.point(
      x,
      y
    );
  }


  markLayer.pop();
}


// --------------------------------------------------
// CONTROLS
// --------------------------------------------------

function keyPressed() {

  if (
    key === "r" ||
    key === "R"
  ) {

    const newSeed =
      floor(
        Math.random() * 1000000
      );

    generate(newSeed);
  }


    if (
    key === "a" ||
    key === "A"
  ) {
    SHOW_AGENTS = !SHOW_AGENTS

  }


  if (
    key === "s" ||
    key === "S"
  ) {

    saveCanvas(
      `evidence-of-encounter-${seed}`,
      "png"
    );
  }
}


// --------------------------------------------------
// STATUS
// --------------------------------------------------

function updateStatus() {

  const seedDisplay =
    document.getElementById(
      "seedValue"
    );


  if (seedDisplay) {
    seedDisplay.textContent = seed;
  }
}