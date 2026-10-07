/*
  wand-capture.js — record what a p5 sketch draws as a lightWand frame sequence.

  The lightWand is a strip of 100 LEDs. Each frame is one line of 100 colours;
  moving the wand during a long exposure turns the frames into a picture.
  This helper collects frames while the sketch runs and saves them as:

    name.png   the strip: one column per frame, 100 px tall
               (column 0 = first frame, row 0 = LED 0 = the wand's tip)
    name.json  fps and metadata, read by lightWand's FrameSequence.load

  Usage (see docs/wand-capture.md for the full contract):

    capture = new WandCapture({ name: "rule90", fps: 40, frames: 400,
                                seed: 42, params: { rule: 90 } });

    capture.add(colors);            // one frame from an array of colours
    capture.grab({ row: y });       // one frame sampled from the canvas
                                    // (or { source: graphics, ... }):
                                    //   { row: y } | { col: x } |
                                    //   { from: [x1, y1], to: [x2, y2] } |
                                    //   { points: [[x, y], ...] }
    capture.isFull                  // true once `frames` frames are recorded
                                    // (it saves automatically at that point)
    capture.save();                 // save early
    capture.drawStrip(x, y, w, h);  // preview the strip recorded so far

  Add one frame per simulation step, not per clock tick, and seed randomness,
  so the same sketch always produces the same sequence.
*/

const WAND_NUM_LEDS = 100;

function wandClamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Browsers cap canvas width somewhere around 16k-32k px.
const WAND_MAX_FRAMES = 16000;

class WandCapture {
  constructor(options = {}) {
    this.name = options.name || "wand";
    this.fps = options.fps ?? 40;
    this.frames = options.frames ?? 400;
    this.numLeds = options.numLeds ?? WAND_NUM_LEDS;
    this.seed = options.seed ?? null;
    this.params = options.params || {};
    this.generator = options.generator || `p5:${this.name}`;
    this.source = options.source ?? null;
    this.notes = options.notes || "";

    // Save automatically when `frames` frames are recorded.
    this.autoSave = options.autoSave ?? true;

    // Default LED order for grab(): false = LED 0 at the start of the line
    // (left end of a row, top of a column, first point of a path).
    this.reverse = options.reverse ?? false;

    // The p5 instance to read from and save with (global mode by default).
    this._p = options.p5 || null;

    this.recorded = []; // one Uint8ClampedArray(numLeds * 3) per frame
    this.saved = false;
    this._warnedFull = false;
    this._preview = null;
  }

  get p() {
    return this._p || p5.instance;
  }

  get count() {
    return this.recorded.length;
  }

  get isFull() {
    return this.recorded.length >= this.frames;
  }

  // ── Adding frames ──────────────────────────────────────────────────────────

  // One frame from colours: [r, g, b] arrays, p5 colours, CSS strings or grey
  // numbers. Any length; it's resized to numLeds by averaging.
  add(colors, options = {}) {
    const rgb = new Float32Array(colors.length * 3);

    colors.forEach((c, i) => {
      const [r, g, b] = this._toRGB(c);
      rgb[i * 3] = r;
      rgb[i * 3 + 1] = g;
      rgb[i * 3 + 2] = b;
    });

    const reverse = options.reverse ?? false;
    return this._push(this._resample(rgb, colors.length, reverse));
  }

  // One frame sampled from the canvas, or from options.source (a p5.Graphics).
  grab(options = {}) {
    const target = options.source || this.p;
    target.loadPixels();

    const reverse = options.reverse ?? this.reverse;
    let rgb;
    let length;

    if (options.row !== undefined || options.col !== undefined) {
      [rgb, length] = this._readRowOrCol(target, options);
    } else {
      const points = options.points || [options.from, options.to];

      if (!points[0] || !points[1]) {
        throw new Error("grab() needs { row }, { col }, { from, to } or { points }.");
      }

      [rgb, length] = this._readPath(target, points);
    }

    return this._push(this._resample(rgb, length, reverse));
  }

  // ── Saving ─────────────────────────────────────────────────────────────────

  save() {
    if (this.recorded.length === 0) {
      console.warn("WandCapture: nothing recorded yet.");
      return;
    }

    const p = this.p;
    const n = this.recorded.length;

    const strip = p.createGraphics(n, this.numLeds);
    strip.pixelDensity(1);
    strip.loadPixels();

    for (let x = 0; x < n; x++) {
      const frame = this.recorded[x];

      for (let led = 0; led < this.numLeds; led++) {
        const i = 4 * (led * n + x);
        strip.pixels[i] = frame[led * 3];
        strip.pixels[i + 1] = frame[led * 3 + 1];
        strip.pixels[i + 2] = frame[led * 3 + 2];
        strip.pixels[i + 3] = 255; // fully opaque
      }
    }

    strip.updatePixels();

    // A unique name, so downloads never collide ("name (1).png" would break
    // the PNG/JSON pairing).
    const seedPart = this.seed !== null ? `_s${this.seed}` : "";
    const base = `${this.name}${seedPart}_${this._timestamp()}`;

    p.saveCanvas(strip, base, "png");
    p.saveJSON(this.metadata(), `${base}.json`);
    strip.remove();

    this.saved = true;
    console.log(`WandCapture: saved ${base}.png and ${base}.json (${n} frames).`);
    return base;
  }

  metadata() {
    return {
      fps: this.fps,
      frames: this.recorded.length,
      num_leds: this.numLeds,
      generator: this.generator,
      params: this.params,
      seed: this.seed,
      source: this.source,
      notes: this.notes
    };
  }

  // ── Preview ────────────────────────────────────────────────────────────────

  // Draws the strip recorded so far: time left to right, LED 0 at the top.
  drawStrip(x, y, w, h) {
    const p = this.p;

    if (!this._preview || this._preview.width !== this.frames) {
      this._preview = p.createImage(this.frames, this.numLeds);
      this._previewDrawn = 0;
    }

    const img = this._preview;
    img.loadPixels();

    for (let f = this._previewDrawn; f < Math.min(this.recorded.length, this.frames); f++) {
      const frame = this.recorded[f];

      for (let led = 0; led < this.numLeds; led++) {
        const i = 4 * (led * this.frames + f);
        img.pixels[i] = frame[led * 3];
        img.pixels[i + 1] = frame[led * 3 + 1];
        img.pixels[i + 2] = frame[led * 3 + 2];
        img.pixels[i + 3] = 255;
      }
    }

    this._previewDrawn = Math.min(this.recorded.length, this.frames);
    img.updatePixels();
    p.image(img, x, y, w, h);
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  _push(frame) {
    if (this.recorded.length >= WAND_MAX_FRAMES) {
      if (!this._warnedFull) {
        console.warn(`WandCapture: limit of ${WAND_MAX_FRAMES} frames reached; extra frames ignored.`);
        this._warnedFull = true;
      }
      return this;
    }

    this.recorded.push(frame);

    if (this.autoSave && !this.saved && this.recorded.length === this.frames) {
      this.save();
    }

    return this;
  }

  _toRGB(c) {
    if (typeof c === "number") {
      return [c, c, c];
    }
    if (Array.isArray(c)) {
      return [c[0], c[1], c[2]];
    }
    if (c && c.levels) {
      return c.levels; // p5.Color
    }
    return this.p.color(c).levels; // CSS string
  }

  // Box-filter resample of `length` RGB values to numLeds: each LED averages
  // the source values its span covers, weighted by overlap.
  _resample(rgb, length, reverse) {
    const out = new Uint8ClampedArray(this.numLeds * 3);
    const span = length / this.numLeds;

    for (let led = 0; led < this.numLeds; led++) {
      const start = led * span;
      const end = start + span;
      let r = 0, g = 0, b = 0, total = 0;

      for (let i = Math.floor(start); i < Math.ceil(end) && i < length; i++) {
        const weight = Math.min(end, i + 1) - Math.max(start, i);
        if (weight <= 0) continue;
        r += rgb[i * 3] * weight;
        g += rgb[i * 3 + 1] * weight;
        b += rgb[i * 3 + 2] * weight;
        total += weight;
      }

      const o = (reverse ? this.numLeds - 1 - led : led) * 3;
      out[o] = r / total;
      out[o + 1] = g / total;
      out[o + 2] = b / total;
    }

    return out;
  }

  // Reads a full row or column at device-pixel resolution, so pixel density
  // doesn't matter.
  _readRowOrCol(target, line) {
    const d = target.pixelDensity();
    const pw = target.width * d;
    const ph = target.height * d;
    const isRow = line.row !== undefined;
    const pos = Math.floor(wandClamp(isRow ? line.row : line.col, 0, (isRow ? target.height : target.width) - 1) * d);
    const length = isRow ? pw : ph;
    const rgb = new Float32Array(length * 3);

    for (let i = 0; i < length; i++) {
      const px = isRow ? i : pos;
      const py = isRow ? pos : i;
      const p = 4 * (py * pw + px);
      rgb[i * 3] = target.pixels[p];
      rgb[i * 3 + 1] = target.pixels[p + 1];
      rgb[i * 3 + 2] = target.pixels[p + 2];
    }

    return [rgb, length];
  }

  // Samples along a polyline (a straight line is two points), evenly spaced by
  // length: several samples per LED, averaged by _resample.
  _readPath(target, points) {
    const d = target.pixelDensity();
    const pw = target.width * d;
    const ph = target.height * d;

    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      lengths.push(lengths[i - 1] + Math.hypot(x1 - x0, y1 - y0));
    }
    const total = lengths[lengths.length - 1];

    // About one sample per device pixel along the path, at least 4 per LED.
    const count = Math.max(this.numLeds * 4, Math.ceil(total * d));
    const rgb = new Float32Array(count * 3);
    let segment = 1;

    for (let i = 0; i < count; i++) {
      const dist = ((i + 0.5) / count) * total;
      while (segment < points.length - 1 && lengths[segment] < dist) {
        segment++;
      }

      const [x0, y0] = points[segment - 1];
      const [x1, y1] = points[segment];
      const segLen = lengths[segment] - lengths[segment - 1];
      const t = segLen > 0 ? (dist - lengths[segment - 1]) / segLen : 0;

      const px = wandClamp(Math.floor((x0 + (x1 - x0) * t) * d), 0, pw - 1);
      const py = wandClamp(Math.floor((y0 + (y1 - y0) * t) * d), 0, ph - 1);
      const p = 4 * (py * pw + px);

      rgb[i * 3] = target.pixels[p];
      rgb[i * 3 + 1] = target.pixels[p + 1];
      rgb[i * 3 + 2] = target.pixels[p + 2];
    }

    return [rgb, count];
  }

  _timestamp() {
    const n = new Date();
    const pad = v => String(v).padStart(2, "0");
    return `${n.getFullYear()}${pad(n.getMonth() + 1)}${pad(n.getDate())}-` +
      `${pad(n.getHours())}${pad(n.getMinutes())}${pad(n.getSeconds())}`;
  }
}
