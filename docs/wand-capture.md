# Plan: wand-capture.js (p5 → lightWand sequences)

**Status:** built and tested, 2026-10-07. Handoff from the lightWand repo (step 6 of
`lightWand/docs/frame-sequence-plan.md`).

- **Helper:** `common/js/wand-capture.js`, with `add()`, `grab()` (row, column, from/to
  line, points path, `source` buffer, `reverse`), `save()` (also automatic when full),
  `drawStrip()` and `isFull`. No keys are built in; each sketch decides.
- **First sketch:** `generative/cellularAutomata/ca_test.html`. It runs any elementary
  rule (`RULE`) for `FRAMES` generations, one frame each, and saves automatically. Press S
  to save early.
- **Tests:**
  - `grab()` checked against known gradients at pixel density 1 and 2.
  - The rule 90 output loads with lightWand's `FrameSequence.load`: 400 frames,
    100 LEDs, 40 fps, with seed and params intact.
- **Files:** saved as `name_s<seed>_<timestamp>.png/.json`, so downloads never collide.
- **PNG format:** browsers always write RGBA PNGs. Alpha is 255 everywhere, and
  `FrameSequence.load` converts to RGB.

## Goal

A small helper in `common/js/wand-capture.js` that any p5 sketch in this repo can call
to record what it draws as a **lightWand frame sequence**: a PNG strip plus a JSON file.
lightWand's Python tools then preview it, take snapshots of it, and paint it with the
LED wand. Existing sketches can be extended with it, and new ones written for it.

The wand is a strip of **100 LEDs**. Each frame is one row of 100 colors. Moving the
wand during a long-exposure photo turns the sequence of frames into a picture.

## How a sketch uses it

Capture happens **while the sketch draws**, one frame per step: draw, record a frame,
draw again, record the next. Nothing waits for the screen to be finished. After N frames
(or on a key), the helper saves the two files.

Three kinds of sketch, and what the helper needs for each:

1. **Builds one line per step** (e.g. a 1D cellular automaton drawing generation *n*
   at row *n*):
   - `capture.add(colors)`: hand over the frame's colors directly (an array of p5
     colors or `[r, g, b]`), skipping the canvas. Best for automata: the cells *are* the
     frame, so there's no pixel reading, resize blur or pixel-density issue. With 100
     cells it maps 1:1 to the LEDs; other lengths get resized to 100.
   - or `capture.grab({ at: y })`: sample the line just drawn, with the position
     moving each step.
2. **Whole canvas keeps changing** (flow fields, particles, smoke): sample the **same**
   line every step, like a slit-scan camera: `capture.grab()` with a fixed `at` from
   the options. The line is resized to 100 pixels.
3. **A finished picture**: no helper needed. Save the canvas as an ordinary image
   (`saveCanvas`) and give it to lightWand's `paint.py`, which slices a picture
   itself and stretches it over the exposure. Use the helper instead when the order
   things were drawn in should be what the wand plays.

Possible shape (not fixed, decide while building):

```js
<script src="/common/js/wand-capture.js"></script>

let capture;

function setup() {
  createCanvas(400, 400);
  pixelDensity(1);
  randomSeed(42); noiseSeed(42);            // reproducible output
  capture = new WandCapture({
    name: "rule30", fps: 40, frames: 400,   // 400 frames = 10 s at 40 fps
    sample: "row", at: height - 1,          // which line of the canvas becomes the wand
    seed: 42, params: { rule: 30 },         // recorded in the JSON
  });
}

function draw() {
  // ... the sketch ...
  capture.grab();   // one frame per draw(); saves automatically when full
}

// Or, for an automaton: capture.add(cellColors) once per generation.
```

## Output format (the contract with lightWand)

This has to match exactly. lightWand loads it with `FrameSequence.load` in
`lightWand/python/sequence.py`.

**`name.png`: the strip**
- Width = number of frames, height = number of LEDs (**100**).
- **Column 0 = first frame**, left to right in playback order.
- **Row 0 = LED 0 = the wand's tip.** Each column, top to bottom, is LED 0 to LED 99.
- Plain 8-bit RGB, fully opaque (alpha 255 everywhere). Write it from a
  `createGraphics(frames, 100)` with `pixelDensity(1)`, so one pixel = one LED.

**`name.json`: metadata, same base name**

```json
{
  "fps": 40,
  "frames": 400,
  "num_leds": 100,
  "generator": "p5:rule30",
  "params": {"rule": 30, "sample": "row", "at": 399},
  "seed": 42,
  "source": null,
  "notes": ""
}
```

- `fps` matters most: it sets the playback speed. Without a JSON, lightWand assumes 100.
- `generator`, `params` and `seed` are for reproducing a sequence later. Record the
  sketch name and every setting that affects the output.
- `frames` and `num_leds` are informational. lightWand reads the real values from the PNG.

## Details to get right

- **One frame per simulation step, not per clock tick.** Then a slow frame in the
  browser doesn't change the result, and with `randomSeed`/`noiseSeed` set the same
  sketch always produces the same sequence.
- **Pixel density.** On a high-DPI screen the canvas has more pixels than `width × height`.
  Either use `pixelDensity(1)` in capture sketches, or read pixels in a density-aware way.
- **Resizing a line to 100 px.** Average the pixels that fall into each LED's span (box
  filter), rather than picking one pixel per LED (nearest), which can flicker on fine detail.
- **Sampling options.** At least a row or a column, at a chosen position. Decide which
  end is LED 0, for example left end for a row and top end for a column, with a reverse option.
- **Sampling along any path (wanted).** Beyond rows and columns, let a grab follow any
  line or path, with LED 0 at the start of the path:
  - a straight line between two points: `grab({ from: [x1, y1], to: [x2, y2] })`
  - a list of points (circle, spiral, curve): `grab({ points: [[x, y], ...] })`,
    resampled evenly along its length to 100 LEDs
  Sample by averaging around each point, as for rows.
- **Any number of grabs per step is fine, and intended.** Every call adds one frame, so
  sketches can loop: every row per step (the wand replays the evolving canvas), a scan
  line that moves or bounces, several interleaved lines, the same line repeated (slow
  motion), reversed or shuffled order. Frames are time on the wand, so sequences grow
  fast (400 grabs per step at 40 fps = 10 s of exposure per step); keep the size limit
  below in mind. Tie grabs to the step count, not the clock, so output stays reproducible.
- **Don't color-correct for the LEDs.** Save the colors as they look on screen. The wand
  applies gamma 2.2 itself (`LightWand(gamma=2.2)`), and brightness is handled by the wand
  and the camera.
- **Palettes.** `common/js/palette.js` uses the same palette format as
  `lightWand/palettes.json` (a separate copy), so palette names carry over.
- **Size.** A minute at 40 fps is 2,400 × 100 px, which is small. Browsers cap a canvas at
  roughly 16,000–32,000 px wide, so very long captures need a limit or splitting.

## Saving and moving the files

- Browsers save to **Downloads**. Two files download, so the browser may ask once to
  allow multiple downloads.
- If a file with that name already exists, the browser renames the new one (`rule30 (1).png`),
  which breaks the PNG/JSON pairing. Use unique names (for example add the seed or a
  timestamp) or clear old ones.
- **For now: move both files by hand** into `lightWand/sequences/` (gitignored there).

## Checking the output in lightWand

From `lightWand/python/`, with the venv's Python:

- **Watch it:** set `INPUT_FILE = "../sequences/rule30"` in `generate.py` and run it.
  It loops, and you can snapshot parts of it with `[`, `]` and `S`. With
  `OUTPUT = "both"` the wand shows it too.
- **See the photo:** `python paint.py ../sequences/rule30`
- **Paint it:** `python paint.py ../sequences/rule30 --output both` (or `--output wand`),
  with `EXPOSURE_SECONDS = None` in `paint.py` to play it at its own length.

A quick correctness check: open the PNG in an image viewer. It should look like the
sketch's sampled line over time, with time running left to right.

## To decide in this repo

- The first sketch, and which folder it goes in. Suggested first sketch: a 1D cellular
  automaton (*Nature of Code* ch. 7, e.g. rule 30 or 90). Each generation is one row, so
  there's no sampling to get wrong, which makes it a good first test.
- The exact API (options object, method names), and whether start/stop/save keys are built in.
- Optional: draw the captured strip on the canvas while recording, as a live check.

## Not in scope

- A live bridge from the browser to the wand (lightWand plan step 7, later, only if needed).
- Moving files out of Downloads automatically.
