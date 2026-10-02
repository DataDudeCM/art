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

let lineHeight = 58;

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

let nextDiagramLine = 4;
let glyphStyle = "script";


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

    // -----------------------------------------------------
    // SHORT STRUCTURAL WORDS
    // Like: the, of, to, and...
    // Keeping these short actually helps the language
    // feel more believable.
    // -----------------------------------------------------

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
      name: "orel",
      type: "marker",
      glyphs: [11, 3, 7, 1]
    },


    // -----------------------------------------------------
    // NOUNS
    // Mostly 5–8 glyphs
    // -----------------------------------------------------

    {
      name: "talemer",
      type: "noun",
      glyphs: [7, 4, 12, 6, 1, 9]
    },

    {
      name: "eshanar",
      type: "noun",
      glyphs: [1, 13, 3, 8, 14, 7]
    },

    {
      name: "varathen",
      type: "noun",
      glyphs: [10, 5, 2, 10, 16, 1, 14]
    },

    {
      name: "numera",
      type: "noun",
      glyphs: [14, 8, 6, 1, 9, 10]
    },

    {
      name: "itharel",
      type: "noun",
      glyphs: [3, 16, 7, 9, 1, 12]
    },

    {
      name: "sorelian",
      type: "noun",
      glyphs: [13, 11, 5, 12, 3, 8, 14]
    },

    {
      name: "vekaron",
      type: "noun",
      glyphs: [17, 4, 8, 10, 9, 11]
    },

    {
      name: "eshvariel",
      type: "noun",
      glyphs: [1, 13, 3, 10, 7, 5, 1, 12]
    },


    // -----------------------------------------------------
    // VERBS
    // -----------------------------------------------------

    {
      name: "threnali",
      type: "verb",
      glyphs: [9, 1, 15, 6, 14, 7]
    },

    {
      name: "kalerin",
      type: "verb",
      glyphs: [8, 4, 11, 1, 9, 3]
    },

    {
      name: "veshara",
      type: "verb",
      glyphs: [10, 13, 3, 7, 9, 10]
    },

    {
      name: "merathen",
      type: "verb",
      glyphs: [6, 5, 9, 7, 16, 1, 14]
    },

    {
      name: "thalemer",
      type: "verb",
      glyphs: [9, 7, 4, 1, 6, 1, 9]
    },


    // -----------------------------------------------------
    // MODIFIERS
    // -----------------------------------------------------

    {
      name: "elanar",
      type: "modifier",
      glyphs: [1, 7, 4, 14, 7, 9]
    },

    {
      name: "nuravel",
      type: "modifier",
      glyphs: [14, 8, 9, 10, 1, 12]
    },

    {
      name: "veleshan",
      type: "modifier",
      glyphs: [10, 1, 12, 1, 13, 7, 14]
    },

    {
      name: "shairen",
      type: "modifier",
      glyphs: [13, 7, 3, 9, 1, 14]
    },

    {
      name: "orathiel",
      type: "modifier",
      glyphs: [11, 9, 7, 16, 3, 1, 12]
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
      writer.scale *
      0.88;
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
      writer.scale *
      0.88;
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
// SCRIPT BEZIER
//
// A slightly imperfect Bezier curve.
// This replaces the hard geometric lines.
// =========================================================

function scriptBezier(
  x1, y1,
  cx1, cy1,
  cx2, cy2,
  x2, y2,
  jitter
) {

  beginShape();


  const steps = 18;


  for (let i = 0; i <= steps; i++) {

    let t = i / steps;

    let mt = 1 - t;


    let px =
      mt * mt * mt * x1 +
      3 * mt * mt * t * cx1 +
      3 * mt * t * t * cx2 +
      t * t * t * x2;


    let py =
      mt * mt * mt * y1 +
      3 * mt * mt * t * cy1 +
      3 * mt * t * t * cy2 +
      t * t * t * y2;


    /*
       More movement toward the middle,
       less at the ends.

       Important because the glyph ends
       still need to connect.
    */

    let middle =
      sin(t * PI);


    px +=
      random(-jitter, jitter) *
      middle;

    py +=
      random(-jitter, jitter) *
      middle;


    vertex(px, py);
  }


  endShape();
}


// =========================================================
// ASCENDING FORM
// =========================================================

function scriptAscender(w, id) {

  let width =
    glyphBaseWidth(id);


  scriptBezier(
    0, 0,
    3, -2,
    3, -25,
    7, -27,
    w.jitter
  );


  scriptBezier(
    7, -27,
    13, -25,
    7, -4,
    width, 0,
    w.jitter
  );
}

// =========================================================
// LOOP FORM
// =========================================================

function scriptLoop(w, id) {

  let width =
    glyphBaseWidth(id);


  scriptBezier(
    0, 0,
    3, -3,
    1, -17,
    8, -18,
    w.jitter
  );


  scriptBezier(
    8, -18,
    17, -19,
    15, -5,
    8, -4,
    w.jitter
  );


  scriptBezier(
    8, -4,
    3, -3,
    11, 1,
    width, 0,
    w.jitter
  );
}


// =========================================================
// SINGLE HUMP
// =========================================================

function scriptHump(w, id) {

  let width =
    glyphBaseWidth(id);


  scriptBezier(
    0, 0,
    4, -1,
    4, -15,
    width * 0.55, -14,
    w.jitter
  );


  scriptBezier(
    width * 0.55, -14,
    width, -13,
    width * 0.72, -1,
    width, 0,
    w.jitter
  );
}

// =========================================================
// DOUBLE HUMP
// =========================================================

function scriptDoubleHump(w, id) {

  let width =
    glyphBaseWidth(id);


  scriptBezier(
    0, 0,
    3, -2,
    3, -13,
    width * 0.32, -13,
    w.jitter
  );


  scriptBezier(
    width * 0.32, -13,
    width * 0.52, -13,
    width * 0.42, 0,
    width * 0.52, 0,
    w.jitter
  );


  scriptBezier(
    width * 0.52, 0,
    width * 0.58, -12,
    width * 0.78, -13,
    width * 0.83, -11,
    w.jitter
  );


  scriptBezier(
    width * 0.83, -11,
    width, -8,
    width * 0.88, -1,
    width, 0,
    w.jitter
  );
}

// =========================================================
// DESCENDER
// =========================================================

function scriptDescender(w, id) {

  let width =
    glyphBaseWidth(id);


  scriptBezier(
    0, 0,
    5, -3,
    7, -14,
    width * 0.55, -12,
    w.jitter
  );


  scriptBezier(
    width * 0.55, -12,
    width, -10,
    width * 0.65, 13,
    width * 0.45, 17,
    w.jitter
  );


  scriptBezier(
    width * 0.45, 17,
    width * 0.25, 18,
    width * 0.55, 2,
    width, 0,
    w.jitter
  );
}

// =========================================================
// OVAL
// =========================================================

function scriptOval(w, id) {

  let width =
    glyphBaseWidth(id);


  scriptBezier(
    0, 0,
    4, -2,
    2, -16,
    width * 0.5, -16,
    w.jitter
  );


  scriptBezier(
    width * 0.5, -16,
    width, -16,
    width, -2,
    width * 0.45, -3,
    w.jitter
  );


  scriptBezier(
    width * 0.45, -3,
    width * 0.15, -4,
    width * 0.6, 1,
    width, 0,
    w.jitter
  );
}

// =========================================================
// HOOK
// =========================================================

function scriptHook(w, id) {

  let width =
    glyphBaseWidth(id);


  scriptBezier(
    0, 0,
    5, -1,
    8, -7,
    width * 0.42, -15,
    w.jitter
  );


  scriptBezier(
    width * 0.42, -15,
    width * 0.72, -24,
    width * 1.05, -17,
    width * 0.72, -10,
    w.jitter
  );


  scriptBezier(
    width * 0.72, -10,
    width * 0.45, -4,
    width * 0.75, -1,
    width, 0,
    w.jitter
  );
}

// =========================================================
// TALL LOOP
// =========================================================

function scriptTallLoop(w, id) {

  let width =
    glyphBaseWidth(id);


  scriptBezier(
    0, 0,
    4, -4,
    2, -31,
    9, -32,
    w.jitter
  );


  scriptBezier(
    9, -32,
    17, -30,
    13, -18,
    8, -15,
    w.jitter
  );


  scriptBezier(
    8, -15,
    2, -10,
    4, -1,
    width, 0,
    w.jitter
  );
}


// =========================================================
// FLOWING WAVE
// =========================================================

function scriptWave(w, id) {

  let width =
    glyphBaseWidth(id);


  scriptBezier(
    0, 0,
    width * 0.18, -2,
    width * 0.18, -15,
    width * 0.42, -14,
    w.jitter
  );


  scriptBezier(
    width * 0.42, -14,
    width * 0.68, -13,
    width * 0.55, 0,
    width * 0.72, 0,
    w.jitter
  );


  scriptBezier(
    width * 0.72, 0,
    width * 0.85, -1,
    width * 0.9, -7,
    width, 0,
    w.jitter
  );
}

// =========================================================
// SECONDARY FLOURISHES
// =========================================================

function scriptAccent(id) {

  strokeWeight(0.65);


  let style =
    id % 4;


  if (style === 0) {

    // floating dash

    scriptBezier(
      5, -24,
      8, -27,
      11, -27,
      14, -25,
      0.3
    );

  }


  else if (style === 1) {

    // small upper loop

    scriptBezier(
      6, -20,
      3, -28,
      15, -29,
      12, -20,
      0.3
    );

  }


  else if (style === 2) {

    // tiny rising slash

    scriptBezier(
      8, -20,
      9, -23,
      11, -27,
      14, -29,
      0.25
    );

  }


  else {

    // small crossing stroke

    scriptBezier(
      3, -10,
      7, -12,
      11, -11,
      15, -10,
      0.25
    );
  }
}
// =========================================================
// GLYPH ENGINE
// =========================================================

function drawGlyph(id, x, y, writer) {

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

  if (glyphStyle === "script") {

    drawScriptGlyph(id, writer);

  } else {

    drawGeometricGlyph(id, writer);

  }

  pop();
}

function drawScriptGlyph(id, writer) {

  let form = id % 9;

  switch(form) {

    case 0:
      scriptAscender(writer, id);
      break;

    case 1:
      scriptLoop(writer, id);
      break;

    case 2:
      scriptHump(writer, id);
      break;

    case 3:
      scriptDoubleHump(writer, id);
      break;

    case 4:
      scriptDescender(writer, id);
      break;

    case 5:
      scriptOval(writer, id);
      break;

    case 6:
      scriptHook(writer, id);
      break;

    case 7:
      scriptTallLoop(writer, id);
      break;

    case 8:
      scriptWave(writer, id);
      break;
  }

  if (id >= 9) {
    scriptAccent(id);
  }
}

function drawGeometricGlyph(id, writer) {

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


  // --------------------------------------------------
  // Guaranteed occasional diagram
  // --------------------------------------------------

  if (
    diagramsEnabled &&
    lineNumber >= nextDiagramLine
  ) {

    drawLanguageDiagram();

    // Make enough room so writing doesn't immediately
    // crash into the diagram.
    cursorY += random(80, 120);

    // Next diagram appears 4–7 lines later.
    nextDiagramLine += floor(random(4, 8));
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

  cursorX = marginX;
  cursorY = marginY + 35;

  lineNumber = 0;
  paragraphNumber = 0;

  sentenceQueue = [];

  currentWriter = random(writers);

  pageFinished = false;

  // First diagram will occur somewhere around
  // line 3–5.
  nextDiagramLine = floor(random(3, 6));

  drawHeading();

  cursorY += lineHeight * 1.4;
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

  if (key === "g" || key === "G") {

  if (glyphStyle === "script") {

    glyphStyle = "geometric";

    console.log("Glyph style: geometric");

  } else {

    glyphStyle = "script";

    console.log("Glyph style: script");

    }
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