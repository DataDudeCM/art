// Scanline sonification
// A vertical playhead sweeps the image left to right. The image is averaged
// down to 36 rows; each row is one chromatic pitch (top = highest, C3..B5,
// three octaves). At every moment the whole column sounds at once as a chord,
// and each row's brightness sets its volume.
//
// Three colour modes (key C cycles them):
//   gray   : one sine per row, volume = luminance
//   timbre : three oscillators per row at the same pitch:
//            red -> sawtooth, green -> sine, blue -> square
//   chord  : each row is the root of a triad, all sines:
//            red -> root, green -> third, blue -> fifth
//            Pentatonic on: thirds come from C major, so C and G rows play
//            major chords and D, E and A rows play minor ones.
//            Chromatic: every row plays a major triad.
//
// Keys
//   SPACE  play / pause (first press starts audio)
//   C      cycle grayscale / RGB timbre / RGB chord
//   I      invert: dark ink is loud, paper is silent
//   P      snap rows to C major pentatonic (same 3-octave range)
//   - / =  brightness threshold down / up (levels below it are silenced)
//   [ / ]  slower / faster sweep
//   G      show the 36-row grid the sound is actually made from
//   R      rewind
//   click  move the playhead
//   1      piccolo preset (see PRESETS; add more on 2, 3 ...)
//
// Design notes: vault session 2026-11-17-music-and-art-crossovers.

const IMG_PATH = '../common/images/circleFlow.png';
const ROWS = 36;              // 3 octaves, chromatic 
const BASE_MIDI = 48;         // C3 = bottom row
const DISPLAY_H = 720;
const PANEL_W = 170;

// Rough loudness balance: saw and square carry far more harmonic energy
// than a sine at the same amplitude.
const WAVE_WEIGHT = { sawtooth: 0.35, sine: 1.0, square: 0.25 };

let img;
let dispW;
let grid = [];                // grid[col][row] = { r, g, b, l } in 0..1
let gridImg;                  // the downsampled image, for the G overlay

let playX = 0;                // playhead, in display columns
let sweepSeconds = 30;
let playing = false;
const COLOR_MODES = ['gray', 'timbre', 'chord'];
const MODE_LABEL = { gray: 'grayscale', timbre: 'RGB timbre', chord: 'RGB chord' };
let colorMode = 'gray';       // key C
let invert = false;
let pentatonic = false;   // key P
let threshold = 0;
let showGrid = false;

// Number-key presets: sound settings only (playhead and grid view untouched).
// Piccolo: found by Chris on doodle2.jpg. A high threshold leaves only the
// darkest ink, so one or two pentatonic sines sound at a time: a melody line.
const PRESETS = {
  '1': { name: 'piccolo', sweepSeconds: 35, threshold: 0.6, invert: true, colorMode: 'gray', pentatonic: true },
};
let presetName = '';          // shown until a setting is changed by hand

function applyPreset(p) {
  ({ sweepSeconds, threshold, invert, colorMode, pentatonic } = p);
  presetName = p.name;
}

let audio = null;             // built on first SPACE (browsers require a gesture)
let levels = [];              // current per-row levels, for the panel

function preload() {
  img = loadImage(IMG_PATH);
}

function setup() {
  dispW = round(DISPLAY_H * img.width / img.height);
  const c = createCanvas(dispW + PANEL_W, DISPLAY_H);
  c.parent(select('main'));
  buildGrid();
  textFont('Arial');
}

// Box-average the full-resolution image into dispW columns x ROWS rows.
// A proper average (not drawImage scaling) so thin strokes still count.
function buildGrid() {
  img.loadPixels();
  const W = img.width, H = img.height;
  const sums = [];
  for (let c = 0; c < dispW; c++) {
    sums.push([]);
    for (let r = 0; r < ROWS; r++) sums[c].push([0, 0, 0, 0]);
  }
  for (let y = 0; y < H; y++) {
    const r = min(ROWS - 1, floor(y * ROWS / H));
    for (let x = 0; x < W; x++) {
      const c = min(dispW - 1, floor(x * dispW / W));
      const i = 4 * (y * W + x);
      const s = sums[c][r];
      s[0] += img.pixels[i];
      s[1] += img.pixels[i + 1];
      s[2] += img.pixels[i + 2];
      s[3]++;
    }
  }
  grid = sums.map(col => col.map(([R, G, B, n]) => {
    const r = R / n / 255, g = G / n / 255, b = B / n / 255;
    return { r, g, b, l: 0.2126 * r + 0.7152 * g + 0.0722 * b };
  }));

  gridImg = createImage(dispW, ROWS);
  gridImg.loadPixels();
  for (let c = 0; c < dispW; c++) {
    for (let r = 0; r < ROWS; r++) {
      const p = grid[c][r], i = 4 * (r * dispW + c);
      gridImg.pixels[i] = p.r * 255;
      gridImg.pixels[i + 1] = p.g * 255;
      gridImg.pixels[i + 2] = p.b * 255;
      gridImg.pixels[i + 3] = 255;
    }
  }
  gridImg.updatePixels();
}

// ---------- audio ----------

function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function rowMidi(r) { return BASE_MIDI + (ROWS - 1 - r); }

// Pentatonic snap (key P): C major pentatonic, C D E G A. The range stays the
// same 3 octaves, so only the scale changes. Each row hands its sound to the
// nearest pentatonic row (ties go to the lower note); about 2.4 rows share
// each note, and a shared note takes the loudest of its rows.
const PENTA = [0, 2, 4, 7, 9];
const OWNER = [];             // OWNER[r] = the row whose pitch row r plays
for (let r = 0; r < ROWS; r++) {
  let best = -1, bestD = Infinity;
  for (let o = ROWS - 1; o >= 0; o--) {          // low pitch first, so ties go low
    if (!PENTA.includes(rowMidi(o) % 12)) continue;
    const d = Math.abs(rowMidi(o) - rowMidi(r));
    if (d < bestD) { best = o; bestD = d; }
  }
  OWNER.push(best);
}

// Chord mode: semitones above the row's root for the third and fifth.
// With pentatonic on, only C D E G A rows sound; their thirds are taken from
// C major (C-E-G, D-F-A, E-G-B, G-B-D, A-C-E), so the chords stay in key.
function chordIntervals(r) {
  if (!pentatonic) return [4, 7];
  const pc = rowMidi(r) % 12;
  return [(pc === 0 || pc === 7) ? 4 : 3, 7];
}
function isMinorRow(r) { return chordIntervals(r)[0] === 3; }

const VOICES = ['saw', 'sine', 'square', 'third', 'fifth'];

function buildAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.ratio.value = 6;
  comp.connect(ctx.destination);
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(comp);

  // Per row: saw, sine (also the chord root), square at the row's pitch,
  // plus two sines for the chord's third and fifth.
  const WAVE = { saw: 'sawtooth', sine: 'sine', square: 'square', third: 'sine', fifth: 'sine' };
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const voices = {};
    for (const v of VOICES) {
      const osc = ctx.createOscillator();
      osc.type = WAVE[v];
      osc.frequency.value = midiToFreq(rowMidi(r));
      const g = ctx.createGain();
      g.gain.value = 0;
      osc.connect(g).connect(master);
      osc.start();
      voices[v] = { osc, gain: g };
    }
    rows.push(voices);
  }
  const a = { ctx, master, rows, tunedFor: null };
  retuneChords(a);
  return a;
}

// Set every row's third and fifth oscillators for the current scale.
function retuneChords(a) {
  const t = a.ctx.currentTime;
  a.rows.forEach((v, r) => {
    const [i3, i5] = chordIntervals(r);
    v.third.osc.frequency.setValueAtTime(midiToFreq(rowMidi(r) + i3), t);
    v.fifth.osc.frequency.setValueAtTime(midiToFreq(rowMidi(r) + i5), t);
  });
  a.tunedFor = pentatonic;
}

// Per-row amplitude for each voice, from one grid cell.
function cellVoices(p) {
  let level = invert ? 1 - p.l : p.l;
  if (level < threshold) level = 0;
  const v = { level, saw: 0, sine: 0, square: 0, third: 0, fifth: 0 };

  if (colorMode === 'gray') { v.sine = level; return v; }

  let r, g, b;
  if (!invert) {
    // channels straight through
    const cut = x => (x < threshold ? 0 : x);
    [r, g, b] = [cut(p.r), cut(p.g), cut(p.b)];
  } else {
    // inverted RGB: loudness comes from how dark the ink is, and the colour
    // only decides the mix. (Inverting each channel would swap every colour
    // for its complement: the teal shirt would play red's sawtooth.)
    const sum = p.r + p.g + p.b || 1;
    [r, g, b] = [level * p.r / sum * 3, level * p.g / sum * 3, level * p.b / sum * 3];
  }
  if (colorMode === 'timbre') { v.saw = r; v.sine = g; v.square = b; }
  else { v.sine = r; v.third = g; v.fifth = b; }   // chord: root, third, fifth
  return v;
}

// The 36 per-row voices for one column, merged onto pentatonic rows if on.
function columnVoices(col) {
  const raw = grid[col].map(cellVoices);
  if (!pentatonic) return raw;
  const out = raw.map(() => ({ level: 0, saw: 0, sine: 0, square: 0, third: 0, fifth: 0 }));
  raw.forEach((v, r) => {
    const o = out[OWNER[r]];
    o.level = max(o.level, v.level);
    for (const k of VOICES) o[k] = max(o[k], v[k]);
  });
  return out;
}

const VOICE_WEIGHT = { saw: WAVE_WEIGHT.sawtooth, sine: 1, square: WAVE_WEIGHT.square, third: 1, fifth: 1 };

function updateAudio(col) {
  const t = audio.ctx.currentTime, tc = 0.015;
  if (audio.tunedFor !== pentatonic) retuneChords(audio);
  let sumSq = 0;
  levels = columnVoices(col);
  for (let r = 0; r < ROWS; r++) {
    for (const k of VOICES) {
      const a = levels[r][k] * VOICE_WEIGHT[k];
      audio.rows[r][k].gain.gain.setTargetAtTime(a, t, tc);
      sumSq += a * a;
    }
  }
  // Uncorrelated tones add roughly by RMS, so scale by sqrt(sum of squares).
  // A single quiet row stays quiet; a full column doesn't clip.
  const m = playing ? 0.35 / Math.max(1, Math.sqrt(sumSq)) : 0;
  audio.master.gain.setTargetAtTime(m, t, 0.03);
}

// ---------- draw ----------

function draw() {
  background(27);

  if (playing) {
    playX += dispW / (sweepSeconds * 60) * (deltaTime / (1000 / 60));
    if (playX >= dispW) playX = 0;
  }
  const col = constrain(floor(playX), 0, dispW - 1);
  if (audio) updateAudio(col);
  else levels = columnVoices(col);

  if (showGrid) {
    noSmooth();
    image(gridImg, 0, 0, dispW, DISPLAY_H);
    smooth();
  } else {
    image(img, 0, 0, dispW, DISPLAY_H);
  }

  // playhead
  stroke(255, 60, 60);
  strokeWeight(2);
  line(playX, 0, playX, height);

  drawPanel();
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function drawPanel() {
  const x0 = dispW + 10, rowH = DISPLAY_H / ROWS;
  const barX = x0 + 34, barW = PANEL_W - 50;
  noStroke();
  textSize(10);
  textAlign(LEFT, CENTER);
  for (let r = 0; r < ROWS; r++) {
    const y = r * rowH;
    const m = rowMidi(r);
    const name = NOTE_NAMES[m % 12];
    const black = name.includes('#');
    const dead = pentatonic && OWNER[r] !== r;   // row snapped away to a neighbour
    fill(dead ? 45 : black ? 70 : 120);
    // chord mode: label the chord, e.g. "A4m" for A minor
    const chordTag = colorMode === 'chord' && !dead && isMinorRow(r) ? 'm' : '';
    text(name + (floor(m / 12) - 1) + chordTag, x0, y + rowH / 2);
    fill(black ? 38 : 48);
    rect(barX, y + 1, barW, rowH - 2);

    const v = levels[r];
    if (!v) continue;
    if (colorMode !== 'gray') {
      // stacked bars, red / green / blue:
      // timbre = saw, sine, square; chord = root, third, fifth
      const bars = colorMode === 'timbre' ? [v.saw, v.sine, v.square] : [v.sine, v.third, v.fifth];
      const third = (rowH - 2) / 3;
      fill(230, 70, 60); rect(barX, y + 1, barW * min(1, bars[0]), third);
      fill(80, 210, 90); rect(barX, y + 1 + third, barW * min(1, bars[1]), third);
      fill(70, 120, 240); rect(barX, y + 1 + 2 * third, barW * min(1, bars[2]), third);
    } else {
      fill(220);
      rect(barX, y + 1, barW * v.level, rowH - 2);
    }
    if (threshold > 0) {
      stroke(255, 200, 0, 120);
      line(barX + barW * threshold, y + 1, barX + barW * threshold, y + rowH - 1);
      noStroke();
    }
  }
  drawStatus();
}

function drawStatus() {
  const lines = [
    (playing ? 'playing' : (audio ? 'paused: SPACE' : 'SPACE to start sound')) +
      (presetName ? `  [${presetName}]` : ''),
    `mode: ${MODE_LABEL[colorMode]}  (C)`,
    `${invert ? 'ink loud' : 'bright loud'}  (I)`,
    `scale: ${pentatonic ? 'pentatonic' : 'chromatic'}  (P)`,
    `threshold ${threshold.toFixed(2)}  (- =)`,
    `sweep ${sweepSeconds}s  ([ ])`,
    `grid ${showGrid ? 'on' : 'off'}  (G)`,
  ];
  const w = 170, h = lines.length * 15 + 10;
  noStroke();
  fill(0, 160);
  rect(6, 6, w, h, 4);
  fill(240);
  textSize(11);
  textAlign(LEFT, TOP);
  lines.forEach((s, i) => text(s, 12, 11 + i * 15));
}

// ---------- input ----------

function keyPressed() {
  if (key === ' ') {
    if (!audio) audio = buildAudio();
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    playing = !playing;
    return false;
  }
  if (PRESETS[key]) { applyPreset(PRESETS[key]); return; }
  const k = key.toLowerCase();
  if ('cip=+-_[]'.includes(k)) presetName = '';   // hand-tweaked: no longer the preset
  if (k === 'c') colorMode = COLOR_MODES[(COLOR_MODES.indexOf(colorMode) + 1) % COLOR_MODES.length];
  else if (k === 'i') invert = !invert;
  else if (k === 'p') pentatonic = !pentatonic;
  else if (k === 'g') showGrid = !showGrid;
  else if (k === 'r') playX = 0;
  else if (key === '=' || key === '+') threshold = min(0.95, round((threshold + 0.05) * 100) / 100);
  else if (key === '-' || key === '_') threshold = max(0, round((threshold - 0.05) * 100) / 100);
  else if (key === '[') sweepSeconds = min(240, sweepSeconds + 5);
  else if (key === ']') sweepSeconds = max(5, sweepSeconds - 5);
}

function mousePressed() {
  if (mouseX >= 0 && mouseX < dispW && mouseY >= 0 && mouseY < height) playX = mouseX;
}
