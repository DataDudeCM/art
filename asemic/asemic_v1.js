/*
    ASEMIC MACHINE
    -------------------------

    A machine endlessly inventing a language
    nobody can actually read.

    SPACE  pause / resume
    R      reset
    S      save
    D      toggle diagrams

    CLICK  inject a dense thought / annotation
*/


let writers = [];
let currentWriter;

let cursorX;
let cursorY;

let marginX;
let marginY;

let lineHeight = 42;

let paused = false;
let diagramsEnabled = true;

let paperColor;
let inkColor;

let wordCounter = 0;
let lineCounter = 0;


// ---------------------------------------------------------
// SETUP
// ---------------------------------------------------------

function setup() {

  createCanvas(windowWidth, windowHeight);

  pixelDensity(1);

  colorMode(RGB, 255, 255, 255, 255);

  paperColor = color(235, 231, 218);
  inkColor = color(28, 30, 31);

  background(paperColor);

  marginX = width * 0.07;
  marginY = height * 0.08;

  createWriters();

  currentWriter = random(writers);

  cursorX = marginX;
  cursorY = marginY;

  drawPaperTexture();

  frameRate(30);
}


// ---------------------------------------------------------
// WRITER PERSONALITIES
// ---------------------------------------------------------

function createWriters() {

  writers = [

    {
      name: "MECHANICAL",

      slant: 0,
      jitter: 0.7,

      minGlyphs: 2,
      maxGlyphs: 5,

      scaleMin: 0.75,
      scaleMax: 1.05,

      strokeWeight: 1.1,

      angular: 0.9,
      loops: 0.15,

      spacing: 8,

      color: color(24, 28, 31, 205)
    },


    {
      name: "ELEGANT",

      slant: -0.20,
      jitter: 1.2,

      minGlyphs: 3,
      maxGlyphs: 8,

      scaleMin: 0.9,
      scaleMax: 1.35,

      strokeWeight: 0.9,

      angular: 0.2,
      loops: 0.85,

      spacing: 11,

      color: color(35, 34, 32, 190)
    },


    {
      name: "ANXIOUS",

      slant: 0.16,
      jitter: 3.4,

      minGlyphs: 4,
      maxGlyphs: 10,

      scaleMin: 0.55,
      scaleMax: 0.95,

      strokeWeight: 0.75,

      angular: 0.55,
      loops: 0.35,

      spacing: 4,

      color: color(40, 39, 36, 170)
    },


    {
      name: "OBSESSIVE",

      slant: 0.05,
      jitter: 1.4,

      minGlyphs: 5,
      maxGlyphs: 11,

      scaleMin: 0.65,
      scaleMax: 1.1,

      strokeWeight: 0.8,

      angular: 0.45,
      loops: 0.55,

      spacing: 5,

      color: color(32, 32, 30, 175)
    },


    {
      name: "ARCHITECT",

      slant: 0,
      jitter: 0.5,

      minGlyphs: 1,
      maxGlyphs: 4,

      scaleMin: 0.7,
      scaleMax: 1.0,

      strokeWeight: 0.8,

      angular: 0.95,
      loops: 0.08,

      spacing: 14,

      color: color(42, 45, 46, 185)
    }

  ];
}


// ---------------------------------------------------------
// DRAW
// ---------------------------------------------------------

function draw() {

  /*
      Don't clear the canvas.

      The manuscript accumulates forever.
  */

  let marksThisFrame = 2;

  for (let i = 0; i < marksThisFrame; i++) {

    machineWrite();
  }
}


// ---------------------------------------------------------
// MACHINE WRITING
// ---------------------------------------------------------

function machineWrite() {

  // Occasionally change writer mid-page.

  if (random() < 0.012) {

    currentWriter = random(writers);
  }


  // Architect likes inserting diagrams.

  if (
    diagramsEnabled &&
    (
      currentWriter.name === "ARCHITECT" &&
      random() < 0.12
    )
  ) {

    drawMachineDiagram(cursorX, cursorY);

    cursorX += random(80, 160);

    checkCursor();

    return;
  }


  // Occasionally insert punctuation-like marks.

  if (random() < 0.045) {

    drawNotation(cursorX, cursorY);

    cursorX += random(14, 28);

    checkCursor();

    return;
  }


  let wordWidth = drawWord(

    cursorX,

    cursorY,

    currentWriter
  );


  cursorX +=
    wordWidth +
    currentWriter.spacing +
    random(4, 16);


  wordCounter++;


  // Obsessive writer occasionally crosses things out.

  if (
    currentWriter.name === "OBSESSIVE" &&
    random() < 0.08
  ) {

    scribbleCorrection(

      cursorX - wordWidth,

      cursorY,

      wordWidth
    );
  }


  checkCursor();
}


// ---------------------------------------------------------
// WORD
// ---------------------------------------------------------

function drawWord(x, y, writer) {

  let glyphCount = floor(

    random(
      writer.minGlyphs,
      writer.maxGlyphs + 1
    )

  );


  let totalWidth = 0;


  for (let i = 0; i < glyphCount; i++) {

    let glyphScale = random(

      writer.scaleMin,
      writer.scaleMax
    );


    let glyphWidth =
      drawGlyph(

        x + totalWidth,

        y,

        glyphScale,

        writer
      );


    totalWidth +=
      glyphWidth +
      random(1, 5);
  }


  // underline / semantic emphasis

  if (random() < 0.025) {

    push();

    stroke(writer.color);

    strokeWeight(0.7);

    let underlineY =
      y + random(18, 23);

    drawHumanLine(

      x,

      underlineY,

      x + totalWidth,

      underlineY,

      1.4
    );

    pop();
  }


  return totalWidth;
}


// ---------------------------------------------------------
// GLYPH
// ---------------------------------------------------------

function drawGlyph(x, baseline, scaleAmount, writer) {

  push();

  translate(x, baseline);

  scale(scaleAmount);


  let glyphWidth = random(9, 20);
  let glyphHeight = random(14, 29);


  stroke(writer.color);

  strokeWeight(writer.strokeWeight);

  noFill();


  // Every glyph gets a stable-ish grammar category.

  let glyphType = floor(random(8));


  switch (glyphType) {

    case 0:

      glyphStem(
        glyphWidth,
        glyphHeight,
        writer
      );

      break;


    case 1:

      glyphHook(
        glyphWidth,
        glyphHeight,
        writer
      );

      break;


    case 2:

      glyphLoop(
        glyphWidth,
        glyphHeight,
        writer
      );

      break;


    case 3:

      glyphBranch(
        glyphWidth,
        glyphHeight,
        writer
      );

      break;


    case 4:

      glyphWave(
        glyphWidth,
        glyphHeight,
        writer
      );

      break;


    case 5:

      glyphMachine(
        glyphWidth,
        glyphHeight,
        writer
      );

      break;


    case 6:

      glyphCompound(
        glyphWidth,
        glyphHeight,
        writer
      );

      break;


    default:

      glyphMinimal(
        glyphWidth,
        glyphHeight,
        writer
      );

  }


  // occasional accent

  if (random() < 0.18) {

    drawAccent(
      glyphWidth,
      glyphHeight
    );
  }


  pop();


  return glyphWidth * scaleAmount;
}


// ---------------------------------------------------------
// GLYPH TYPES
// ---------------------------------------------------------

function glyphStem(w, h, writer) {

  let slant =
    writer.slant * h;

  drawHumanLine(

    0,
    0,

    slant,
    -h,

    writer.jitter
  );


  if (random() < 0.6) {

    drawHumanLine(

      slant,
      -h * random(0.25, 0.75),

      w,
      -h * random(0.2, 0.8),

      writer.jitter
    );
  }
}



// ---------------------------------------------------------

function glyphHook(w, h, writer) {

  beginShape();

  let steps = 9;

  for (let i = 0; i <= steps; i++) {

    let t = i / steps;

    let px =
      t * w +
      sin(t * PI) * w * 0.35;

    let py =
      -t * h +
      sin(t * TWO_PI) * h * 0.08;

    px += random(
      -writer.jitter,
      writer.jitter
    );

    py += random(
      -writer.jitter,
      writer.jitter
    );

    curveVertex(px, py);
  }

  endShape();
}



// ---------------------------------------------------------

function glyphLoop(w, h, writer) {

  if (random() > writer.loops) {

    glyphStem(w, h, writer);

    return;
  }


  let cx = w * 0.45;
  let cy = -h * 0.45;


  beginShape();

  let steps = 18;

  for (let i = 0; i <= steps; i++) {

    let a =
      map(
        i,
        0,
        steps,
        -HALF_PI,
        TWO_PI + HALF_PI
      );

    let px =
      cx +
      cos(a) * w * 0.45;

    let py =
      cy +
      sin(a) * h * 0.35;


    px += random(
      -writer.jitter,
      writer.jitter
    );

    py += random(
      -writer.jitter,
      writer.jitter
    );


    curveVertex(px, py);
  }

  endShape();
}



// ---------------------------------------------------------

function glyphBranch(w, h, writer) {

  let stemX =
    random(w * 0.1, w * 0.4);


  drawHumanLine(

    stemX,
    0,

    stemX + writer.slant * h,
    -h,

    writer.jitter
  );


  let branches =
    floor(random(2, 5));


  for (let i = 0; i < branches; i++) {

    let yy =
      -random(h * 0.15, h * 0.9);


    drawHumanLine(

      stemX,
      yy,

      random(w * 0.5, w),
      yy + random(-5, 5),

      writer.jitter
    );
  }
}



// ---------------------------------------------------------

function glyphWave(w, h, writer) {

  beginShape();

  let steps = 12;

  for (let i = 0; i <= steps; i++) {

    let t = i / steps;

    let px =
      t * w;

    let py =
      -h * 0.5 +
      sin(t * TWO_PI * random(0.7, 1.4))
      * h * 0.30;


    px += random(
      -writer.jitter,
      writer.jitter
    );

    py += random(
      -writer.jitter,
      writer.jitter
    );


    curveVertex(px, py);
  }

  endShape();
}



// ---------------------------------------------------------

function glyphMachine(w, h, writer) {

  let levels =
    floor(random(2, 5));


  for (let i = 0; i < levels; i++) {

    let yy =
      map(
        i,
        0,
        max(1, levels - 1),
        0,
        -h
      );


    let xx =
      random(0, w * 0.4);


    drawHumanLine(

      xx,
      yy,

      random(w * 0.55, w),
      yy,

      writer.jitter * 0.5
    );
  }


  if (random() < 0.7) {

    drawHumanLine(

      random(w),
      0,

      random(w),
      -h,

      writer.jitter * 0.5
    );
  }
}



// ---------------------------------------------------------

function glyphCompound(w, h, writer) {

  glyphStem(
    w * 0.6,
    h,
    writer
  );


  push();

  translate(w * 0.35, -h * 0.3);

  scale(0.55);

  glyphLoop(
    w,
    h,
    writer
  );

  pop();
}



// ---------------------------------------------------------

function glyphMinimal(w, h, writer) {

  let option =
    floor(random(3));


  if (option === 0) {

    drawHumanLine(

      0,
      0,

      w,
      -h,

      writer.jitter
    );

  }


  else if (option === 1) {

    drawHumanLine(

      0,
      -h * 0.4,

      w,
      -h * 0.4,

      writer.jitter
    );

  }


  else {

    point(
      random(w),
      -random(h)
    );

  }
}


// ---------------------------------------------------------
// HUMAN / IMPERFECT LINE
// ---------------------------------------------------------

function drawHumanLine(x1, y1, x2, y2, jitter) {

  let d =
    dist(
      x1,
      y1,
      x2,
      y2
    );


  let points =
    max(
      3,
      floor(d / 4)
    );


  beginShape();


  for (let i = 0; i <= points; i++) {

    let t = i / points;

    let x =
      lerp(x1, x2, t);

    let y =
      lerp(y1, y2, t);


    x += random(
      -jitter,
      jitter
    );

    y += random(
      -jitter,
      jitter
    );


    vertex(x, y);
  }


  endShape();
}


// ---------------------------------------------------------
// ACCENTS / DIACRITICS
// ---------------------------------------------------------

function drawAccent(w, h) {

  push();

  strokeWeight(0.7);


  let accentType =
    floor(random(4));


  if (accentType === 0) {

    point(
      random(w),
      -h - random(3, 8)
    );

  }


  else if (accentType === 1) {

    line(

      w * 0.25,
      -h - 4,

      w * 0.7,
      -h - 7
    );

  }


  else if (accentType === 2) {

    circle(

      random(w),
      -h - 6,

      random(2, 5)
    );

  }


  else {

    arc(

      w * 0.5,
      -h - 4,

      w * 0.7,
      6,

      PI,
      TWO_PI
    );

  }


  pop();
}


// ---------------------------------------------------------
// MACHINE NOTATION
// ---------------------------------------------------------

function drawNotation(x, y) {

  push();

  translate(x, y);


  stroke(45, 47, 45, 140);

  strokeWeight(0.7);

  noFill();


  let type =
    floor(random(5));


  if (type === 0) {

    circle(
      5,
      -8,
      random(4, 11)
    );

  }


  else if (type === 1) {

    line(
      0,
      -3,
      12,
      -15
    );

    line(
      2,
      -14,
      13,
      -4
    );

  }


  else if (type === 2) {

    rect(
      0,
      -15,
      random(5, 12),
      random(6, 15)
    );

  }


  else if (type === 3) {

    for (let i = 0; i < 3; i++) {

      point(
        i * 5,
        -7 + random(-1, 1)
      );
    }

  }


  else {

    arc(
      6,
      -8,
      12,
      12,
      random(PI),
      random(PI, TWO_PI)
    );
  }


  pop();
}


// ---------------------------------------------------------
// MACHINE DIAGRAM
// ---------------------------------------------------------

function drawMachineDiagram(x, y) {

  push();

  translate(x, y - 8);


  stroke(38, 43, 44, 115);

  strokeWeight(0.65);

  noFill();


  let diagramWidth =
    random(65, 130);

  let diagramHeight =
    random(30, 70);


  // outer ghosted box

  for (let i = 0; i < 3; i++) {

    rect(

      random(-1.5, 1.5),

      -diagramHeight +
      random(-1.5, 1.5),

      diagramWidth +
      random(-2, 2),

      diagramHeight +
      random(-2, 2)

    );
  }


  let nodes =
    floor(random(3, 7));


  let pts = [];


  for (let i = 0; i < nodes; i++) {

    let px =
      random(8, diagramWidth - 8);

    let py =
      random(
        -diagramHeight + 8,
        -8
      );


    pts.push(
      createVector(px, py)
    );


    if (random() < 0.5) {

      circle(
        px,
        py,
        random(3, 8)
      );

    } else {

      rect(
        px - 3,
        py - 3,
        random(5, 9),
        random(5, 9)
      );

    }
  }


  // connectors

  for (let i = 0; i < pts.length - 1; i++) {

    if (random() < 0.8) {

      drawHumanLine(

        pts[i].x,
        pts[i].y,

        pts[i + 1].x,
        pts[i + 1].y,

        0.5
      );
    }
  }


  // mysterious annotation

  if (random() < 0.8) {

    line(

      diagramWidth * 0.15,
      -diagramHeight - 6,

      diagramWidth * random(0.4, 0.9),
      -diagramHeight - 6
    );
  }


  pop();
}


// ---------------------------------------------------------
// CORRECTIONS
// ---------------------------------------------------------

function scribbleCorrection(x, y, widthToCross) {

  push();

  stroke(30, 30, 28, 90);

  strokeWeight(0.65);


  let lines =
    floor(random(2, 5));


  for (let i = 0; i < lines; i++) {

    drawHumanLine(

      x + random(-5, 5),

      y + random(-12, 4),

      x +
      widthToCross +
      random(-5, 8),

      y + random(-15, 5),

      random(1, 2.5)
    );
  }


  pop();
}


// ---------------------------------------------------------
// CURSOR MANAGEMENT
// ---------------------------------------------------------

function checkCursor() {

  if (
    cursorX >
    width - marginX - 80
  ) {

    newLine();
  }
}


// ---------------------------------------------------------

function newLine() {

  lineCounter++;

  cursorX =
    marginX +
    random(-5, 15);

  cursorY +=
    lineHeight +
    random(-5, 8);


  // occasional paragraph indent

  if (random() < 0.15) {

    cursorX +=
      random(30, 120);
  }


  // occasional blank line

  if (random() < 0.08) {

    cursorY += lineHeight * 0.6;
  }


  // page finished

  if (
    cursorY >
    height - marginY
  ) {

    newPage();
  }
}


// ---------------------------------------------------------
// NEW PAGE
// ---------------------------------------------------------

function newPage() {

  background(paperColor);

  drawPaperTexture();

  cursorX = marginX;
  cursorY = marginY;

  lineCounter = 0;

  currentWriter = random(writers);
}


// ---------------------------------------------------------
// CLICK = THOUGHT CLUSTER
// ---------------------------------------------------------

function mousePressed() {

  drawThoughtCluster(
    mouseX,
    mouseY
  );
}


// ---------------------------------------------------------

function drawThoughtCluster(x, y) {

  push();

  translate(x, y);


  let writer =
    random(writers);


  let fragments =
    floor(random(8, 20));


  for (let i = 0; i < fragments; i++) {

    push();

    translate(

      random(-70, 70),

      random(-45, 45)

    );


    rotate(
      random(-0.35, 0.35)
    );


    scale(
      random(0.4, 1.2)
    );


    drawGlyph(
      0,
      0,
      1,
      writer
    );


    pop();
  }


  if (
    diagramsEnabled &&
    random() < 0.7
  ) {

    drawMachineDiagram(
      random(-50, 20),
      random(-20, 40)
    );
  }


  pop();
}


// ---------------------------------------------------------
// PAPER TEXTURE
// ---------------------------------------------------------

function drawPaperTexture() {

  push();

  noStroke();


  // subtle fibers / specks

  for (let i = 0; i < width * height * 0.002; i++) {

    let c;

    if (random() < 0.5) {

      c = color(
        90,
        80,
        65,
        random(3, 10)
      );

    } else {

      c = color(
        255,
        255,
        245,
        random(4, 12)
      );

    }


    fill(c);


    circle(

      random(width),

      random(height),

      random(0.3, 1.5)

    );
  }


  pop();
}


// ---------------------------------------------------------
// CONTROLS
// ---------------------------------------------------------

function keyPressed() {

  if (key === " ") {

    paused = !paused;

    if (paused) {

      noLoop();

    } else {

      loop();

    }
  }


  if (
    key === "r" ||
    key === "R"
  ) {

    newPage();
  }


  if (
    key === "d" ||
    key === "D"
  ) {

    diagramsEnabled =
      !diagramsEnabled;
  }


  if (
    key === "s" ||
    key === "S"
  ) {

    let stamp =
      year() + "-" +
      nf(month(), 2) + "-" +
      nf(day(), 2) + "_" +
      nf(hour(), 2) + "-" +
      nf(minute(), 2) + "-" +
      nf(second(), 2);


    saveCanvas(

      "AsemicMachine_" + stamp,

      "png"
    );
  }
}


// ---------------------------------------------------------

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  marginX = width * 0.07;
  marginY = height * 0.08;

  newPage();
}