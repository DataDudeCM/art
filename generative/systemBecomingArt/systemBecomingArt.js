/*
    THE SYSTEM IS TRYING TO BECOME ART

    Order continually attempts to restore the grid.
    Disorder bends it, colors it, and leaves scars.

    CLICK  = inject corruption
    SPACE  = pause
    R      = reset
    S      = save image
*/

const COLS = 16;
const ROWS = 11;

let nodes = [];
let bursts = [];

let spacingX;
let spacingY;

let orderColor;
let palette = [];

let globalChaos = 0;

let paused = false;
let nextAutoBurst = 0;


// ------------------------------------------------------------
// SETUP
// ------------------------------------------------------------

function setup() {

  createCanvas(windowWidth, windowHeight);

  pixelDensity(1);

  colorMode(RGB, 255, 255, 255, 255);

  orderColor = color("#536878");

  palette = [
    color("#4CC9F0"), // electric blue
    color("#B8F2E6"), // pale cyan
    color("#FFB703"), // amber
    color("#FB5607"), // orange
    color("#F72585")  // magenta
  ];

  buildSystem();

  background(12, 14, 18);

  nextAutoBurst = millis() + 4000;
}


// ------------------------------------------------------------
// BUILD GRID
// ------------------------------------------------------------

function buildSystem() {

  nodes = [];
  bursts = [];

  const marginX = width * 0.08;
  const marginY = height * 0.10;

  spacingX = (width - marginX * 2) / (COLS - 1);
  spacingY = (height - marginY * 2) / (ROWS - 1);

  for (let row = 0; row < ROWS; row++) {

    for (let col = 0; col < COLS; col++) {

      const x = marginX + col * spacingX;
      const y = marginY + row * spacingY;

      nodes.push(
        new SystemNode(x, y, col, row)
      );
    }
  }
}


// ------------------------------------------------------------
// DRAW
// ------------------------------------------------------------

function draw() {

  // translucent clearing creates memory / residue
  background(12, 14, 18, 38);

  const seconds = millis() / 1000;

  /*
      Slow autonomous cycle.

      Starts near order,
      climbs toward chaos,
      then attempts to repair itself.
  */

  const phase = seconds * 0.16 - 1.0;

  let wave = (sin(phase) + 1) * 0.5;

  globalChaos = constrain(
    pow(wave, 1.7),
    0,
    1
  );


  // ----------------------------------------------------------
  // occasionally inject a spontaneous failure
  // ----------------------------------------------------------

  if (millis() > nextAutoBurst) {

    bursts.push(
      new CorruptionBurst(
        random(width * 0.15, width * 0.85),
        random(height * 0.15, height * 0.85)
      )
    );

    nextAutoBurst =
      millis() + random(7000, 14000);
  }


  // ----------------------------------------------------------
  // update corruption waves
  // ----------------------------------------------------------

  for (let i = bursts.length - 1; i >= 0; i--) {

    bursts[i].update();

    if (bursts[i].dead()) {
      bursts.splice(i, 1);
    }
  }


  // ----------------------------------------------------------
  // update nodes
  // ----------------------------------------------------------

  for (let node of nodes) {
    node.update();
  }


  // ----------------------------------------------------------
  // draw the relationships first
  // ----------------------------------------------------------

  drawGridConnections();


  // ----------------------------------------------------------
  // draw nodes / corrupted geometry
  // ----------------------------------------------------------

  for (let node of nodes) {
    node.display();
  }
}


// ------------------------------------------------------------
// NODE
// ------------------------------------------------------------

class SystemNode {

  constructor(x, y, col, row) {

    this.base = createVector(x, y);
    this.pos = createVector(x, y);

    this.velocity = createVector(0, 0);

    /*
        scar = permanent memory of previous corruption
    */

    this.scar = createVector(0, 0);

    this.col = col;
    this.row = row;

    this.seed = random(10000);

    this.localChaos = 0;
  }


  update() {

    let corruption = globalChaos;

    // Each point interprets chaos differently.
    let personality =
      map(
        noise(this.seed, frameCount * 0.004),
        0,
        1,
        0.25,
        1.4
      );

    corruption *= personality;


    // --------------------------------------------------------
    // corruption waves
    // --------------------------------------------------------

    for (let burst of bursts) {

      corruption += burst.forceAt(this.pos);
    }

    this.localChaos =
      constrain(corruption, 0, 1);


    // --------------------------------------------------------
    // generate imperfect target
    // --------------------------------------------------------

    let maxShift =
      min(spacingX, spacingY) * 0.48;

    let nx =
      noise(
        this.seed,
        frameCount * 0.006
      );

    let ny =
      noise(
        this.seed + 2000,
        frameCount * 0.006
      );

    let offsetX =
      map(nx, 0, 1, -maxShift, maxShift);

    let offsetY =
      map(ny, 0, 1, -maxShift, maxShift);


    let targetX =
      this.base.x +
      this.scar.x +
      offsetX * this.localChaos;

    let targetY =
      this.base.y +
      this.scar.y +
      offsetY * this.localChaos;


    // --------------------------------------------------------
    // ORDER fights back
    // --------------------------------------------------------

    let target =
      createVector(targetX, targetY);

    let force =
      p5.Vector.sub(target, this.pos);

    /*
       Ordered system = strong spring.

       Chaotic system = weak spring.
    */

    let spring =
      lerp(
        0.19,
        0.035,
        this.localChaos
      );

    force.mult(spring);

    this.velocity.add(force);
    this.velocity.mult(0.82);

    this.pos.add(this.velocity);


    // --------------------------------------------------------
    // HIGH CHAOS CAN PERMANENTLY DAMAGE THE GRID
    // --------------------------------------------------------

    if (
      this.localChaos > 0.82 &&
      random() < 0.0012
    ) {

      let scarAmount =
        map(
          this.localChaos,
          0.82,
          1,
          0,
          3
        );

      this.scar.add(
        random(-scarAmount, scarAmount),
        random(-scarAmount, scarAmount)
      );

      this.scar.limit(
        min(spacingX, spacingY) * 0.20
      );
    }
  }


  display() {

    const ch = this.localChaos;

    let artColor = palette[
      floor(
        noise(this.seed * 0.03) *
        palette.length
      )
    ];

    let c =
      lerpColor(
        orderColor,
        artColor,
        pow(ch, 1.4)
      );


    // --------------------------------------------------------
    // Corrective vector
    //
    // During lower chaos, the system visibly tries to
    // pull damaged points home.
    // --------------------------------------------------------

    if (
      globalChaos < 0.55 &&
      p5.Vector.dist(this.pos, this.base) > 4
    ) {

      stroke(90, 130, 150, 45);
      strokeWeight(0.7);

      line(
        this.pos.x,
        this.pos.y,
        this.base.x,
        this.base.y
      );
    }


    // --------------------------------------------------------
    // machine node
    // --------------------------------------------------------

    noStroke();

    c.setAlpha(
      lerp(135, 230, ch)
    );

    fill(c);

    let nodeSize =
      lerp(3, 7, ch);

    rectMode(CENTER);

    rect(
      this.pos.x,
      this.pos.y,
      nodeSize,
      nodeSize
    );


    // --------------------------------------------------------
    // art begins appearing around damaged points
    // --------------------------------------------------------

    if (
      ch > 0.38 &&
      noise(this.seed * 5.12) > 0.42
    ) {

      let size =
        lerp(
          8,
          min(spacingX, spacingY) * 0.65,
          ch
        );

      drawImperfectFrame(
        this,
        size,
        ch,
        artColor
      );
    }
  }
}


// ------------------------------------------------------------
// CONNECTIONS
// ------------------------------------------------------------

function drawGridConnections() {

  for (let row = 0; row < ROWS; row++) {

    for (let col = 0; col < COLS; col++) {

      const index =
        row * COLS + col;

      const node =
        nodes[index];


      // RIGHT
      if (col < COLS - 1) {

        drawConnection(
          node,
          nodes[index + 1]
        );
      }


      // DOWN
      if (row < ROWS - 1) {

        drawConnection(
          node,
          nodes[index + COLS]
        );
      }
    }
  }
}


// ------------------------------------------------------------
// STRAIGHT LINE -> CURVED LINE
// ------------------------------------------------------------

function drawConnection(a, b) {

  let chaos =
    (a.localChaos + b.localChaos) * 0.5;

  let artColor = palette[
    floor(
      noise(
        a.seed * 0.02,
        b.seed * 0.02
      ) * palette.length
    )
  ];

  let c =
    lerpColor(
      orderColor,
      artColor,
      pow(chaos, 1.5)
    );

  c.setAlpha(
    lerp(65, 180, chaos)
  );

  stroke(c);

  strokeWeight(
    lerp(
      0.6,
      1.8,
      chaos
    )
  );

  noFill();


  // nearly perfect
  if (chaos < 0.18) {

    line(
      a.pos.x,
      a.pos.y,
      b.pos.x,
      b.pos.y
    );

    return;
  }


  // ----------------------------------------------------------
  // calculate perpendicular direction
  // ----------------------------------------------------------

  let delta =
    p5.Vector.sub(b.pos, a.pos);

  let normal =
    createVector(
      -delta.y,
      delta.x
    );

  normal.normalize();


  let bendNoise =
    noise(
      a.seed * 0.01,
      b.seed * 0.01,
      frameCount * 0.004
    );

  let bend =
    map(
      bendNoise,
      0,
      1,
      -1,
      1
    );

  bend *=
    min(spacingX, spacingY) *
    chaos *
    0.85;


  // ----------------------------------------------------------
  // bezier control points
  // ----------------------------------------------------------

  let c1 =
    p5.Vector.lerp(
      a.pos,
      b.pos,
      0.33
    );

  let c2 =
    p5.Vector.lerp(
      a.pos,
      b.pos,
      0.66
    );

  c1.add(
    normal.x * bend,
    normal.y * bend
  );

  c2.add(
    normal.x * bend * -0.65,
    normal.y * bend * -0.65
  );


  bezier(
    a.pos.x,
    a.pos.y,

    c1.x,
    c1.y,

    c2.x,
    c2.y,

    b.pos.x,
    b.pos.y
  );
}


// ------------------------------------------------------------
// IMPERFECT ART RECTANGLE
//
// loosely inspired by the repeated displaced geometry
// of artrect()
// ------------------------------------------------------------

function drawImperfectFrame(
  node,
  size,
  chaos,
  frameColor
) {

  let passes =
    floor(
      map(
        chaos,
        0.38,
        1,
        1,
        5
      )
    );

  rectMode(CENTER);
  noFill();


  for (let p = 0; p < passes; p++) {

    let wobble =
      chaos * (2 + p * 1.2);

    let x1 =
      node.pos.x -
      size / 2 +
      random(-wobble, wobble);

    let y1 =
      node.pos.y -
      size / 2 +
      random(-wobble, wobble);

    let x2 =
      node.pos.x +
      size / 2 +
      random(-wobble, wobble);

    let y2 =
      node.pos.y -
      size / 2 +
      random(-wobble, wobble);

    let x3 =
      node.pos.x +
      size / 2 +
      random(-wobble, wobble);

    let y3 =
      node.pos.y +
      size / 2 +
      random(-wobble, wobble);

    let x4 =
      node.pos.x -
      size / 2 +
      random(-wobble, wobble);

    let y4 =
      node.pos.y +
      size / 2 +
      random(-wobble, wobble);


    frameColor.setAlpha(
      map(
        p,
        0,
        max(1, passes - 1),
        90,
        15
      )
    );

    stroke(frameColor);

    strokeWeight(
      random(0.4, 1.3)
    );


    beginShape();

    vertex(x1, y1);
    vertex(x2, y2);
    vertex(x3, y3);
    vertex(x4, y4);

    endShape(CLOSE);
  }
}


// ------------------------------------------------------------
// CORRUPTION WAVE
// ------------------------------------------------------------

class CorruptionBurst {

  constructor(x, y) {

    this.center =
      createVector(x, y);

    this.birth =
      millis();

    this.life = 5200;
  }


  update() {
    // the actual wave is calculated in forceAt()
  }


  forceAt(pos) {

    let age =
      millis() - this.birth;

    let normalizedAge =
      age / this.life;

    if (normalizedAge >= 1) {
      return 0;
    }


    let radius =
      normalizedAge *
      max(width, height) *
      0.85;

    let d =
      p5.Vector.dist(
        pos,
        this.center
      );


    /*
        Only points near the expanding ring
        get strongly corrupted.
    */

    let ringWidth = 130;

    let distanceFromWave =
      abs(d - radius);

    if (distanceFromWave > ringWidth) {
      return 0;
    }


    let force =
      map(
        distanceFromWave,
        0,
        ringWidth,
        0.9,
        0
      );


    // wave loses power as it ages

    force *=
      1 - normalizedAge * 0.55;

    return force;
  }


  dead() {

    return (
      millis() - this.birth >
      this.life
    );
  }
}


// ------------------------------------------------------------
// INTERACTION
// ------------------------------------------------------------

function mousePressed() {

  bursts.push(
    new CorruptionBurst(
      mouseX,
      mouseY
    )
  );
}


// ------------------------------------------------------------

function keyPressed() {

  if (key === " ") {

    paused = !paused;

    if (paused) {
      noLoop();
    } else {
      loop();
    }
  }


  if (key === "r" || key === "R") {

    buildSystem();

    background(12, 14, 18);
  }


  if (key === "s" || key === "S") {

    let stamp =
      year() + "-" +
      nf(month(), 2) + "-" +
      nf(day(), 2) + "_" +
      nf(hour(), 2) + "-" +
      nf(minute(), 2) + "-" +
      nf(second(), 2);

    saveCanvas(
      "System_Becoming_Art_" + stamp,
      "png"
    );
  }
}


// ------------------------------------------------------------

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  buildSystem();

  background(12, 14, 18);
}