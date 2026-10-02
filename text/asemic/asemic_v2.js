/*
===========================================================
                 ASEMIC MACHINE v2
               THE HIDDEN LANGUAGE
===========================================================

The machine now has:

- a persistent alphabet
- recurring words
- nouns, verbs, modifiers, markers
- sentence structures
- paragraphs
- headings
- marginal notes
- diagrams that reuse vocabulary
- different handwriting personalities

CONTROLS
--------
SPACE = pause
R     = new manuscript
S     = save PNG
D     = toggle diagrams
CLICK = insert handwritten marginal note
*/


// =========================================================
// GLOBALS
// =========================================================

let cursorX;
let cursorY;

let marginX;
let marginY;

let lineHeight = 48;

let paused = false;
let diagramsEnabled = true;

let paperColor;

let writers = [];
let currentWriter;

let vocabulary = [];

let sentenceQueue = [];

let tokenTimer = 0;
let writingSpeed = 5;

let lineNumber = 0;
let paragraphNumber = 0;

let pageFinished = false;
let pageFinishedAt = 0;


// =========================================================
// SETUP
// =========================================================

function setup() {

  createCanvas(windowWidth, windowHeight);

  pixelDensity(1);

  paperColor = color(237, 232, 218);

  marginX = width * 0.075;
  marginY = height * 0.09;

  createWriters();
  createVocabulary();

  newPage();

  frameRate(30);
}


// =========================================================
// DRAW
// =========================================================

function draw() {

  if (pageFinished) {

    if (millis() - pageFinishedAt > 6000) {
      newPage();
    }

    return;
  }


  tokenTimer++;


  if (tokenTimer >= writingSpeed) {

    tokenTimer = 0;

    writeNextToken();
  }
}


// =========================================================
// WRITER PERSONALITIES
// =========================================================

function createWriters() {

  writers = [

    {
      name: "SCRIBE",
      jitter: 0.7,
      slant: -0.05,
      scale: 1.0,
      spacing: 9,
      weight: 1.0,
      ink: color(30, 31, 29, 190)
    },

    {
      name: "ARCHITECT",
      jitter: 0.35,
      slant: 0,
      scale: 0.9,
      spacing: 11,
      weight: 0.8,
      ink: color(35, 40, 42, 180)
    },

    {
      name: "ANXIOUS",
      jitter: 2.0,
      slant: 0.12,
      scale: 0.82,
      spacing: 5,
      weight: 0.75,
      ink: color(36, 32, 29, 165)
    },

    {
      name: "CEREMONIAL",
      jitter: 0.9,
      slant: -0.12,
      scale: 1.2,
      spacing: 12,
      weight: 1.15,
      ink: color(42, 34, 31, 195)
    }

  ];
}


// =========================================================
// VOCABULARY
//
// These are actual recurring words.
//
// Each number represents one glyph from our invented alphabet.
// =========================================================

function createVocabulary() {

  vocabulary = [

    // MARKERS

    {
      name: "ka",
      type: "marker",
      glyphs: [2, 8]
    },

    {
      name: "sen",
      type: "marker",
      glyphs: [5, 1, 9]
    },

    {
      name: "or",
      type: "marker",
      glyphs: [11, 3]
    },


    // NOUNS

    {
      name: "talem",
      type: "noun",
      glyphs: [7, 4, 12, 6]
    },

    {
      name: "esh",
      type: "noun",
      glyphs: [1, 13, 3]
    },

    {
      name: "vara",
      type: "noun",
      glyphs: [10, 5, 2, 10]
    },

    {
      name: "num",
      type: "noun",
      glyphs: [14, 8, 6]
    },

    {
      name: "ithar",
      type: "noun",
      glyphs: [3, 16, 7, 9]
    },

    {
      name: "sorel",
      type: "noun",
      glyphs: [13, 11, 5, 12]
    },

    {
      name: "vek",
      type: "noun",
      glyphs: [17, 4, 8]
    },


    // VERBS

    {
      name: "thren",
      type: "verb",
      glyphs: [9, 1, 15, 6]
    },

    {
      name: "kal",
      type: "verb",
      glyphs: [8, 4, 11]
    },

    {
      name: "vesh",
      type: "verb",
      glyphs: [10, 13, 3]
    },

    {
      name: "mer",
      type: "verb",
      glyphs: [6, 5, 9]
    },


    // MODIFIERS

    {
      name: "elan",
      type: "modifier",
      glyphs: [1, 7, 4, 14]
    },

    {
      name: "nur",
      type: "modifier",
      glyphs: [14, 8, 9]
    },

    {
      name: "vel",
      type: "modifier",
      glyphs: [10, 1, 12]
    },

    {
      name: "shai",
      type: "modifier",
      glyphs: [13, 7, 3]
    }

  ];
}


// =========================================================
// GRAMMAR
//
// Sentence templates.
//
// Words are random,
// STRUCTURE is not.
// =========================================================

function generateSentence() {

  const patterns = [

    [
      "marker",
      "noun",
      "verb",
      "noun"
    ],

    [
      "noun",
      "verb",
      "modifier",
      "noun"
    ],

    [
      "marker",
      "modifier",
      "noun",
      "verb"
    ],

    [
      "noun",
      "noun",
      "verb",
      "modifier"
    ],

    [
      "marker",
      "noun",
      "verb",
      "noun",
      "modifier"
    ]

  ];


  let pattern = random(patterns);

  let sentence = [];


  for (let type of pattern) {

    sentence.push(
      randomWord(type)
    );
  }


  /*
      Language habit:

      sometimes repeat the first noun at the end.
      This gives the viewer recognizable structure.
  */

  if (random() < 0.17) {

    let nouns =
      sentence.filter(w => w.type === "noun");

    if (nouns.length > 0) {

      sentence.push(
        nouns[0]
      );
    }
  }


  return sentence;
}


// =========================================================
// RANDOM WORD BY TYPE
// =========================================================

function randomWord(type) {

  let choices =
    vocabulary.filter(
      w => w.type === type
    );

  return random(choices);
}


// =========================================================
// TOKEN WRITING
// =========================================================

function writeNextToken() {

  /*
      When sentence queue empties,
      generate another linguistic structure.
  */

  if (sentenceQueue.length === 0) {

    createNextSentence();

    return;
  }


  let token =
    sentenceQueue.shift();


  // -------------------------------------
  // WORD
  // -------------------------------------

  if (token.kind === "word") {

    let wordWidth =
      getWordWidth(
        token.word,
        currentWriter
      );


    if (
      cursorX + wordWidth >
      width - marginX
    ) {

      newLine();
    }


    drawWord(
      token.word,
      cursorX,
      cursorY,
      currentWriter
    );


    cursorX +=
      wordWidth +
      currentWriter.spacing +
      random(5, 13);

  }


  // -------------------------------------
  // PERIOD-LIKE TERMINATOR
  // -------------------------------------

  else if (token.kind === "period") {

    drawSentenceMark(
      cursorX,
      cursorY
    );

    cursorX += 24;

  }


  // -------------------------------------
  // LINE BREAK
  // -------------------------------------

  else if (token.kind === "newline") {

    newLine();

  }


  // -------------------------------------
  // PARAGRAPH
  // -------------------------------------

  else if (token.kind === "paragraph") {

    newParagraph();
  }
}


// =========================================================
// CREATE NEXT SENTENCE
// =========================================================

function createNextSentence() {

  let sentence =
    generateSentence();


  for (let word of sentence) {

    sentenceQueue.push({

      kind: "word",
      word: word

    });
  }


  sentenceQueue.push({
    kind: "period"
  });


  /*
      Sentence rhythm.
  */

  if (random() < 0.55) {

    sentenceQueue.push({
      kind: "newline"
    });
  }


  /*
      Occasionally finish paragraph.
  */

  if (random() < 0.22) {

    sentenceQueue.push({
      kind: "paragraph"
    });
  }
}


// =========================================================
// WORD DRAWING
// =========================================================

function drawWord(
  word,
  x,
  baseline,
  writer
) {

  push();

  translate(
    x,
    baseline
  );


  let localX = 0;


  for (
    let glyphIndex = 0;
    glyphIndex < word.glyphs.length;
    glyphIndex++
  ) {

    let glyphID =
      word.glyphs[glyphIndex];


    drawGlyph(
      glyphID,
      localX,
      0,
      writer
    );


    localX +=
      glyphBaseWidth(glyphID) *
      writer.scale;
  }


  /*
      Special treatment:

      markers sometimes have a faint bar underneath.
  */

  if (
    word.type === "marker" &&
    random() < 0.35
  ) {

    stroke(
      red(writer.ink),
      green(writer.ink),
      blue(writer.ink),
      80
    );

    strokeWeight(0.6);

    imperfectLine(
      0,
      7,
      localX,
      7,
      0.5
    );
  }


  pop();
}


// =========================================================
// WORD WIDTH
// =========================================================

function getWordWidth(
  word,
  writer
) {

  let total = 0;


  for (let id of word.glyphs) {

    total +=
      glyphBaseWidth(id) *
      writer.scale;
  }


  return total;
}


// =========================================================
// GLYPH WIDTH
// =========================================================

function glyphBaseWidth(id) {

  let widths = [

    14, 18, 13, 17,
    18, 20, 17, 16,
    15, 18, 20, 16,
    16, 21, 18, 20,
    17, 22

  ];

  return widths[id];
}


// =========================================================
// GLYPH ENGINE
// =========================================================

function drawGlyph(
  id,
  x,
  y,
  writer
) {

  push();

  translate(x, y);

  scale(writer.scale);

  shearX(writer.slant);


  stroke(
    red(writer.ink),
    green(writer.ink),
    blue(writer.ink),
    alpha(writer.ink)
  );

  strokeWeight(writer.weight);

  noFill();


  switch(id) {

    case 0:
      glyphStem(writer);
      break;

    case 1:
      glyphLoop(writer);
      break;

    case 2:
      glyphHook(writer);
      break;

    case 3:
      glyphFork(writer);
      break;

    case 4:
      glyphAngle(writer);
      break;

    case 5:
      glyphWave(writer);
      break;

    case 6:
      glyphCircleTail(writer);
      break;

    case 7:
      glyphArch(writer);
      break;

    case 8:
      glyphTwinStem(writer);
      break;

    case 9:
      glyphTriangle(writer);
      break;

    case 10:
      glyphCup(writer);
      break;

    case 11:
      glyphCross(writer);
      break;

    case 12:
      glyphDotStem(writer);
      break;

    case 13:
      glyphSnake(writer);
      break;

    case 14:
      glyphBox(writer);
      break;

    case 15:
      glyphOmega(writer);
      break;

    case 16:
      glyphLadder(writer);
      break;

    case 17:
      glyphSpiral(writer);
      break;
  }


  pop();
}


// =========================================================
// GLYPH 0
// =========================================================

function glyphStem(w) {

  imperfectLine(
    4, 0,
    5, -28,
    w.jitter
  );

  imperfectLine(
    4, -15,
    13, -18,
    w.jitter
  );
}


// =========================================================
// GLYPH 1
// =========================================================

function glyphLoop(w) {

  beginShape();

  for (let i = 0; i <= 18; i++) {

    let a =
      map(
        i,
        0,
        18,
        -HALF_PI,
        TWO_PI + HALF_PI
      );

    let px =
      8 +
      cos(a) * 7;

    let py =
      -13 +
      sin(a) * 10;


    px += random(
      -w.jitter,
      w.jitter
    );

    py += random(
      -w.jitter,
      w.jitter
    );

    curveVertex(px, py);
  }

  endShape();
}


// =========================================================
// GLYPH 2
// =========================================================

function glyphHook(w) {

  beginShape();

  curveVertex(2, 0);
  curveVertex(2, 0);

  curveVertex(
    3,
    -18
  );

  curveVertex(
    7,
    -29
  );

  curveVertex(
    15,
    -21
  );

  curveVertex(
    11,
    -8
  );

  curveVertex(
    17,
    -3
  );

  endShape();
}


// =========================================================
// GLYPH 3
// =========================================================

function glyphFork(w) {

  imperfectLine(
    7, 0,
    7, -27,
    w.jitter
  );

  imperfectLine(
    7, -16,
    16, -25,
    w.jitter
  );

  imperfectLine(
    7, -16,
    17, -10,
    w.jitter
  );
}


// =========================================================
// GLYPH 4
// =========================================================

function glyphAngle(w) {

  beginShape();

  vertex(1, 0);
  vertex(8, -27);
  vertex(16, -5);

  endShape();
}


// =========================================================
// GLYPH 5
// =========================================================

function glyphWave(w) {

  beginShape();

  for (let i = 0; i <= 12; i++) {

    let t =
      i / 12;

    let px =
      t * 19;

    let py =
      -13 +
      sin(t * TWO_PI) *
      9;


    px += random(
      -w.jitter,
      w.jitter
    );

    py += random(
      -w.jitter,
      w.jitter
    );


    curveVertex(
      px,
      py
    );
  }

  endShape();
}


// =========================================================
// GLYPH 6
// =========================================================

function glyphCircleTail(w) {

  imperfectCircle(
    8,
    -16,
    7,
    w.jitter
  );


  imperfectLine(
    13,
    -12,
    18,
    1,
    w.jitter
  );
}


// =========================================================
// GLYPH 7
// =========================================================

function glyphArch(w) {

  beginShape();

  curveVertex(
    1,
    0
  );

  curveVertex(
    1,
    0
  );

  curveVertex(
    3,
    -22
  );

  curveVertex(
    9,
    -28
  );

  curveVertex(
    15,
    -20
  );

  curveVertex(
    15,
    0
  );

  curveVertex(
    15,
    0
  );

  endShape();
}


// =========================================================
// GLYPH 8
// =========================================================

function glyphTwinStem(w) {

  imperfectLine(
    3, 0,
    3, -27,
    w.jitter
  );

  imperfectLine(
    12, 0,
    12, -23,
    w.jitter
  );

  imperfectLine(
    3, -14,
    12, -16,
    w.jitter
  );
}


// =========================================================
// GLYPH 9
// =========================================================

function glyphTriangle(w) {

  beginShape();

  vertex(
    1,
    0
  );

  vertex(
    9,
    -27
  );

  vertex(
    17,
    0
  );

  vertex(
    1,
    0
  );

  endShape();
}


// =========================================================
// GLYPH 10
// =========================================================

function glyphCup(w) {

  beginShape();

  curveVertex(
    1,
    -25
  );

  curveVertex(
    1,
    -25
  );

  curveVertex(
    3,
    -5
  );

  curveVertex(
    10,
    0
  );

  curveVertex(
    17,
    -5
  );

  curveVertex(
    18,
    -25
  );

  curveVertex(
    18,
    -25
  );

  endShape();
}


// =========================================================
// GLYPH 11
// =========================================================

function glyphCross(w) {

  imperfectLine(
    8,
    0,
    8,
    -28,
    w.jitter
  );

  imperfectLine(
    1,
    -16,
    15,
    -13,
    w.jitter
  );
}


// =========================================================
// GLYPH 12
// =========================================================

function glyphDotStem(w) {

  imperfectLine(
    7,
    0,
    7,
    -21,
    w.jitter
  );

  fill(
    red(w.ink),
    green(w.ink),
    blue(w.ink),
    150
  );

  noStroke();

  circle(
    7,
    -29,
    3
  );

  noFill();

  stroke(w.ink);
}


// =========================================================
// GLYPH 13
// =========================================================

function glyphSnake(w) {

  beginShape();

  for (let i = 0; i <= 15; i++) {

    let t =
      i / 15;

    let px =
      t * 19;

    let py =
      -26 +
      t * 25 +
      sin(t * TWO_PI * 1.5) * 4;


    curveVertex(
      px +
      random(-w.jitter, w.jitter),

      py +
      random(-w.jitter, w.jitter)
    );
  }

  endShape();
}


// =========================================================
// GLYPH 14
// =========================================================

function glyphBox(w) {

  imperfectLine(
    2,
    -3,
    2,
    -25,
    w.jitter
  );

  imperfectLine(
    2,
    -25,
    15,
    -25,
    w.jitter
  );

  imperfectLine(
    15,
    -25,
    15,
    -5,
    w.jitter
  );

  imperfectLine(
    15,
    -5,
    2,
    -3,
    w.jitter
  );
}


// =========================================================
// GLYPH 15
// =========================================================

function glyphOmega(w) {

  beginShape();

  curveVertex(
    1,
    0
  );

  curveVertex(
    1,
    0
  );

  curveVertex(
    2,
    -21
  );

  curveVertex(
    9,
    -28
  );

  curveVertex(
    17,
    -21
  );

  curveVertex(
    18,
    0
  );

  curveVertex(
    18,
    0
  );

  endShape();


  imperfectLine(
    1,
    0,
    6,
    -5,
    w.jitter
  );

  imperfectLine(
    18,
    0,
    13,
    -5,
    w.jitter
  );
}


// =========================================================
// GLYPH 16
// =========================================================

function glyphLadder(w) {

  imperfectLine(
    3,
    0,
    3,
    -28,
    w.jitter
  );

  imperfectLine(
    14,
    0,
    14,
    -28,
    w.jitter
  );


  for (
    let yy = -6;
    yy > -27;
    yy -= 7
  ) {

    imperfectLine(
      3,
      yy,
      14,
      yy,
      w.jitter
    );
  }
}


// =========================================================
// GLYPH 17
// =========================================================

function glyphSpiral(w) {

  beginShape();

  for (let i = 0; i <= 25; i++) {

    let t =
      i / 25;

    let a =
      t * TWO_PI * 1.7;

    let radius =
      10 * (1 - t);


    let px =
      10 +
      cos(a) * radius;

    let py =
      -14 +
      sin(a) * radius;


    curveVertex(
      px +
      random(-w.jitter, w.jitter),

      py +
      random(-w.jitter, w.jitter)
    );
  }

  endShape();


  imperfectLine(
    10,
    -14,
    20,
    -1,
    w.jitter
  );
}


// =========================================================
// IMPERFECT LINE
// =========================================================

function imperfectLine(
  x1,
  y1,
  x2,
  y2,
  jitter
) {

  let d =
    dist(
      x1,
      y1,
      x2,
      y2
    );


  let steps =
    max(
      3,
      floor(d / 3)
    );


  beginShape();


  for (
    let i = 0;
    i <= steps;
    i++
  ) {

    let t =
      i / steps;


    let px =
      lerp(
        x1,
        x2,
        t
      );


    let py =
      lerp(
        y1,
        y2,
        t
      );


    px +=
      random(
        -jitter,
        jitter
      );


    py +=
      random(
        -jitter,
        jitter
      );


    vertex(
      px,
      py
    );
  }


  endShape();
}


// =========================================================
// IMPERFECT CIRCLE
// =========================================================

function imperfectCircle(
  cx,
  cy,
  radius,
  jitter
) {

  beginShape();


  for (
    let a = 0;
    a <= TWO_PI + 0.2;
    a += 0.25
  ) {

    let rr =
      radius +
      random(
        -jitter,
        jitter
      );


    vertex(

      cx +
      cos(a) * rr,

      cy +
      sin(a) * rr

    );
  }


  endShape();
}


// =========================================================
// SENTENCE MARK
// =========================================================

function drawSentenceMark(
  x,
  y
) {

  push();

  translate(
    x,
    y
  );


  stroke(
    30,
    30,
    28,
    150
  );

  strokeWeight(0.8);


  let type =
    floor(random(4));


  if (type === 0) {

    circle(
      4,
      -5,
      3
    );

  }


  else if (type === 1) {

    point(
      3,
      -7
    );

    point(
      8,
      -7
    );

  }


  else if (type === 2) {

    line(
      2,
      -15,
      8,
      -2
    );

  }


  else {

    circle(
      5,
      -9,
      6
    );

    point(
      5,
      -9
    );
  }


  pop();
}


// =========================================================
// LINE MANAGEMENT
// =========================================================

function newLine() {

  cursorX =
    marginX +
    random(-4, 12);

  cursorY +=
    lineHeight +
    random(-3, 5);


  lineNumber++;


  // -----------------------------------------
  // occasional diagram
  // -----------------------------------------

  if (
    diagramsEnabled &&
    lineNumber > 2 &&
    random() < 0.10
  ) {

    drawLanguageDiagram();

    cursorY +=
      random(60, 100);
  }


  checkPageEnd();
}


// =========================================================
// NEW PARAGRAPH
// =========================================================

function newParagraph() {

  paragraphNumber++;


  newLine();


  cursorY +=
    random(12, 28);


  cursorX +=
    random(18, 70);


  /*
      Change writer occasionally,
      as though a different hand took over.
  */

  if (random() < 0.35) {

    currentWriter =
      random(writers);
  }


  /*
      Occasional section heading.
  */

  if (
    paragraphNumber > 1 &&
    random() < 0.20
  ) {

    drawHeading();

    cursorY +=
      lineHeight * 1.2;

    cursorX =
      marginX;
  }


  checkPageEnd();
}


// =========================================================
// HEADING
// =========================================================

function drawHeading() {

  let headingWord =
    randomWord("noun");


  push();


  let headingWriter = {

    ...currentWriter,

    scale:
      currentWriter.scale * 1.45,

    weight:
      currentWriter.weight * 1.2,

    spacing:
      currentWriter.spacing

  };


  drawWord(
    headingWord,
    marginX,
    cursorY,
    headingWriter
  );


  let wordWidth =
    getWordWidth(
      headingWord,
      headingWriter
    );


  stroke(
    35,
    35,
    32,
    100
  );

  strokeWeight(0.6);


  imperfectLine(

    marginX,

    cursorY + 10,

    marginX +
    wordWidth +
    random(30, 100),

    cursorY + 10,

    0.8

  );


  pop();
}


// =========================================================
// LANGUAGE DIAGRAM
//
// Diagram labels reuse actual vocabulary.
// =========================================================

function drawLanguageDiagram() {

  let diagramX =
    random(
      width * 0.52,
      width - marginX - 170
    );


  let diagramY =
    cursorY + 20;


  let diagramW =
    random(90, 170);


  let diagramH =
    random(50, 90);


  push();


  stroke(
    40,
    42,
    40,
    90
  );

  strokeWeight(0.6);

  noFill();


  // ghosted enclosure

  for (let i = 0; i < 2; i++) {

    rect(

      diagramX +
      random(-2, 2),

      diagramY -
      diagramH +
      random(-2, 2),

      diagramW +
      random(-2, 2),

      diagramH +
      random(-2, 2)

    );
  }


  let nodeCount =
    floor(random(3, 6));


  let diagramNodes = [];


  for (
    let i = 0;
    i < nodeCount;
    i++
  ) {

    let px =
      random(
        diagramX + 12,
        diagramX + diagramW - 12
      );


    let py =
      random(
        diagramY - diagramH + 12,
        diagramY - 12
      );


    diagramNodes.push(
      createVector(
        px,
        py
      )
    );


    if (random() < 0.5) {

      circle(
        px,
        py,
        random(4, 10)
      );

    }

    else {

      rect(
        px - 4,
        py - 4,
        random(6, 11),
        random(6, 11)
      );
    }
  }


  // connectors

  for (
    let i = 0;
    i < diagramNodes.length - 1;
    i++
  ) {

    imperfectLine(

      diagramNodes[i].x,
      diagramNodes[i].y,

      diagramNodes[i + 1].x,
      diagramNodes[i + 1].y,

      0.5

    );
  }


  /*
      Attach one REAL word from the language.
  */

  let label =
    randomWord("noun");


  let smallWriter = {

    ...currentWriter,

    scale: 0.55,

    weight: 0.7,

    jitter: 0.4

  };


  drawWord(

    label,

    diagramX,

    diagramY + 20,

    smallWriter

  );


  pop();
}


// =========================================================
// MARGINAL NOTE
// =========================================================

function drawMarginalNote(
  x,
  y
) {

  let writer = {

    ...random(writers),

    scale: 0.65,

    jitter: 1.3,

    weight: 0.7

  };


  push();


  translate(
    x,
    y
  );


  rotate(
    random(-0.12, 0.12)
  );


  let note =
    generateSentence();


  let localX = 0;


  for (let word of note) {

    drawWord(
      word,
      localX,
      0,
      writer
    );


    localX +=
      getWordWidth(
        word,
        writer
      ) +
      7;


    if (localX > 180) {

      localX = 0;

      translate(
        0,
        28
      );
    }
  }


  // marginal connector

  stroke(
    40,
    40,
    37,
    75
  );


  imperfectLine(

    -15,
    -5,

    -random(35, 80),
    random(-20, 20),

    0.7

  );


  pop();
}


// =========================================================
// PAGE
// =========================================================

function newPage() {

  background(paperColor);

  drawPaperTexture();


  cursorX =
    marginX;

  cursorY =
    marginY + 35;


  lineNumber = 0;

  paragraphNumber = 0;


  sentenceQueue = [];


  currentWriter =
    random(writers);


  pageFinished =
    false;


  /*
      Every manuscript starts with a heading.
  */

  drawHeading();


  cursorY +=
    lineHeight * 1.4;
}


// =========================================================
// END PAGE
// =========================================================

function checkPageEnd() {

  if (
    cursorY >
    height - marginY - 40
  ) {

    pageFinished = true;

    pageFinishedAt = millis();
  }
}


// =========================================================
// PAPER
// =========================================================

function drawPaperTexture() {

  push();

  noStroke();


  let numberOfSpecks =
    floor(
      width *
      height *
      0.0012
    );


  for (
    let i = 0;
    i < numberOfSpecks;
    i++
  ) {

    if (random() < 0.55) {

      fill(
        80,
        70,
        55,
        random(3, 9)
      );

    }

    else {

      fill(
        255,
        255,
        245,
        random(5, 12)
      );
    }


    circle(

      random(width),

      random(height),

      random(
        0.4,
        1.4
      )

    );
  }


  /*
      Very faint horizontal paper fibers.
  */

  stroke(
    110,
    100,
    80,
    8
  );


  strokeWeight(
    0.4
  );


  for (
    let i = 0;
    i < 80;
    i++
  ) {

    let yy =
      random(height);


    line(

      random(width * 0.05),

      yy,

      random(
        width * 0.5,
        width
      ),

      yy +
      random(-1, 1)

    );
  }


  pop();
}


// =========================================================
// CLICK
// =========================================================

function mousePressed() {

  drawMarginalNote(
    mouseX,
    mouseY
  );
}


// =========================================================
// KEYBOARD
// =========================================================

function keyPressed() {

  // PAUSE

  if (key === " ") {

    paused =
      !paused;


    if (paused) {

      noLoop();

    }

    else {

      loop();

    }
  }


  // RESET

  if (
    key === "r" ||
    key === "R"
  ) {

    newPage();
  }


  // DIAGRAMS

  if (
    key === "d" ||
    key === "D"
  ) {

    diagramsEnabled =
      !diagramsEnabled;
  }


  // SAVE

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

      "AsemicMachine_v2_" +
      stamp,

      "png"

    );
  }
}


// =========================================================
// RESIZE
// =========================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );


  marginX =
    width * 0.075;


  marginY =
    height * 0.09;


  newPage();
}