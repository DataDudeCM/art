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
//   [ / ]  tempo down / up (BPM); B cycles bars. Sweep = bars of 4/4 at BPM
//   G      show the 36-row grid the sound is actually made from
//   R      rewind
//   click  move the playhead
//   1      piccolo preset (see PRESETS; add more on 2, 3 ...)
//
// MIDI: five tracks (see "MIDI tracks" below). The controls under the canvas
// do the same as these keys.
//   S      tracks 2-4 split: thirds (one octave each) / R G B
//   N      select track 1-5 (marked > in the status box)
//   UP/DN  note length of the selected track: free, 1/32 ... whole
//          (hold SHIFT to set all five tracks)
//   A      how a step reads the image: first column / average / max
//   T      held ink: retrigger every step / tie into one note
//   X      selected track on/off (off tracks are not sent or exported)
//   M      export one 5-track MIDI file with the current settings
//   O      live MIDI out on/off, to FL Studio via loopMIDI
//   K      next MIDI output port
//
// Design notes: vault session 2026-11-17-music-and-art-crossovers.

const IMG_PATH = '../common/images/chaikin.jpg'; 
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
let loops = 0;                // times the playhead has wrapped (live step grid runs on)
let lastNow = 0;
let bpm = 120;                // keys [ ]
let bars = 16;                // key B: the image lasts this many bars of 4/4
const BAR_CHOICES = [4, 8, 16, 32];
function sweepSeconds() { return bars * 4 * 60 / bpm; }
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
// (Found at a 35 s sweep; 16 bars at 110 BPM is 34.9 s.)
const PRESETS = {
  '1': { name: 'piccolo', bpm: 110, bars: 16, threshold: 0.6, invert: true, colorMode: 'gray', pentatonic: true },
};
let presetName = '';          // shown until a setting is changed by hand

function applyPreset(p) {
  ({ bpm, bars, threshold, invert, colorMode, pentatonic } = p);
  presetName = p.name;
}

let audio = null;             // built on first SPACE (browsers require a gesture)
let levels = [];              // current per-row levels, for the panel

function preload() {
  img = loadImage(IMG_PATH);
}

// ---------- loading an image ----------
// IMG_PATH is the image at start-up. Drop an image file anywhere on the page,
// or use the "Load image" button, to swap it.
let imgName = IMG_PATH.split('/').pop();   // used in export filenames
let imageStatus = '';

function loadImageFile(file) {
  if (!file || !/^image\//.test(file.type)) { imageStatus = `not an image: ${file ? file.name : '?'}`; return; }
  const url = URL.createObjectURL(file);
  loadImage(url, newImg => {
    URL.revokeObjectURL(url);
    setImage(newImg, file.name);
  }, () => { URL.revokeObjectURL(url); imageStatus = `could not read ${file.name}`; });
}

function setImage(newImg, name) {
  if (liveOut) allNotesOff();
  img = newImg;
  imgName = name;
  imageStatus = '';
  lastExport = '';
  dispW = round(DISPLAY_H * img.width / img.height);
  resizeCanvas(dispW + PANEL_W, DISPLAY_H);
  buildGrid();
  playX = 0;
  loops = 0;
}

function setupImageDrop() {
  const body = document.body;
  body.addEventListener('dragover', e => { e.preventDefault(); body.classList.add('dragging'); });
  body.addEventListener('dragleave', e => { if (e.target === body || !body.contains(e.relatedTarget)) body.classList.remove('dragging'); });
  body.addEventListener('drop', e => {
    e.preventDefault();
    body.classList.remove('dragging');
    loadImageFile(e.dataTransfer.files[0]);
  });
}

function setup() {
  dispW = round(DISPLAY_H * img.width / img.height);
  const c = createCanvas(dispW + PANEL_W, DISPLAY_H);
  c.parent(select('main'));
  buildGrid();
  textFont('Arial');
  buildControls();
  setupImageDrop();
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
  // Each cell sums the source pixels that fall inside it (integer maths, so
  // big images split exactly as before). An image smaller than the grid
  // would leave some cells with no pixels at all: those borrow the nearest.
  const span = (k, src, dst) => {
    const a = Math.floor((k * src + dst - 1) / dst), b = Math.floor(((k + 1) * src + dst - 1) / dst);
    if (b > a) return [a, b];
    const n = min(src - 1, Math.floor(k * src / dst));
    return [n, n + 1];
  };
  const xs = Array.from({ length: dispW }, (_, c) => span(c, W, dispW));
  for (let r = 0; r < ROWS; r++) {
    const [y0, y1] = span(r, H, ROWS);
    for (let y = y0; y < y1; y++) {
      for (let c = 0; c < dispW; c++) {
        const s = sums[c][r];
        for (let x = xs[c][0]; x < xs[c][1]; x++) {
          const i = 4 * (y * W + x);
          s[0] += img.pixels[i];
          s[1] += img.pixels[i + 1];
          s[2] += img.pixels[i + 2];
          s[3]++;
        }
      }
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
// `mode` defaults to the current colour mode; MIDI export asks for others.
function cellVoices(p, mode = colorMode) {
  let level = invert ? 1 - p.l : p.l;
  if (level < threshold) level = 0;
  const v = { level, saw: 0, sine: 0, square: 0, third: 0, fifth: 0 };

  if (mode === 'gray') { v.sine = level; return v; }

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
  if (mode === 'timbre') { v.saw = r; v.sine = g; v.square = b; }
  else { v.sine = r; v.third = g; v.fifth = b; }   // chord: root, third, fifth
  return v;
}

// The 36 per-row voices for one column, merged onto pentatonic rows if on.
// `rows` (a Set) keeps only those rows, before the pentatonic merge, so a
// band's edge row can still snap to a note just outside the band.
const silentVoices = () => ({ level: 0, saw: 0, sine: 0, square: 0, third: 0, fifth: 0 });
function columnVoices(col, mode = colorMode, rows = null) {
  const raw = grid[col].map((p, r) => (rows && !rows.has(r) ? silentVoices() : cellVoices(p, mode)));
  if (!pentatonic) return raw;
  const out = raw.map(silentVoices);
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
  const m = playing && !liveOut ? 0.35 / Math.max(1, Math.sqrt(sumSq)) : 0;
  audio.master.gain.setTargetAtTime(m, t, 0.03);
}

// ---------- MIDI tracks ----------
// Five tracks, on MIDI channels 1-5, shared by export (M) and live out (O):
//   1  full slice: all 36 rows, following the C mode (what you hear)
//   2-4  split (key S):
//        thirds: top / middle / bottom octave (12 rows each), following C mode
//        R G B:  one track per colour. Chord mode keeps root / third / fifth;
//                the others use the timbre split (red, green, blue amounts
//                at the row's own pitch)
//   5  top third, grayscale, played an octave lower
//
// Note length, per track (UP/DN):
//   free  a note starts when a row's level rises above the gate and ends when
//         it drops back: as long as the ink is (the original behaviour)
//   1/32 .. whole: a step sequencer. The sweep is cut into steps of that
//         length; each step reads its stretch of columns (key A: the first
//         column, the average, or the max) and plays every pitch at or over
//         the gate for exactly one step. Held ink retriggers every step, or
//         ties into one long note (key T).
// Tie and free notes are capped at MAX_NOTE_BEATS (4 whole notes).
// Velocity is the level read (free: the note's average level).

const LENGTHS = ['free', '1/32', '1/16', '1/8', '1/4', '1/2', '1'];
const LENGTH_BEATS = { '1/32': 0.125, '1/16': 0.25, '1/8': 0.5, '1/4': 1, '1/2': 2, '1': 4 };
const READS = ['first', 'avg', 'max'];
const PPQ = 480;              // ticks per quarter note
const MIN_GATE = 0.02;        // ignore near-silence even at threshold 0
// Longest note, for tie and free tracks: a note held this long ends and
// restarts at once if the ink carries on. 16 beats = 4 whole notes.
const MAX_NOTE_BEATS = 16;
const MAX_NOTE_TICKS = MAX_NOTE_BEATS * PPQ;
const BAND = [0, 1, 2].map(b => new Set(Array.from({ length: 12 }, (_, i) => b * 12 + i)));

let split = 'thirds';         // key S: 'thirds' or 'rgb'
let selTrack = 0;             // key N
const trackSettings = [0, 1, 2, 3, 4].map(() => ({ on: true, len: 'free', read: 'max', tie: false }));

// The five track definitions for the current settings. Each has the sound
// source (mode, pick, rows, transpose) plus its trackSettings entry.
function trackDefs() {
  const all = v => VOICES.map(k => [k, v[k]]);
  const full = { mode: colorMode, pick: all, rows: null, transpose: 0 };
  const defs = [{ ...full, name: MODE_LABEL[colorMode] }];
  if (split === 'thirds') {
    ['top third', 'middle third', 'bottom third'].forEach((name, i) => defs.push({ ...full, name, rows: BAND[i] }));
  } else {
    const s = colorMode === 'chord' ? 'chord' : 'timbre';
    const keys = s === 'chord' ? ['sine', 'third', 'fifth'] : ['saw', 'sine', 'square'];
    const names = s === 'chord' ? ['red (root)', 'green (third)', 'blue (fifth)'] : ['red', 'green', 'blue'];
    keys.forEach((k, i) => defs.push({ name: names[i], mode: s, pick: v => [[k, v[k]]], rows: null, transpose: 0 }));
  }
  defs.push({ name: 'top third -1 oct', mode: 'gray', pick: v => [['sine', v.sine]], rows: BAND[0], transpose: -12 });
  return defs.map((d, i) => ({ ...d, ...trackSettings[i], channel: i }));
}

// Amplitude per MIDI pitch for one column of one track.
function columnPitches(col, def) {
  const out = new Map();
  columnVoices(col, def.mode, def.rows).forEach((v, r) => {
    const [i3, i5] = chordIntervals(r);
    const offset = { saw: 0, sine: 0, square: 0, third: i3, fifth: i5 };
    for (const [k, a] of def.pick(v)) {
      if (a <= 0) continue;
      const m = rowMidi(r) + offset[k] + def.transpose;
      out.set(m, max(out.get(m) || 0, min(1, a)));
    }
  });
  return out;
}

function gateLevel() { return max(threshold, MIN_GATE); }
function totalTicks() { return bars * 4 * PPQ; }

// Free notes: gate a stream of per-column pitch maps into
// { pitch, start, end, vel } with start/end in columns (end exclusive).
function gateNotes(cols) {
  const gate = gateLevel();
  const open = new Map();     // pitch -> { start, sum, n }
  const notes = [];
  const close = (m, end) => {
    const o = open.get(m);
    notes.push({ pitch: m, start: o.start, end, vel: o.sum / o.n });
    open.delete(m);
  };
  cols.forEach((pitches, c) => {
    for (const [m, a] of pitches) {
      if (a < gate) continue;
      if (!open.has(m)) open.set(m, { start: c, sum: 0, n: 0 });
      const o = open.get(m);
      o.sum += a; o.n++;
    }
    for (const m of [...open.keys()]) {
      if (!((pitches.get(m) || 0) >= gate)) close(m, c);
    }
  });
  for (const m of [...open.keys()]) close(m, cols.length);
  return notes;
}

// Steps for a note length: [firstColumn, endColumn) for each. Every step gets
// at least one column, even when steps are narrower than a column.
function stepRanges(len) {
  const n = Math.round(bars * 4 / LENGTH_BEATS[len]);
  const out = [];
  for (let i = 0; i < n; i++) {
    const c0 = min(dispW - 1, floor(i * dispW / n));
    out.push([c0, max(c0 + 1, floor((i + 1) * dispW / n))]);
  }
  return out;
}

// One step's level per pitch, read from its columns: first, average or max.
function stepValues(cols, c0, c1, read) {
  if (read === 'first') return cols[c0];
  const out = new Map();
  for (let c = c0; c < c1; c++) {
    for (const [m, a] of cols[c]) out.set(m, read === 'max' ? max(out.get(m) || 0, a) : (out.get(m) || 0) + a);
  }
  if (read === 'avg') for (const [m, a] of out) out.set(m, a / (c1 - c0));
  return out;
}

// A track's notes for the whole image, in ticks: { pitch, start, end, vel }.
function trackNotes(def) {
  const cols = [];
  for (let c = 0; c < dispW; c++) cols.push(columnPitches(c, def));
  if (def.len === 'free') {
    const tpc = totalTicks() / dispW;
    const out = [];
    for (const n of gateNotes(cols)) {
      const s = Math.round(n.start * tpc), e = Math.round(n.end * tpc);
      for (let t = s; t < e; t += MAX_NOTE_TICKS) out.push({ ...n, start: t, end: min(e, t + MAX_NOTE_TICKS) });
    }
    return out;
  }
  const gate = gateLevel(), stepTicks = LENGTH_BEATS[def.len] * PPQ;
  const notes = [];
  let open = new Map();       // pitch -> note sounding in the previous step (for tie)
  stepRanges(def.len).forEach(([c0, c1], i) => {
    const next = new Map();
    for (const [m, a] of stepValues(cols, c0, c1, def.read)) {
      if (a < gate) continue;
      let n = def.tie ? open.get(m) : null;
      if (n && (i + 1) * stepTicks - n.start > MAX_NOTE_TICKS) n = null;   // at the cap: restart
      if (n) n.end = (i + 1) * stepTicks;
      else { n = { pitch: m, start: i * stepTicks, end: (i + 1) * stepTicks, vel: a }; notes.push(n); }
      next.set(m, n);
    }
    open = next;
  });
  return notes;
}

// ---------- MIDI export (key M) ----------
// One Standard MIDI File (format 1) with a tempo track plus one track per
// enabled MIDI track; FL Studio puts each on its own channel when imported.
// MIDI has no continuous per-note volume, so swells inside a note are lost.

// --- Standard MIDI File writer ---
function vlq(n) {
  const bytes = [n & 0x7f];
  while ((n >>= 7) > 0) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
}
function textBytes(s) { return [...s].map(ch => ch.charCodeAt(0) & 0x7f); }
function chunk(id, data) {
  const len = data.length;
  return [...textBytes(id), (len >>> 24) & 255, (len >>> 16) & 255, (len >>> 8) & 255, len & 255, ...data];
}
// events: [{ tick, data: [...] }], sorted here; note-offs sort before note-ons
function trackChunk(name, events) {
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const data = [0, 0xff, 0x03, ...vlq(name.length), ...textBytes(name)];
  let last = 0;
  for (const e of events) {
    data.push(...vlq(e.tick - last), ...e.data);
    last = e.tick;
  }
  data.push(0, 0xff, 0x2f, 0);
  return chunk('MTrk', data);
}

// tracks: [{ name, channel, notes }] with note times in ticks
function buildMidi(tracks) {
  const usPerQuarter = Math.round(60e6 / bpm);
  const tempo = trackChunk('scanlineSonify', [
    { tick: 0, order: 0, data: [0xff, 0x51, 3, (usPerQuarter >> 16) & 255, (usPerQuarter >> 8) & 255, usPerQuarter & 255] },
    { tick: 0, order: 0, data: [0xff, 0x58, 4, 4, 2, 24, 8] },   // 4/4
  ]);
  const chunks = tracks.map(({ name, channel, notes }) => {
    const ev = [];
    for (const n of notes) {
      const vel = Math.round(20 + 107 * constrain(n.vel, 0, 1));
      ev.push({ tick: n.start, order: 1, data: [0x90 | channel, n.pitch, vel] });
      ev.push({ tick: n.end, order: 0, data: [0x80 | channel, n.pitch, 0] });
    }
    return trackChunk(name, ev);
  });
  const header = chunk('MThd', [0, 1, 0, tracks.length + 1, (PPQ >> 8) & 255, PPQ & 255]);
  return new Uint8Array([...header, ...tempo, ...chunks.flat()]);
}

function downloadBytes(bytes, filename) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let lastExport = '';          // shown in the status box

function exportMidi() {
  const defs = trackDefs().filter(d => d.on);
  if (!defs.length) { lastExport = 'all tracks off'; return []; }
  const tracks = defs.map(d => ({ name: `${d.channel + 1} ${d.name}`, channel: d.channel, notes: trackNotes(d) }));

  const base = imgName.replace(/\.[^.]+$/, '');
  const tag = [colorMode, split, pentatonic ? 'penta' : 'chrom', invert ? 'ink' : 'bright',
    't' + String(Math.round(threshold * 100)).padStart(2, '0'), bpm + 'bpm', bars + 'bars'].join('_');
  downloadBytes(buildMidi(tracks), `${base}_${tag}.mid`);

  lastExport = tracks.map(t => t.notes.length).join('/') + ' notes';
  return tracks;
}

// ---------- live MIDI out (keys O, K) ----------
// Sends the enabled tracks live on channels 1-5 as the playhead moves, so FL
// Studio's instruments play the image. Needs a MIDI port: on Windows a
// loopMIDI port, enabled as an input in FL. Without one, Windows' built-in
// "Microsoft GS Wavetable Synth" plays General MIDI.
//   free tracks:    every frame, diff what should sound against what is
//                   sounding; velocity is the level when the note starts
//   stepped tracks: the same steps as the export, scheduled LOOKAHEAD_MS
//                   ahead with exact MIDI timestamps, so the rhythm stays on
//                   the grid instead of on screen frames
// The image loops, and the step grid runs on across the loop.

let midiAccess = null;
let midiOutputs = [];
let midiOutIndex = 0;
let liveOut = false;
let midiStatus = '';
const liveOn = new Map();     // free tracks: channel -> Map(pitch -> true) sounding in the synth
const stepState = new Map();  // stepped tracks: channel -> scheduler state
const LOOKAHEAD_MS = 100;

// Prefers the first port that isn't Windows' GS synth (e.g. a loopMIDI port).
function refreshOutputs() {
  const prev = midiOutputs[midiOutIndex] && midiOutputs[midiOutIndex].id;
  midiOutputs = [...midiAccess.outputs.values()];
  let i = midiOutputs.findIndex(o => o.id === prev);
  if (i < 0) i = midiOutputs.findIndex(o => !/GS Wavetable/i.test(o.name));
  midiOutIndex = max(0, i);
}

function currentOutput() { return midiOutputs[midiOutIndex] || null; }

async function requestMidi() {
  if (midiAccess) return true;
  if (!navigator.requestMIDIAccess) { midiStatus = 'no Web MIDI: use Chrome or Edge'; return false; }
  try {
    midiAccess = await navigator.requestMIDIAccess();
    midiAccess.onstatechange = () => refreshOutputs();   // e.g. loopMIDI started later
  } catch (e) { midiStatus = 'MIDI access refused'; return false; }
  refreshOutputs();
  return true;
}

async function toggleLiveOut() {
  if (liveOut) { allNotesOff(); liveOut = false; browserAudio(); return; }
  if (!(await requestMidi())) return;
  if (!currentOutput()) { midiStatus = 'no MIDI output ports found'; return; }
  midiStatus = '';
  liveOut = true;
  browserAudio();
  setupGsPrograms();
}

// While live MIDI is on the browser's own sound is silent anyway, so suspend
// it entirely: that releases the audio device for FL.
function browserAudio() {
  if (!audio) return;
  if (liveOut) audio.ctx.suspend();
  else audio.ctx.resume();
}

function selectOutput(i) {
  if (!midiOutputs.length) return;
  allNotesOff();
  midiOutIndex = ((i % midiOutputs.length) + midiOutputs.length) % midiOutputs.length;
  setupGsPrograms();
}
function nextOutput() { selectOutput(midiOutIndex + 1); }

// Only for Windows' GS synth, which plays piano on every channel by default:
// give each channel its own General MIDI sound. Never sent to other ports,
// so it can't change instrument presets in FL.
function setupGsPrograms() {
  const out = currentOutput();
  if (!out || !/GS Wavetable/i.test(out.name)) return;
  const programs = [72, 81, 73, 80, 71];   // piccolo; saw lead, flute, square lead; clarinet
  programs.forEach((p, ch) => send(out, [0xc0 | ch, p]));
}

function velocity(a) { return Math.round(20 + 107 * constrain(a, 0, 1)); }

// Every MIDI message goes through here. If the port fails (closed, or muted
// by loopMIDI), live out switches off with a message instead of an error
// stopping the whole sketch.
function send(out, data, t) {
  if (!liveOut && (data[0] & 0xf0) === 0x90) return;   // no new notes once live is off
  try { out.send(data, t); }
  catch (e) {
    liveOut = false; liveOn.clear(); stepState.clear();
    midiStatus = 'port lost: press O to retry';
  }
}

// Chrome stops draw() while the window is hidden (minimized, or covered by
// FL). Stop every note so nothing hangs; the scheduler resyncs on return.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && liveOut) allNotesOff();
});

// Free tracks, called every frame while playing.
function updateLiveMidi(col) {
  const out = currentOutput();
  if (!out) return;
  const gate = gateLevel();
  const U = loops * dispW + playX, capCols = dispW * MAX_NOTE_BEATS / (bars * 4);
  const wanted = new Map();   // channel -> Map(pitch -> amplitude)
  for (const d of trackDefs()) {
    if (!d.on || d.len !== 'free') continue;
    const m = new Map();
    for (const [p, a] of columnPitches(col, d)) if (a >= gate) m.set(p, a);
    wanted.set(d.channel, m);
  }
  // note-offs first: notes that stopped, or whose track was switched off or stepped
  for (const [ch, on] of liveOn) {
    const w = wanted.get(ch) || new Map();
    for (const p of [...on.keys()]) {
      if (!w.has(p)) { send(out, [0x80 | ch, p, 0]); on.delete(p); }
    }
  }
  for (const [ch, w] of wanted) {
    if (!liveOn.has(ch)) liveOn.set(ch, new Map());
    const on = liveOn.get(ch);
    for (const [p, a] of w) {
      if (on.has(p)) {
        if (U - on.get(p) < capCols) continue;
        send(out, [0x80 | ch, p, 0]);              // held to the cap: restart
      }
      send(out, [0x90 | ch, p, velocity(a)]);
      on.set(p, U);                                // where the note started
    }
  }
}

// Stepped tracks, called every frame while playing. Positions are in
// "unwrapped" columns (loop count * dispW + playX), so step b of the endless
// grid sits at b * dispW / n, and step index b % n reads the same columns as
// the export. Every step boundary inside the lookahead window is sent now,
// timestamped for when the playhead will reach it.
function scheduleSteps(now) {
  const out = currentOutput();
  if (!out) return;
  const colsPerMs = dispW / (sweepSeconds() * 1000);
  const U = loops * dispW + playX, horizon = U + LOOKAHEAD_MS * colsPerMs;
  const gate = gateLevel();
  for (const d of trackDefs()) {
    let st = stepState.get(d.channel);
    const stepped = d.on && d.len !== 'free';
    if (st && (!stepped || st.len !== d.len || st.bars !== bars)) {
      endSteps(st, out, now); stepState.delete(d.channel); st = null;
    }
    if (!stepped) continue;
    if (!st) {
      const ranges = stepRanges(d.len);
      // start with the step the playhead is in (its time has passed: send now)
      st = { ch: d.channel, len: d.len, bars, ranges, n: ranges.length, b: floor(U * ranges.length / dispW), sounding: new Map(), lastT: now };
      stepState.set(d.channel, st);
    }
    // More than a step behind (draw() was paused while the window was
    // hidden): jump to the current step instead of sending every missed one
    // in a single burst.
    if ((st.b + 1) * dispW / st.n < U) {
      endSteps(st, out, now);
      st.b = floor(U * st.n / dispW);
    }
    const ch = d.channel, stepBeats = LENGTH_BEATS[d.len];
    for (;;) {
      const Ub = st.b * dispW / st.n;
      if (Ub >= horizon) break;
      const t = max(now, now + (Ub - U) / colsPerMs);
      const [c0, c1] = st.ranges[st.b % st.n];
      const cols = [];
      for (let c = c0; c < c1; c++) cols[c] = columnPitches(c, d);
      const w = new Map();
      for (const [p, a] of stepValues(cols, c0, c1, d.read)) if (a >= gate) w.set(p, a);
      // offs before ons at the same timestamp: retrigger ends every note,
      // tie only ends the ones that stopped
      for (const p of [...st.sounding.keys()]) {
        const atCap = (st.b + 1 - st.sounding.get(p)) * stepBeats > MAX_NOTE_BEATS;
        if (!w.has(p) || !d.tie || atCap) { send(out, [0x80 | ch, p, 0], t); st.sounding.delete(p); }
      }
      for (const [p, a] of w) {
        if (st.sounding.has(p)) continue;
        send(out, [0x90 | ch, p, velocity(a)], t);
        st.sounding.set(p, st.b);   // the step the note started on
      }
      st.lastT = t;
      st.b++;
    }
  }
}

// Stop a stepped track's notes: now, and again just after the last message
// already scheduled (a note-on queued for later would otherwise hang).
function endSteps(st, out, now) {
  for (const p of st.sounding.keys()) {
    send(out, [0x80 | st.ch, p, 0]);
    send(out, [0x80 | st.ch, p, 0], max(now, st.lastT) + 1);
  }
  st.sounding.clear();
}

function allNotesOff() {
  const out = currentOutput();
  if (out) {
    const now = performance.now();
    for (const [ch, on] of liveOn) for (const p of on.keys()) send(out, [0x80 | ch, p, 0]);
    for (const st of stepState.values()) endSteps(st, out, now);
    for (let ch = 0; ch < trackSettings.length; ch++) {
      send(out, [0xb0 | ch, 123, 0]);                          // All Notes Off
      send(out, [0xb0 | ch, 123, 0], now + LOOKAHEAD_MS + 5);  // after anything queued
    }
  }
  liveOn.clear();
  stepState.clear();
}

// ---------- controls under the canvas ----------
// HTML controls for the MIDI tracks, kept in sync with the keys both ways:
// they write the same variables the keys do, and are refreshed from those
// variables every frame (except the one being touched).

let ui = null;

function el(tag, parent, attrs = {}, text = '') {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
// Hand focus back to the page after using a control, so keys work again.
function onUse(e, type, fn) {
  e.addEventListener(type, ev => { fn(ev); if (type !== 'input') e.blur(); });
  if (type === 'input') e.addEventListener('change', () => e.blur());
}
function options(select, values, labels = values) {
  values.forEach((v, i) => el('option', select, { value: v }, String(labels[i])));
}

function buildControls() {
  const box = el('div', document.querySelector('main'), { id: 'controls' });
  const g = el('div', box, { class: 'global' });
  ui = { tracks: [] };

  const file = el('input', g, { type: 'file', accept: 'image/*', style: 'display:none' });
  const loadBtn = el('button', g, {}, 'Load image…');
  loadBtn.addEventListener('click', () => { loadBtn.blur(); file.click(); });
  file.addEventListener('change', () => { loadImageFile(file.files[0]); file.value = ''; file.blur(); });
  ui.imgName = el('span', g, { class: 'dim', title: 'or drop an image file anywhere on the page' });

  const lab = (t) => el('label', g, {}, t);
  ui.split = el('select', lab('Tracks 2-4 '));
  options(ui.split, ['thirds', 'rgb'], ['thirds', 'R G B']);
  onUse(ui.split, 'change', () => { split = ui.split.value; });

  const bpmL = lab('Tempo ');
  ui.bpm = el('input', bpmL, { type: 'range', min: 40, max: 240, step: 1 });
  ui.bpmText = el('span', bpmL, { class: 'num' });
  onUse(ui.bpm, 'input', () => { bpm = Number(ui.bpm.value); presetName = ''; });

  ui.bars = el('select', lab('Bars '));
  options(ui.bars, BAR_CHOICES);
  onUse(ui.bars, 'change', () => { bars = Number(ui.bars.value); presetName = ''; });
  ui.sweep = el('span', g, { class: 'dim' });

  ui.exportBtn = el('button', g, {}, 'Export MIDI (M)');
  onUse(ui.exportBtn, 'click', () => exportMidi());
  ui.liveBtn = el('button', g, {});
  onUse(ui.liveBtn, 'click', () => toggleLiveOut());
  ui.port = el('select', lab('Port '));
  ui.portNames = null;
  onUse(ui.port, 'change', () => selectOutput(Number(ui.port.value)));

  const table = el('table', box);
  const head = el('tr', table);
  ['on', 'ch', 'track', 'note length', 'step reads', 'held ink'].forEach(h => el('th', head, {}, h));
  trackSettings.forEach((t, i) => {
    const tr = el('tr', table);
    tr.addEventListener('mousedown', () => { selTrack = i; });
    const on = el('input', el('td', tr), { type: 'checkbox' });
    onUse(on, 'change', () => { t.on = on.checked; });
    el('td', tr, { class: 'dim' }, String(i + 1));
    const name = el('td', tr);
    const lenTd = el('td', tr);
    const len = el('input', lenTd, { type: 'range', min: 0, max: LENGTHS.length - 1, step: 1 });
    const lenText = el('span', lenTd, { class: 'num' });
    onUse(len, 'input', () => { t.len = LENGTHS[Number(len.value)]; });
    const read = el('select', el('td', tr));
    options(read, READS, ['first column', 'average', 'max']);
    onUse(read, 'change', () => { t.read = read.value; });
    const tie = el('select', el('td', tr));
    options(tie, ['retrigger', 'tie']);
    onUse(tie, 'change', () => { t.tie = tie.value === 'tie'; });
    ui.tracks.push({ tr, on, name, len, lenText, read, tie });
  });
}

function setIfIdle(e, prop, v) {
  if (document.activeElement !== e && e[prop] !== v) e[prop] = v;
}

function syncControls() {
  if (!ui) return;
  ui.imgName.textContent = imageStatus || `${imgName} (or drop an image here)`;
  ui.imgName.classList.toggle('warn', !!imageStatus);
  setIfIdle(ui.split, 'value', split);
  setIfIdle(ui.bpm, 'value', String(bpm));
  ui.bpmText.textContent = `${bpm} bpm`;
  setIfIdle(ui.bars, 'value', String(bars));
  ui.sweep.textContent = `= ${sweepSeconds().toFixed(1)} s sweep`;
  ui.liveBtn.textContent = liveOut ? 'Live MIDI: on (O)' : 'Live MIDI: off (O)';
  ui.liveBtn.classList.toggle('active', liveOut);
  const names = midiOutputs.map(o => o.name).join('|');
  if (names !== ui.portNames) {
    ui.portNames = names;
    ui.port.innerHTML = '';
    if (midiOutputs.length) options(ui.port, midiOutputs.map((_, i) => i), midiOutputs.map(o => o.name));
    else options(ui.port, [''], [midiAccess ? '(no ports)' : '(turn on live MIDI)']);
  }
  if (midiOutputs.length) setIfIdle(ui.port, 'value', String(midiOutIndex));
  const defs = trackDefs();
  ui.tracks.forEach((u, i) => {
    const t = trackSettings[i];
    setIfIdle(u.on, 'checked', t.on);
    u.name.textContent = defs[i].name;
    setIfIdle(u.len, 'value', String(LENGTHS.indexOf(t.len)));
    u.lenText.textContent = t.len === '1' ? 'whole' : t.len;
    setIfIdle(u.read, 'value', t.read);
    setIfIdle(u.tie, 'value', t.tie ? 'tie' : 'retrigger');
    u.read.disabled = u.tie.disabled = t.len === 'free';
    u.tr.classList.toggle('sel', i === selTrack);
    u.tr.classList.toggle('off', !t.on);
  });
}

// ---------- draw ----------

function draw() {
  background(27);

  // The playhead runs on the same clock as MIDI timestamps (performance.now),
  // so scheduled steps land where the playhead will be.
  const now = performance.now();
  if (playing) {
    playX += dispW / (sweepSeconds() * 1000) * (now - lastNow);
    while (playX >= dispW) { playX -= dispW; loops++; }
  }
  lastNow = now;
  const col = constrain(floor(playX), 0, dispW - 1);
  if (audio) updateAudio(col);
  else levels = columnVoices(col);
  if (liveOut && playing) { updateLiveMidi(col); scheduleSteps(now); }
  syncControls();

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
    `${bpm} bpm x ${bars} bars = ${sweepSeconds().toFixed(1)}s  ([ ] B)`,
    `grid ${showGrid ? 'on' : 'off'}  (G)`,
    `MIDI tracks: below  (S N UP/DN A T X)`,
    lastExport ? `export: ${lastExport}  (M)` : 'export MIDI  (M)',
    midiStatus ? `MIDI out: ${midiStatus}` : `MIDI out: ${liveOut ? 'on' : 'off'}  (O)`,
  ];
  if (liveOut) {
    const name = currentOutput() ? currentOutput().name : '(none)';
    lines.push(`  port: ${name.length > 24 ? name.slice(0, 23) + '…' : name}  (K)`);
  }
  const w = 230, h = lines.length * 15 + 10;
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
  // a control has focus (e.g. mid-drag on a slider): let it have the key
  const ae = document.activeElement;
  if (ae && /^(INPUT|SELECT|BUTTON)$/.test(ae.tagName)) return;
  if (key === ' ') {
    if (!audio) { audio = buildAudio(); browserAudio(); }
    if (audio.ctx.state === 'suspended' && !liveOut) audio.ctx.resume();
    playing = !playing;
    if (!playing && liveOut) allNotesOff();
    return false;
  }
  if (PRESETS[key]) { applyPreset(PRESETS[key]); return; }
  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
    const step = keyCode === UP_ARROW ? 1 : -1;
    const targets = keyIsDown(SHIFT) ? trackSettings : [trackSettings[selTrack]];
    for (const t of targets) t.len = LENGTHS[constrain(LENGTHS.indexOf(t.len) + step, 0, LENGTHS.length - 1)];
    return false;             // don't scroll the page
  }
  const k = key.toLowerCase();
  if ('cipb=+-_[]'.includes(k)) presetName = '';   // hand-tweaked: no longer the preset
  const sel = trackSettings[selTrack];
  if (k === 'c') colorMode = COLOR_MODES[(COLOR_MODES.indexOf(colorMode) + 1) % COLOR_MODES.length];
  else if (k === 'i') invert = !invert;
  else if (k === 'p') pentatonic = !pentatonic;
  else if (k === 'g') showGrid = !showGrid;
  else if (k === 'r') { playX = 0; if (liveOut) allNotesOff(); }
  else if (k === 'm') exportMidi();
  else if (k === 'o') toggleLiveOut();
  else if (k === 'k') nextOutput();
  else if (k === 's') split = split === 'thirds' ? 'rgb' : 'thirds';
  else if (k === 'n') selTrack = (selTrack + 1) % trackSettings.length;
  else if (k === 'a') sel.read = READS[(READS.indexOf(sel.read) + 1) % READS.length];
  else if (k === 't') sel.tie = !sel.tie;
  else if (k === 'x') sel.on = !sel.on;
  else if (k === 'b') bars = BAR_CHOICES[(BAR_CHOICES.indexOf(bars) + 1) % BAR_CHOICES.length];
  else if (key === '=' || key === '+') threshold = min(0.95, round((threshold + 0.05) * 100) / 100);
  else if (key === '-' || key === '_') threshold = max(0, round((threshold - 0.05) * 100) / 100);
  else if (key === '[') bpm = max(40, bpm - 5);
  else if (key === ']') bpm = min(240, bpm + 5);
}

function mousePressed() {
  if (mouseX >= 0 && mouseX < dispW && mouseY >= 0 && mouseY < height) {
    playX = mouseX;
    if (liveOut) allNotesOff();
  }
}
